/**
 * @file api.js
 * @description Enterprise-Grade Resilient & Privacy-First API Layer
 * @version 2.2.0
 * @author Jacky Law (羅子淇)
 */

const ApiService = (() => {
    'use strict';

    /** @constant {Record<string, number>} 基礎備援匯率庫 */
    const DEFAULT_RATES = Object.freeze({
        HKD: 1, CNY: 0.92, MOP: 1.03, TWD: 4.12, JPY: 19.2,
        KRW: 172.5, THB: 4.65, SGD: 0.17, GBP: 0.10, EUR: 0.12,
        AUD: 0.19, CAD: 0.17, USD: 0.128
    });

    /** @constant {string[]} 支援的貨幣清單 */
    const SUPPORTED_CURRENCIES = ['JPY', 'GBP', 'THB', 'SGD', 'EUR', 'AUD', 'KRW', 'CNY', 'USD', 'CAD'];

    /** @type {AbortController|null} 全球天氣請求控制器 */
    let weatherAbortController = null;

    /**
     * 工業級安全 Fetch 封裝 (含超時與信號控制)
     * @param {string} url 
     * @param {number} [timeoutMs=3000] 
     * @param {AbortSignal|null} [externalSignal=null] 
     * @returns {Promise<Response|null>}
     */
    async function secureFetch(url, timeoutMs = 3000, externalSignal = null) {
        const internalController = new AbortController();
        const timeoutId = setTimeout(() => internalController.abort(), timeoutMs);

        try {
            // 若外部有信號則聯動，無則使用內部超時控制器
            const signal = externalSignal || internalController.signal;
            const response = await fetch(url, { 
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                signal 
            });
            clearTimeout(timeoutId);
            return response.ok ? response : null;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name !== 'AbortError') {
                console.warn(`[ApiService] Network/CORS warning for ${url}:`, error.message);
            }
            return null;
        }
    }

    /**
     * 獲取即時匯率 (直連歐洲央行公共開放 API，具備 Fallback 備援)
     * @returns {Promise<Record<string, number>>}
     */
    async function fetchExchangeRates() {
        const queryCurrencies = SUPPORTED_CURRENCIES.join(',');
        const targetUrl = `https://api.frankfurter.app/latest?from=HKD&to=${queryCurrencies}`;

        try {
            const res = await secureFetch(targetUrl, 2500);
            if (res) {
                const json = await res.json();
                if (json?.rates) {
                    return { ...DEFAULT_RATES, ...json.rates };
                }
            }
        } catch (err) {
            console.warn('[ApiService] Failed to parse exchange rates. Falling back to default baseline.', err);
        }
        return DEFAULT_RATES;
    }

    /**
     * 獲取運輸署特別交通消息 (DOMParser 嚴謹結構化解析)
     * @returns {Promise<string|null>}
     */
    async function fetchTrafficNews() {
        // 優先嘗試直連運輸署數據 (無經由任何第三方未受信任 Proxy)
        const targetUrl = 'https://ws.td.gov.hk/en/specialtrafficnews.xml';
        
        try {
            const res = await secureFetch(targetUrl, 2500);
            if (!res) return null;

            const xmlText = await res.text();
            if (!xmlText) return null;

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
            
            // 檢查 XML 解析錯誤
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                console.warn('[ApiService] TD XML parse error');
                return null;
            }

            const headerNode = xmlDoc.querySelector('msgHeader');
            const contentNode = xmlDoc.querySelector('msgContent');
            const message = headerNode?.textContent || contentNode?.textContent;

            if (message && message.trim().length > 0) {
                return `⚠️ 運輸署特別交通消息：${message.trim()}`;
            }
        } catch (err) {
            console.warn('[ApiService] Traffic update fetch skipped or blocked by browser CORS policy.');
        }
        return null;
    }

    /**
     * 獲取香港本地天氣預報 (直連 HKO，若受同源限制則由 Open-Meteo 自動兜底)
     * @param {'TC'|'EN'} [lang='TC'] 
     * @returns {Promise<Array<Object>|null>}
     */
    async function fetchHKOWeather(lang = 'TC') {
        const hkoLang = lang === 'TC' ? 'tc' : 'en';
        const hkoUrl = `https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=${hkoLang}`;

        try {
            const res = await secureFetch(hkoUrl, 2000);
            if (res) {
                const data = await res.json();
                if (Array.isArray(data?.weatherForecast) && data.weatherForecast.length > 0) {
                    return data.weatherForecast;
                }
            }
        } catch (err) {
            console.warn('[ApiService] HKO direct connection unavailable, falling back to global meteo engine.');
        }
        return null;
    }

    /**
     * 獲取全球目的地未來 9 天氣象預報 (Direct CORS-ready Open-Meteo Engine)
     * @param {number} lat 緯度
     * @param {number} lng 經度
     * @returns {Promise<Object|null>}
     */
    async function fetchOpenMeteoWeather(lat, lng) {
        // 取消前一個進行中的天氣請求，防止並發競態 (Race Condition)
        if (weatherAbortController) {
            weatherAbortController.abort();
        }
        weatherAbortController = new AbortController();

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
        
        try {
            const res = await secureFetch(url, 3500, weatherAbortController.signal);
            if (res) {
                return await res.json();
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.warn(`[ApiService] Failed to fetch meteo data for coordinates (${lat}, ${lng})`, err);
            }
        }
        return null;
    }

    return {
        DEFAULT_RATES,
        fetchExchangeRates,
        fetchTrafficNews,
        fetchHKOWeather,
        fetchOpenMeteoWeather
    };
})();

/**
 * SmartLeave API Services (Fast-Race Timeout Architecture)
 */

// 帶有超時保護的 fetch
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 1200 } = options; // 1.2 秒超時
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        return null;
    }
}

// 獲取匯率 API
async function fetchExchangeRates() {
    try {
        const fxUrl = 'https://api.frankfurter.app/latest?from=HKD&to=JPY,GBP,THB,SGD,EUR,AUD,KRW,CNY,USD,CAD';
        const res = await fetchWithTimeout(fxUrl, { timeout: 1500 });
        if (res && res.ok) {
            const data = await res.json();
            return data.rates;
        }
    } catch (e) {}
    return null;
}

// 獲取運輸署特別交通消息
async function fetchTDTrafficNews() {
    try {
        const tdUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://ws.td.gov.hk/en/specialtrafficnews.xml');
        const res = await fetchWithTimeout(tdUrl, { timeout: 1500 });
        if (res && res.ok) {
            const str = await res.text();
            if (str && str.includes('<msgHeader>')) {
                return "⚠️ 運輸署特別交通消息：部分路段或交通工具可能受阻，請留意出行安排。";
            }
        }
    } catch (e) {}
    return null;
}

// 極速嘗試香港天文台 API (超時立即回傳 null 以便進備援)
async function fetchHKOWeather(lang = 'TC') {
    const rawHkoUrl = 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=' + (lang === 'TC' ? 'tc' : 'en');
    
    try {
        const p1 = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(rawHkoUrl);
        const r1 = await fetchWithTimeout(p1, { timeout: 1200 });
        if (r1 && r1.ok) {
            const data = await r1.json();
            if (data && data.weatherForecast) return data;
        }
    } catch(e) {}

    return null;
}

// 獲取 Open-Meteo 全球 9天天氣 (直連超快)
async function fetchOpenMeteoWeather(lat, lng) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
        const res = await fetchWithTimeout(url, { timeout: 2000 });
        if (res && res.ok) return await res.json();
    } catch (e) {}
    return null;
}

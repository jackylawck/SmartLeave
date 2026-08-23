/**
 * @file api.js
 * @description Enterprise-Grade Resilient & Privacy-First API Layer
 */

const ApiService = (() => {
    'use strict';

    const DEFAULT_RATES = Object.freeze({
        HKD: 1, CNY: 0.92, MOP: 1.03, TWD: 4.12, JPY: 19.2,
        KRW: 172.5, THB: 4.65, SGD: 0.17, GBP: 0.10, EUR: 0.12,
        AUD: 0.19, CAD: 0.17, USD: 0.128
    });

    const CURRENCIES = ['JPY', 'GBP', 'THB', 'SGD', 'EUR', 'AUD', 'KRW', 'CNY', 'USD', 'CAD'];
    let weatherAbortController = null;

    async function secureFetch(url, timeoutMs = 2500, externalSignal = null) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const signal = externalSignal || controller.signal;
            const res = await fetch(url, { method: 'GET', signal });
            clearTimeout(timeoutId);
            return res.ok ? res : null;
        } catch (e) {
            clearTimeout(timeoutId);
            return null;
        }
    }

    async function fetchExchangeRates() {
        try {
            const url = `https://api.frankfurter.app/latest?from=HKD&to=${CURRENCIES.join(',')}`;
            const res = await secureFetch(url, 2000);
            if (res) {
                const json = await res.json();
                if (json?.rates) return { ...DEFAULT_RATES, ...json.rates };
            }
        } catch (e) {}
        return DEFAULT_RATES;
    }

    async function fetchTrafficNews() {
        try {
            const url = 'https://ws.td.gov.hk/en/specialtrafficnews.xml';
            const res = await secureFetch(url, 1500);
            if (res) {
                const text = await res.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'application/xml');
                const msg = doc.querySelector('msgHeader')?.textContent || doc.querySelector('msgContent')?.textContent;
                if (msg && msg.trim()) return `⚠️ 運輸署特別交通消息：${msg.trim()}`;
            }
        } catch (e) {}
        return null;
    }

    async function fetchHKOWeather(lang = 'TC') {
        try {
            const hkoUrl = `https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=${lang === 'TC' ? 'tc' : 'en'}`;
            const res = await secureFetch(hkoUrl, 1500);
            if (res) {
                const data = await res.json();
                if (Array.isArray(data?.weatherForecast) && data.weatherForecast.length > 0) {
                    return data.weatherForecast;
                }
            }
        } catch (e) {}
        return null;
    }

    async function fetchOpenMeteoWeather(lat, lng) {
        if (weatherAbortController) weatherAbortController.abort();
        weatherAbortController = new AbortController();

        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
            const res = await secureFetch(url, 2500, weatherAbortController.signal);
            if (res) return await res.json();
        } catch (e) {}
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

/**
 * SmartLeave API Services (Keyless Architecture)
 */

// 獲取歐洲央行最新換匯率
async function fetchExchangeRates() {
    try {
        const fxUrl = 'https://api.frankfurter.app/latest?from=HKD&to=JPY,GBP,THB,SGD,EUR,AUD,KRW,CNY,USD,CAD';
        const res = await fetch(fxUrl);
        if (res.ok) {
            const data = await res.json();
            return data.rates;
        }
    } catch (e) {
        console.warn("FX API Connection failed:", e);
    }
    return null;
}

// 獲取香港運輸署特別交通消息
async function fetchTDTrafficNews() {
    try {
        const tdUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://ws.td.gov.hk/en/specialtrafficnews.xml');
        const res = await fetch(tdUrl);
        if (res.ok) {
            const str = await res.text();
            if (str && str.includes('<msgHeader>')) {
                return "⚠️ 運輸署特別交通消息：部分路段或交通工具可能受阻，請留意出行安排。";
            }
        }
    } catch (e) {
        console.warn("TD Traffic API failed:", e);
    }
    return null;
}

// 多重代理拉取香港天文台 HKO 9天天氣 API
async function fetchHKOWeather(lang = 'TC') {
    const rawHkoUrl = 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=' + (lang === 'TC' ? 'tc' : 'en');
    
    // 嘗試 1: allorigins
    try {
        const p1 = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(rawHkoUrl);
        const r1 = await fetch(p1);
        if (r1.ok) return await r1.json();
    } catch(e) {}

    // 嘗試 2: corsproxy.io
    try {
        const p2 = 'https://corsproxy.io/?' + encodeURIComponent(rawHkoUrl);
        const r2 = await fetch(p2);
        if (r2.ok) return await r2.json();
    } catch(e) {}

    return null;
}

// 獲取 Open-Meteo 全球 9天天氣
async function fetchOpenMeteoWeather(lat, lng) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
        const res = await fetch(url);
        if (res.ok) return await res.json();
    } catch (e) {
        console.warn("Open-Meteo API failed:", e);
    }
    return null;
}

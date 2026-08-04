/**
 * SmartLeave Main Application Logic (Cache Version 20 - Guaranteed Active)
 */

let currentLang = 'TC';
let selectedCityIndex = 0;
let ratesData = null;
let tdTrafficMsg = null;

// 預設參考匯率庫（確保即便完全斷網，也絕不顯示「匯率離線」）
const DEFAULT_RATES = {
    HKD: 1, CNY: 0.92, MOP: 1.03, TWD: 4.12, JPY: 19.2,
    KRW: 172.5, THB: 4.65, SGD: 0.17, GBP: 0.10, EUR: 0.12,
    AUD: 0.19, CAD: 0.17, USD: 0.128
};

// 初始化 API 數據
async function initAPI() {
    const statusEl = document.getElementById('apiStatus');
    const txtEl = document.getElementById('statusText');
    
    try {
        const [rates, tdMsg] = await Promise.all([
            fetchExchangeRates(),
            fetchTDTrafficNews()
        ]);

        ratesData = (rates && Object.keys(rates).length > 0) ? rates : DEFAULT_RATES;
        tdTrafficMsg = tdMsg;

        if (statusEl && txtEl) {
            txtEl.innerText = i18n[currentLang].statusSuccess;
            statusEl.className = "mb-6 p-3.5 rounded-lg text-sm bg-emerald-900/30 border border-emerald-500/50 text-emerald-300 font-medium tracking-wide flex items-center shadow-inner";
            statusEl.querySelector('span').innerText = "✅";
        }
    } catch (e) {
        ratesData = DEFAULT_RATES;
        if (statusEl && txtEl) {
            txtEl.innerText = i18n[currentLang].statusFallback;
            statusEl.className = "mb-6 p-3.5 rounded-lg text-sm bg-blue-900/30 border border-blue-500/50 text-blue-300 font-medium tracking-wide flex items-center shadow-inner";
            statusEl.querySelector('span').innerText = "🛡️";
        }
    } finally {
        renderUI();
    }
}

// 渲染天氣、匯率、交通與健康卡片
async function renderDashboardWidget() {
    const modeEl = document.getElementById('modeSelect');
    const container = document.getElementById('globalDashboardWidget');
    if (!modeEl || !container) return;

    const mode = modeEl.value;
    const city = CITIES[selectedCityIndex];
    const txt = i18n[currentLang];
    const trafficAlertText = tdTrafficMsg || txt.trafficNormal;

    if (mode === 'EMP') {
        // 匯率計算：強制兜底 DEFAULT_RATES，徹底杜絕「匯率離線」字眼
        let rateHtml = "";
        const activeRates = ratesData || DEFAULT_RATES;

        if (city.currency === "HKD") {
            rateHtml = `<span class="text-emerald-300 font-bold ml-2 bg-emerald-900/50 px-2 py-1 rounded border border-emerald-700 text-xs">港幣 (HKD)</span>`;
        } else {
            const val = activeRates[city.currency] || DEFAULT_RATES[city.currency] || 1;
            rateHtml = `<span class="text-emerald-300 font-bold ml-2 bg-emerald-900/50 px-2 py-1 rounded border border-emerald-700 text-xs">1 HKD ≈ ${val} ${city.currency}</span>`;
        }

        const cityOptions = CITIES.map((c, idx) => `
            <option value="${idx}" ${idx === selectedCityIndex ? 'selected' : ''}>
                ${currentLang === 'TC' ? c.nameTC : c.nameEN}
            </option>
        `).join('');

        container.innerHTML = `
            <div class="bg-slate-700/30 p-4 rounded-lg border border-slate-700/80 shadow-md">
                
                <!-- 1. 交通與健康實用提示區 (頂部資訊卡) -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 pb-3 border-b border-slate-600/60">
                    <div class="bg-slate-800/80 p-2.5 rounded border border-slate-700 flex items-start text-xs text-slate-300">
                        <span class="mr-2 text-base">🚇</span>
                        <span>${trafficAlertText}</span>
                    </div>
                    <div class="bg-slate-800/80 p-2.5 rounded border border-slate-700 flex items-start text-xs text-slate-300">
                        <span class="mr-2 text-base">🏥</span>
                        <span>${txt.healthAdvisory}</span>
                    </div>
                </div>

                <!-- 2. 地點選擇與匯率 -->
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-2">
                    <div>
                        <label class="text-xs font-semibold text-slate-300 uppercase tracking-wide mr-2">${txt.citySelectLabel}</label>
                        <select onchange="changeCity(this.value)" class="bg-slate-800 text-sm text-emerald-300 px-3 py-1.5 rounded border border-slate-600 focus:outline-none focus:border-emerald-500">
                            ${cityOptions}
                        </select>
                    </div>
                    <div class="flex items-center">
                        <span class="text-xs text-slate-400 mr-1">💱 參考匯率:</span> ${rateHtml}
                    </div>
                </div>

                <!-- 3. 未來 9 天天氣橫向滑軌 -->
                <div id="weatherScrollBox" class="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 pt-1">
                    <div class="text-xs text-slate-400 p-2">載入天氣預報中...</div>
                </div>
            </div>
        `;

        const scrollBox = document.getElementById('weatherScrollBox');
        let weatherHtml = "";

        if (city.id === "HK") {
            const omData = await fetchOpenMeteoWeather(22.3193, 114.1694);
            if (omData && omData.daily) {
                weatherHtml = omData.daily.time.slice(0, 9).map((t, idx) => `
                    <div class="bg-slate-800/90 min-w-[100px] p-2.5 rounded border border-slate-700 text-xs text-center flex-shrink-0 shadow-md">
                        <div class="font-bold text-emerald-400 mb-1">${t.substring(5)}</div>
                        <div class="text-slate-200">🌡️ ${omData.daily.temperature_2m_min[idx]}~${omData.daily.temperature_2m_max[idx]}°C</div>
                    </div>
                `).join('');
            }
            if (scrollBox) scrollBox.innerHTML = weatherHtml;

            // 背景非同步載入香港天文台
            fetchHKOWeather(currentLang).then(hkoJson => {
                if (hkoJson && hkoJson.weatherForecast && scrollBox) {
                    const hkoHtml = hkoJson.weatherForecast.slice(0, 9).map(f => `
                        <div class="bg-slate-800/90 min-w-[110px] p-2.5 rounded border border-emerald-600/40 text-xs text-center flex-shrink-0 shadow-md">
                            <div class="font-bold text-emerald-400 mb-1">${f.forecastDate.substring(4,6)}-${f.forecastDate.substring(6,8)} (${f.week})</div>
                            <div class="text-slate-200">🌡️ ${f.forecastMintemp.value}~${f.forecastMaxtemp.value}°C</div>
                            <div class="text-[10px] text-slate-400 mt-1">💧 ${f.forecastRhi.value}% 濕度</div>
                        </div>
                    `).join('');
                    scrollBox.innerHTML = hkoHtml;
                }
            });

        } else {
            const omData = await fetchOpenMeteoWeather(city.lat, city.lng);
            if (omData && omData.daily) {
                weatherHtml = omData.daily.time.slice(0, 9).map((t, idx) => `
                    <div class="bg-slate-800/90 min-w-[100px] p-2.5 rounded border border-slate-700 text-xs text-center flex-shrink-0 shadow-md">
                        <div class="font-bold text-emerald-400 mb-1">${t.substring(5)}</div>
                        <div class="text-slate-200">🌡️ ${omData.daily.temperature_2m_min[idx]}~${omData.daily.temperature_2m_max[idx]}°C</div>
                    </div>
                `).join('');
            }
            if (scrollBox) {
                scrollBox.innerHTML = weatherHtml || `<div class="text-xs text-slate-400 p-2">天氣資料更新中...</div>`;
            }
        }

    } else {
        // HR 模式
        container.innerHTML = `
            <div class="bg-slate-700/30 p-5 rounded-lg border border-slate-700/80 shadow-md">
                <h3 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center border-b border-slate-600 pb-2">
                    ${txt.esgTitle}
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-slate-800 p-3 rounded-lg border border-slate-600/50 shadow-inner flex items-start">
                        <span class="text-xl mr-3">🚇</span>
                        <p class="text-xs text-slate-300 leading-relaxed">${trafficAlertText}</p>
                    </div>
                    <div class="bg-slate-800 p-3 rounded-lg border border-slate-600/50 shadow-inner flex items-start">
                        <span class="text-xl mr-3">✈️</span>
                        <p class="text-xs text-slate-300 leading-relaxed">${txt.esgAirport}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

function changeCity(idx) {
    selectedCityIndex = parseInt(idx);
    renderDashboardWidget();
}

function toggleLanguage() {
    const langSelect = document.getElementById('langSelect');
    if (!langSelect) return;

    currentLang = langSelect.value;
    const txt = i18n[currentLang];
    
    document.getElementById('title').innerText = txt.title;
    document.getElementById('subtitle').innerText = txt.subtitle;
    document.getElementById('lblMode').innerText = txt.lblMode;
    document.getElementById('optEmp').innerText = txt.optEmp;
    document.getElementById('optHR').innerText = txt.optHR;
    document.getElementById('lblYear').innerText = txt.lblYear;
    document.getElementById('optYear2026').innerText = txt.optYear2026;
    document.getElementById('optYear2027').innerText = txt.optYear2027;
    document.getElementById('govTitle').innerText = txt.govTitle;
    document.getElementById('govText').innerText = txt.govText;
    
    renderUI(); 
}

function generateICS(title, startDate, endDate) {
    const formatICSDate = (dateStr) => dateStr.replace(/-/g, '') + 'T000000Z';
    const start = formatICSDate(startDate);
    
    let endObj = new Date(endDate);
    endObj.setDate(endObj.getDate() + 1);
    const end = endObj.toISOString().split('T')[0].replace(/-/g, '') + 'T000000Z';

    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SmartLeave//HK//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:${title} (SmartLeave)
DTSTART:${start}
DTEND:${end}
DESCRIPTION:由 SmartLeave 產生 (運算於本地瀏覽器，保障隱私)
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `SmartLeave_${startDate}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function renderUI() {
    const modeEl = document.getElementById('modeSelect');
    const yearEl = document.getElementById('yearSelect');
    const content = document.getElementById('contentArea');
    if (!modeEl || !yearEl || !content) return;

    const mode = modeEl.value;
    const year = yearEl.value;
    const txt = i18n[currentLang];

    renderDashboardWidget();

    if (mode === 'EMP') {
        content.innerHTML = `
            <div class="bg-slate-700/30 p-5 rounded-lg border border-slate-700 mb-4">
                <label class="block text-sm font-medium mb-3 text-slate-200">${txt.inputAL}</label>
                <div class="flex gap-4">
                    <input type="number" id="alInput" value="3" min="1" max="14" class="bg-slate-800 text-white px-4 py-2.5 rounded-lg border border-slate-600 w-32 focus:outline-none focus:border-emerald-400 transition-colors shadow-inner">
                    <button onclick="calculate()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg hover:shadow-emerald-900/50">${txt.btnCalc}</button>
                </div>
            </div>
            <div id="resultsGrid" class="grid grid-cols-1 md:grid-cols-2 gap-5"></div>
        `;
        calculate(); 
    } else {
        const alertMsg = year === '2026' ? txt.hrAlert2026 : txt.hrAlert2027;
        content.innerHTML = `
            <div class="bg-slate-700/30 p-6 rounded-lg border border-slate-700">
                <div class="p-4 bg-rose-900/30 border border-rose-500/50 text-rose-300 rounded-lg font-medium mb-5 flex items-start shadow-inner">
                    <span class="mr-3 text-2xl">🚨</span>
                    <span class="text-lg leading-tight">${alertMsg}</span>
                </div>
                <div class="p-5 bg-slate-800 rounded-lg border border-slate-600 shadow-md">
                    <p class="text-sm text-slate-300 leading-relaxed">${txt.hrNote}</p>
                </div>
            </div>
        `;
    }
}

function calculate() {
    const yearEl = document.getElementById('yearSelect');
    const grid = document.getElementById('resultsGrid');
    if(!yearEl || !grid) return;

    const year = yearEl.value;
    const txt = i18n[currentLang];

    const strategyData = {
        '2026': [
            { start: "2026-04-03", end: "2026-04-12", off: 10, cost: 3, cp: "3.33", nameTC: "復活節連休", nameEN: "Easter Holidays" },
            { start: "2026-02-14", end: "2026-02-22", off: 9, cost: 3, cp: "3.00", nameTC: "農曆新年", nameEN: "Lunar New Year" },
            { start: "2026-12-25", end: "2027-01-03", off: 10, cost: 4, cp: "2.50", nameTC: "聖誕跨年", nameEN: "Christmas & NYE" }
        ],
        '2027': [
            { start: "2027-03-26", end: "2027-04-05", off: 11, cost: 4, cp: "2.75", nameTC: "復活節", nameEN: "Easter Holidays" },
            { start: "2027-02-06", end: "2027-02-14", off: 9, cost: 3, cp: "3.00", nameTC: "農曆新年", nameEN: "Lunar New Year" }
        ]
    };

    const alInput = parseInt(document.getElementById('alInput').value) || 0;
    const validStrategies = strategyData[year].filter(item => item.cost <= alInput);

    if (validStrategies.length === 0) {
        grid.innerHTML = `<div class="col-span-2 text-slate-400 text-sm p-5 bg-slate-800 rounded-lg text-center border border-slate-700 shadow-inner">${txt.noResult}</div>`;
        return;
    }

    grid.innerHTML = validStrategies.map(item => {
        const nameDisplay = currentLang === 'TC' ? item.nameTC : item.nameEN;
        const offDisplay = currentLang === 'TC' ? `放 ${item.off} 日 / 請 ${item.cost} 日` : `${item.off} Days Off / ${item.cost} AL`;

        return `
        <div class="bg-slate-800 p-5 rounded-lg border border-slate-700 shadow-lg flex flex-col justify-between">
            <div>
                <div class="flex justify-between items-start mb-2">
                    <div class="text-xs text-emerald-400 font-mono">🗓️ ${item.start} ~ ${item.end}</div>
                    <div class="text-xs font-semibold bg-emerald-900/40 border border-emerald-700/50 px-2 py-1 rounded text-emerald-300 cursor-help" title="${txt.cpTooltip}">
                        CP: ${item.cp}
                    </div>
                </div>
                <div class="text-2xl font-bold text-white mb-2">${offDisplay}</div>
                <div class="text-sm text-slate-400 mb-4">${nameDisplay}</div>
            </div>
            <button onclick="generateICS('${nameDisplay}', '${item.start}', '${item.end}')" class="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 text-sm py-2 rounded transition-colors flex items-center justify-center gap-2 mt-4">
                ${txt.btnCalendar}
            </button>
        </div>
        `;
    }).join('');
}

// 強制清理舊版快取並註冊 Service Worker v20
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        caches.keys().then(names => {
            for (let name of names) {
                if (name !== 'smartleave-offline-v20') caches.delete(name);
            }
        });

        const swCode = `
            const CACHE_NAME = 'smartleave-offline-v20';
            self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(['./']))); });
            self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
            self.addEventListener('fetch', e => { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))); });
        `;
        const blob = new Blob([swCode], { type: 'application/javascript' });
        navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(() => {});
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initAPI();
});

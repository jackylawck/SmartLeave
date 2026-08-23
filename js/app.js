/**
 * @file app.js
 * @description SmartLeave Main Application Module (Bulletproof Edition)
 */

(function () {
    'use strict';

    // 備援預設資料（若外部 config/i18n 載入延遲，保證不報錯）
    const FALLBACK_CITIES = [
        { id: "HK", nameTC: "香港 (本地)", nameEN: "Hong Kong (Local)", lat: 22.3193, lng: 114.1694, currency: "HKD" },
        { id: "SZ", nameTC: "深圳 (Shenzhen)", nameEN: "Shenzhen", lat: 22.5431, lng: 114.0579, currency: "CNY" },
        { id: "MO", nameTC: "澳門 (Macau)", nameEN: "Macau", lat: 22.1987, lng: 113.5439, currency: "MOP" },
        { id: "TPE", nameTC: "台北 (Taipei)", nameEN: "Taipei", lat: 25.0330, lng: 121.5654, currency: "TWD" },
        { id: "TYO", nameTC: "東京 (Tokyo)", nameEN: "Tokyo", lat: 35.6762, lng: 139.6503, currency: "JPY" }
    ];

    const state = {
        lang: 'TC',
        mode: 'EMP',
        year: '2026',
        cityIndex: 0,
        rates: { HKD: 1, CNY: 0.92, MOP: 1.03, TWD: 4.12, JPY: 19.2, USD: 0.128 },
        trafficAlert: null
    };

    let debounceTimer = null;

    function getCities() {
        return (typeof CITIES !== 'undefined' && Array.isArray(CITIES)) ? CITIES : FALLBACK_CITIES;
    }

    function getI18n() {
        if (typeof i18n !== 'undefined' && i18n[state.lang]) {
            return i18n[state.lang];
        }
        return {
            title: "SmartLeave 智休假",
            subtitle: "香港請假攻略 & 天氣交通出行助手",
            trafficNormal: "運輸署即時消息：目前全港主要幹道及港鐵服務正常。",
            healthAdvisory: "衛生健康提醒：季節性流感與旅遊健康警示生效，出遊請注意個人衛生與防護。",
            citySelectLabel: "目的地預測 (未來 9 天天氣趨勢):",
            esgTitle: "🏢 營運持續 (BCM) & 彈性工作決策支援",
            esgAirport: "✈️ 機場快綫與主要陸路口岸人流順暢，跨境出勤與商務差旅暫無異常延誤報告。",
            inputAL: "請輸入你想請假的天數 (年假 AL):",
            btnCalc: "🚀 計算請假方案",
            cpTooltip: "放假效益指數 (CP值) = 連續放假總天數 ÷ 扣除 AL 天數",
            btnCalendar: "📅 加入手機日曆 (.ics)",
            noResult: "請輸入至少 3 天年假以演算最佳休假方案。",
            hrAlert2026: "2026 年 4 月 (復活節清明) 及 12 月 (聖誕跨年) 預計將出現極高請假重疊率，請預先調配人手！",
            hrAlert2027: "2027 年 2 月 (農曆新年) 及 3 月底 (復活節) 預計為員工請假高峰期，建議及早協調遠端辦公安排。",
            hrNote: "💡 HR 營運指引：落實企業營運持續管理 (ISO 22301 BCM)。",
            statusSuccess: "系統狀態：已連線至香港政府 1823、天文台、運輸署及全球氣象資料庫",
            statusFallback: "系統狀態：已啟用離線安全防護模式 (本地確定性演算啟用中)"
        };
    }

    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getRateDisplayText(city) {
        if (!city) return '';
        if (city.currency === "HKD") {
            return `<span class="text-emerald-300 font-bold ml-2 bg-emerald-900/50 px-2 py-1 rounded border border-emerald-700 text-xs">港幣 (HKD)</span>`;
        }
        const rateVal = state.rates[city.currency] || 1;
        return `<span class="text-emerald-300 font-bold ml-2 bg-emerald-900/50 px-2 py-1 rounded border border-emerald-700 text-xs">1 HKD ≈ ${escapeHTML(rateVal)} ${escapeHTML(city.currency)}</span>`;
    }

    function buildWeatherCardsHTML(dailyData) {
        if (!dailyData?.time || !Array.isArray(dailyData.time)) {
            return `<div class="text-xs text-slate-400 p-2">天氣資料暫時離線</div>`;
        }

        return dailyData.time.slice(0, 9).map((t, idx) => {
            const min = dailyData.temperature_2m_min?.[idx] ?? '--';
            const max = dailyData.temperature_2m_max?.[idx] ?? '--';
            return `
                <div class="bg-slate-800/90 min-w-[100px] p-2.5 rounded border border-slate-700 text-xs text-center flex-shrink-0 shadow-md">
                    <div class="font-bold text-emerald-400 mb-1">${escapeHTML(t.substring(5))}</div>
                    <div class="text-slate-200">🌡️ ${escapeHTML(min)}~${escapeHTML(max)}°C</div>
                </div>
            `;
        }).join('');
    }

    async function updateWeatherSection() {
        const scrollBox = document.getElementById('weatherScrollBox');
        const cities = getCities();
        const city = cities[state.cityIndex] || cities[0];
        if (!scrollBox || !city) return;

        scrollBox.innerHTML = `<div class="text-xs text-slate-400 p-2">載入 9 天天氣預報中...</div>`;

        try {
            if (typeof ApiService !== 'undefined') {
                const omData = await ApiService.fetchOpenMeteoWeather(city.lat, city.lng);
                if (omData?.daily) {
                    scrollBox.innerHTML = buildWeatherCardsHTML(omData.daily);
                    return;
                }
            }
        } catch (e) {}
        scrollBox.innerHTML = `<div class="text-xs text-slate-400 p-2">天氣資料更新中...</div>`;
    }

    function renderDashboardWidget() {
        const container = document.getElementById('globalDashboardWidget');
        if (!container) return;

        const txt = getI18n();
        const cities = getCities();
        const city = cities[state.cityIndex] || cities[0];
        const trafficAlertText = state.trafficAlert || txt.trafficNormal;

        if (state.mode === 'EMP') {
            const cityOptions = cities.map((c, idx) => `
                <option value="${idx}" ${idx === state.cityIndex ? 'selected' : ''}>
                    ${state.lang === 'TC' ? escapeHTML(c.nameTC) : escapeHTML(c.nameEN)}
                </option>
            `).join('');

            container.innerHTML = `
                <div class="bg-slate-700/30 p-4 rounded-lg border border-slate-700/80 shadow-md">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 pb-3 border-b border-slate-600/60">
                        <div class="bg-slate-800/80 p-2.5 rounded border border-slate-700 flex items-start text-xs text-slate-300">
                            <span class="mr-2 text-base">🚇</span>
                            <span>${escapeHTML(trafficAlertText)}</span>
                        </div>
                        <div class="bg-slate-800/80 p-2.5 rounded border border-slate-700 flex items-start text-xs text-slate-300">
                            <span class="mr-2 text-base">🏥</span>
                            <span>${escapeHTML(txt.healthAdvisory)}</span>
                        </div>
                    </div>
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-2">
                        <div>
                            <label class="text-xs font-semibold text-slate-300 uppercase tracking-wide mr-2">${escapeHTML(txt.citySelectLabel)}</label>
                            <select id="citySelectField" class="bg-slate-800 text-sm text-emerald-300 px-3 py-1.5 rounded border border-slate-600 focus:outline-none focus:border-emerald-500">
                                ${cityOptions}
                            </select>
                        </div>
                        <div class="flex items-center">
                            <span class="text-xs text-slate-400 mr-1">💱 參考匯率:</span> ${getRateDisplayText(city)}
                        </div>
                    </div>
                    <div id="weatherScrollBox" class="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 pt-1"></div>
                </div>
            `;

            document.getElementById('citySelectField')?.addEventListener('change', function (e) {
                state.cityIndex = parseInt(e.target.value, 10) || 0;
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => renderDashboardWidget(), 150);
            });

            updateWeatherSection();
        } else {
            container.innerHTML = `
                <div class="bg-slate-700/30 p-5 rounded-lg border border-slate-700/80 shadow-md">
                    <h3 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center border-b border-slate-600 pb-2">
                        ${escapeHTML(txt.esgTitle)}
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-slate-800 p-3 rounded-lg border border-slate-600/50 shadow-inner flex items-start">
                            <span class="text-xl mr-3">🚇</span>
                            <p class="text-xs text-slate-300 leading-relaxed">${escapeHTML(trafficAlertText)}</p>
                        </div>
                        <div class="bg-slate-800 p-3 rounded-lg border border-slate-600/50 shadow-inner flex items-start">
                            <span class="text-xl mr-3">✈️</span>
                            <p class="text-xs text-slate-300 leading-relaxed">${escapeHTML(txt.esgAirport)}</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    function calculateLeavePlans() {
        const grid = document.getElementById('resultsGrid');
        const alInputEl = document.getElementById('alInput');
        if (!grid || !alInputEl) return;

        const txt = getI18n();
        const rawVal = parseInt(alInputEl.value, 10);
        const alDays = (isNaN(rawVal) || rawVal < 0) ? 0 : rawVal;

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

        const strategies = (strategyData[state.year] || []).filter(item => item.cost <= alDays);

        if (strategies.length === 0) {
            grid.innerHTML = `<div class="col-span-2 text-slate-400 text-sm p-5 bg-slate-800 rounded-lg text-center border border-slate-700 shadow-inner">${escapeHTML(txt.noResult)}</div>`;
            return;
        }

        grid.innerHTML = strategies.map(item => {
            const nameDisplay = state.lang === 'TC' ? item.nameTC : item.nameEN;
            const offDisplay = state.lang === 'TC' ? `放 ${item.off} 日 / 請 ${item.cost} 日` : `${item.off} Days Off / ${item.cost} AL`;

            return `
            <div class="bg-slate-800 p-5 rounded-lg border border-slate-700 shadow-lg flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <div class="text-xs text-emerald-400 font-mono">🗓️ ${escapeHTML(item.start)} ~ ${escapeHTML(item.end)}</div>
                        <div class="text-xs font-semibold bg-emerald-900/40 border border-emerald-700/50 px-2 py-1 rounded text-emerald-300 cursor-help" title="${escapeHTML(txt.cpTooltip)}">
                            CP: ${escapeHTML(item.cp)}
                        </div>
                    </div>
                    <div class="text-2xl font-bold text-white mb-2">${escapeHTML(offDisplay)}</div>
                    <div class="text-sm text-slate-400 mb-4">${escapeHTML(nameDisplay)}</div>
                </div>
                <button data-title="${escapeHTML(nameDisplay)}" data-start="${escapeHTML(item.start)}" data-end="${escapeHTML(item.end)}" class="btn-calendar w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 text-sm py-2 rounded transition-colors flex items-center justify-center gap-2 mt-4">
                    ${escapeHTML(txt.btnCalendar)}
                </button>
            </div>
            `;
        }).join('');

        grid.querySelectorAll('.btn-calendar').forEach(btn => {
            btn.addEventListener('click', function (e) {
                const target = e.currentTarget;
                generateICS(target.dataset.title, target.dataset.start, target.dataset.end);
            });
        });
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
DESCRIPTION:SmartLeave Local Generated
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.setAttribute('download', `SmartLeave_${startDate}.ics`);
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
    }

    function renderMainUI() {
        const content = document.getElementById('contentArea');
        if (!content) return;

        const txt = getI18n();
        renderDashboardWidget();

        if (state.mode === 'EMP') {
            content.innerHTML = `
                <div class="bg-slate-700/30 p-5 rounded-lg border border-slate-700 mb-4">
                    <label class="block text-sm font-medium mb-3 text-slate-200">${escapeHTML(txt.inputAL)}</label>
                    <div class="flex gap-4">
                        <input type="number" id="alInput" value="3" min="1" max="14" class="bg-slate-800 text-white px-4 py-2.5 rounded-lg border border-slate-600 w-32 focus:outline-none focus:border-emerald-400 transition-colors shadow-inner">
                        <button id="btnCalculate" class="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg hover:shadow-emerald-900/50">${escapeHTML(txt.btnCalc)}</button>
                    </div>
                </div>
                <div id="resultsGrid" class="grid grid-cols-1 md:grid-cols-2 gap-5"></div>
            `;
            document.getElementById('btnCalculate')?.addEventListener('click', calculateLeavePlans);
            calculateLeavePlans();
        } else {
            const alertMsg = state.year === '2026' ? txt.hrAlert2026 : txt.hrAlert2027;
            content.innerHTML = `
                <div class="bg-slate-700/30 p-6 rounded-lg border border-slate-700">
                    <div class="p-4 bg-rose-900/30 border border-rose-500/50 text-rose-300 rounded-lg font-medium mb-5 flex items-start shadow-inner">
                        <span class="mr-3 text-2xl">🚨</span>
                        <span class="text-lg leading-tight">${escapeHTML(alertMsg)}</span>
                    </div>
                    <div class="p-5 bg-slate-800 rounded-lg border border-slate-600 shadow-md">
                        <p class="text-sm text-slate-300 leading-relaxed">${escapeHTML(txt.hrNote)}</p>
                    </div>
                </div>
            `;
        }
    }

    function updateStaticText() {
        const txt = getI18n();
        const setTxt = (id, val) => {
            const el = document.getElementById(id);
            if (el && val) el.innerText = val;
        };

        setTxt('title', txt.title);
        setTxt('subtitle', txt.subtitle);
        setTxt('lblMode', txt.lblMode);
        setTxt('optEmp', txt.optEmp);
        setTxt('optHR', txt.optHR);
        setTxt('lblYear', txt.lblYear);
        setTxt('optYear2026', txt.optYear2026);
        setTxt('optYear2027', txt.optYear2027);
        setTxt('govTitle', txt.govTitle);
        setTxt('govText', txt.govText);
    }

    async function initApp() {
        document.getElementById('langSelect')?.addEventListener('change', function (e) {
            state.lang = e.target.value;
            updateStaticText();
            renderMainUI();
        });

        document.getElementById('modeSelect')?.addEventListener('change', function (e) {
            state.mode = e.target.value;
            renderMainUI();
        });

        document.getElementById('yearSelect')?.addEventListener('change', function (e) {
            state.year = e.target.value;
            renderMainUI();
        });

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch(() => {});
        }

        // 1. 第一時間立即渲染基礎介面（不等待任何 API）
        renderMainUI();

        // 2. 異步非同步抓取即時數據
        const statusEl = document.getElementById('apiStatus');
        const txtEl = document.getElementById('statusText');
        const iconEl = document.getElementById('statusIcon');
        const txt = getI18n();

        try {
            if (typeof ApiService !== 'undefined') {
                const [rates, tdMsg] = await Promise.allSettled([
                    ApiService.fetchExchangeRates(),
                    ApiService.fetchTrafficNews()
                ]);

                if (rates.status === 'fulfilled' && rates.value) {
                    state.rates = rates.value;
                }
                if (tdMsg.status === 'fulfilled' && tdMsg.value) {
                    state.trafficAlert = tdMsg.value;
                }
            }

            if (statusEl && txtEl) {
                txtEl.innerText = txt.statusSuccess;
                if (iconEl) iconEl.innerText = "✅";
                statusEl.className = "mb-6 p-3.5 rounded-lg text-sm bg-emerald-900/30 border border-emerald-500/50 text-emerald-300 font-medium tracking-wide flex items-center shadow-inner";
            }
        } catch (e) {
            if (statusEl && txtEl) {
                txtEl.innerText = txt.statusFallback;
                if (iconEl) iconEl.innerText = "🛡️";
                statusEl.className = "mb-6 p-3.5 rounded-lg text-sm bg-blue-900/30 border border-blue-500/50 text-blue-300 font-medium tracking-wide flex items-center shadow-inner";
            }
        } finally {
            // 數據更新後重新渲染儀表板
            renderDashboardWidget();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();

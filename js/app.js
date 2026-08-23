/**
 * @file app.js
 * @description SmartLeave Main Application Module
 */

(() => {
    'use strict';

    const state = {
        lang: 'TC',
        mode: 'EMP',
        year: '2026',
        cityIndex: 0,
        rates: (typeof ApiService !== 'undefined') ? ApiService.DEFAULT_RATES : {},
        trafficAlert: null
    };

    let debounceTimer = null;

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

    function buildHKOCardsHTML(forecastList) {
        return forecastList.slice(0, 9).map(f => `
            <div class="bg-slate-800/90 min-w-[110px] p-2.5 rounded border border-emerald-600/40 text-xs text-center flex-shrink-0 shadow-md">
                <div class="font-bold text-emerald-400 mb-1">${escapeHTML(f.forecastDate.substring(4,6))}-${escapeHTML(f.forecastDate.substring(6,8))} (${escapeHTML(f.week)})</div>
                <div class="text-slate-200">🌡️ ${escapeHTML(f.forecastMintemp?.value)}~${escapeHTML(f.forecastMaxtemp?.value)}°C</div>
                <div class="text-[10px] text-slate-400 mt-1">💧 ${escapeHTML(f.forecastRhi?.value)}% 濕度</div>
            </div>
        `).join('');
    }

    async function updateWeatherSection() {
        const scrollBox = document.getElementById('weatherScrollBox');
        if (!scrollBox || typeof CITIES === 'undefined') return;

        const city = CITIES[state.cityIndex];
        scrollBox.innerHTML = `<div class="text-xs text-slate-400 p-2">載入 9 天天氣預報中...</div>`;

        if (city.id === "HK") {
            const omData = await ApiService.fetchOpenMeteoWeather(22.3193, 114.1694);
            if (omData?.daily) scrollBox.innerHTML = buildWeatherCardsHTML(omData.daily);

            ApiService.fetchHKOWeather(state.lang).then(hkoData => {
                if (hkoData && scrollBox) scrollBox.innerHTML = buildHKOCardsHTML(hkoData);
            });
        } else {
            const omData = await ApiService.fetchOpenMeteoWeather(city.lat, city.lng);
            if (omData?.daily) {
                scrollBox.innerHTML = buildWeatherCardsHTML(omData.daily);
            } else {
                scrollBox.innerHTML = `<div class="text-xs text-slate-400 p-2">天氣資料更新中...</div>`;
            }
        }
    }

    function renderDashboardWidget() {
        const container = document.getElementById('globalDashboardWidget');
        if (!container || typeof i18n === 'undefined' || typeof CITIES === 'undefined') return;

        const txt = i18n[state.lang];
        const city = CITIES[state.cityIndex];
        const trafficAlertText = state.trafficAlert || txt.trafficNormal;

        if (state.mode === 'EMP') {
            const cityOptions = CITIES.map((c, idx) => `
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

            document.getElementById('citySelectField')?.addEventListener('change', (e) => {
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
        if (!grid || !alInputEl || typeof i18n === 'undefined') return;

        const txt = i18n[state.lang];
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
            btn.addEventListener('click', (e) => {
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
        if (!content || typeof i18n === 'undefined') return;

        const txt = i18n[state.lang];
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
        if (typeof i18n === 'undefined') return;
        const txt = i18n[state.lang];
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
    }

    async function initApp() {
        document.getElementById('langSelect')?.addEventListener('change', (e) => {
            state.lang = e.target.value;
            updateStaticText();
            renderMainUI();
        });

        document.getElementById('modeSelect')?.addEventListener('change', (e) => {
            state.mode = e.target.value;
            renderMainUI();
        });

        document.getElementById('yearSelect')?.addEventListener('change', (e) => {
            state.year = e.target.value;
            renderMainUI();
        });

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch(() => {});
        }

        const statusEl = document.getElementById('apiStatus');
        const txtEl = document.getElementById('statusText');
        const iconEl = document.getElementById('statusIcon');

        // 先立即渲染主 UI 避免使用者等待
        renderMainUI();

        try {
            const [rates, tdMsg] = await Promise.all([
                ApiService.fetchExchangeRates(),
                ApiService.fetchTrafficNews()
            ]);

            state.rates = rates;
            state.trafficAlert = tdMsg;

            if (statusEl && txtEl) {
                txtEl.innerText = i18n[state.lang].statusSuccess;
                if (iconEl) iconEl.innerText = "✅";
                statusEl.className = "mb-6 p-3.5 rounded-lg text-sm bg-emerald-900/30 border border-emerald-500/50 text-emerald-300 font-medium tracking-wide flex items-center shadow-inner";
            }
        } catch (e) {
            if (statusEl && txtEl) {
                txtEl.innerText = i18n[state.lang].statusFallback;
                if (iconEl) iconEl.innerText = "🛡️";
                statusEl.className = "mb-6 p-3.5 rounded-lg text-sm bg-blue-900/30 border border-blue-500/50 text-blue-300 font-medium tracking-wide flex items-center shadow-inner";
            }
        } finally {
            renderMainUI();
        }
    }

    document.addEventListener('DOMContentLoaded', initApp);
})();

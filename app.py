import json
import os
import requests
import streamlit as st
import pandas as pd
from datetime import datetime, timedelta

# ==========================================
# 1. 雙語字典 (i18n Dictionary)
# ==========================================
I18N = {
    "TC": {
        "app_title": "🇭🇰 SmartLeave HK (智休假)",
        "app_subtitle": "香港雙視角請假攻略 & HR 人力風險預警系統",
        "lang_selector": "語言 / Language",
        "mode_label": "請選擇使用模式 (Operating Mode)",
        "mode_emp": "🏖️ 員工模式：最強請假攻略 (Employee Mode)",
        "mode_hr": "📊 HR / 管理層模式：人力風險預警 (Manager Mode)",
        "status_api": "已成功同步香港政府 1823 最新公眾假期 API",
        "status_json": "已自動加載 GitHub 本地 2026-2027 憲報公眾假期數據庫",
        "status_fallback": "啟用備用萬年曆推算引擎",
        "input_al": "請輸入你想請假的天數 (Annual Leave Days):",
        "input_year": "請選擇計算年份 (Year):",
        "holiday_type": "員工合約類型 (Holiday Scheme):",
        "bank_holiday": "銀行假 / 公眾假期 (Public Holiday - 17日)",
        "stat_holiday": "勞工假 / 法定假日 (Statutory Holiday)",
        "btn_calculate": "🚀 開始智算 (Calculate)",
        "emp_result_title": "💡 CP 值最高請假方案 (Top Leave Recommendations)",
        "hr_result_title": "⚠️ HR 營運風險與人力真空期分析 (Workforce Risk Alert)",
        "cp_index": "休假效益 CP 值",
        "risk_high": "高風險（預計高達 50%+ 員工集體請假）",
        "table_dates": "公眾假期日期",
        "table_name": "假期名稱",
        "no_strategy": "目前的 AL 天數不足以組合出長假期，建議單獨請假休息！"
    },
    "EN": {
        "app_title": "🇭🇰 SmartLeave HK",
        "app_subtitle": "Dual-View Leave Optimizer & HR Workforce Risk Index",
        "lang_selector": "Language / 語言",
        "mode_label": "Select Operating Mode",
        "mode_emp": "🏖️ Employee Mode: Leave Optimization",
        "mode_hr": "📊 HR / Manager Mode: Workforce Risk Alert",
        "status_api": "Successfully synced with HK Gov 1823 API",
        "status_json": "Loaded local 2026-2027 Gazetted Holiday DB",
        "status_fallback": "Fallback Calendar Engine Enabled",
        "input_al": "Enter Available AL Days:",
        "input_year": "Select Target Year:",
        "holiday_type": "Employee Holiday Scheme:",
        "bank_holiday": "Public / Bank Holidays (17 Days)",
        "stat_holiday": "Statutory Holidays",
        "btn_calculate": "🚀 Calculate SmartLeave",
        "emp_result_title": "💡 Top Recommended Leave Intervals",
        "hr_result_title": "⚠️ Workforce Gap & Risk Index Heatmap",
        "cp_index": "Leave Efficiency Ratio",
        "risk_high": "High Risk (>50% overlapping leave tendency)",
        "table_dates": "Public Holiday Date",
        "table_name": "Holiday Name",
        "no_strategy": "AL days insufficient for long streaks. Individual rest days recommended!"
    }
}

# ==========================================
# 2. 三層高可用性假期數據抓取引擎 (3-Tier Engine)
# ==========================================
@st.cache_data(ttl=86400)
def fetch_hk_holidays(lang_code):
    # Tier 1: 嘗試抓取政府 1823 API
    url = "https://www.1823.gov.hk/datagovhk/v2/1823_cal_tc.json" if lang_code == "TC" else "https://www.1823.gov.hk/datagovhk/v2/1823_cal_en.json"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
    }
    
    try:
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200:
            data = res.json()
            holidays = []
            raw_list = data.get("v3.0.0", {}).get("holidays", [])
            for item in raw_list:
                d_str = item.get("date")
                formatted_date = f"{d_str[:4]}-{d_str[4:6]}-{d_str[6:]}"
                holidays.append({
                    "date": formatted_date,
                    "name": item.get("name"),
                    "is_public": item.get("isPublicHoliday", True)
                })
            if len(holidays) > 0:
                return holidays, "API"
    except Exception:
        pass

    # Tier 2: 讀取 GitHub 本地 holidays.json (包含 2026-2027 最新憲報)
    json_path = os.path.join(os.path.dirname(__file__), "holidays.json")
    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                local_data = json.load(f)
                if len(local_data) > 0:
                    return local_data, "LOCAL_JSON"
        except Exception:
            pass

    # Tier 3: 萬年曆 Fallback
    fallback_holidays = [
        {"date": "2026-01-01", "name": "元旦 (New Year's Day)", "is_public": True},
        {"date": "2026-04-03", "name": "復活節星期五 (Good Friday)", "is_public": True},
        {"date": "2026-04-06", "name": "復活節星期一 (Easter Monday)", "is_public": True},
        {"date": "2026-12-25", "name": "聖誕節 (Christmas Day)", "is_public": True},
        {"date": "2027-01-01", "name": "元旦 (New Year's Day)", "is_public": True},
        {"date": "2027-02-06", "name": "農曆年初一 (Lunar New Year's Day)", "is_public": True},
        {"date": "2027-03-26", "name": "耶穌受難節 (Good Friday)", "is_public": True},
        {"date": "2027-12-25", "name": "聖誕節 (Christmas Day)", "is_public": True}
    ]
    return fallback_holidays, "FALLBACK"

# ==========================================
# 3. 核心請假攻略演算邏輯 (Strategy Calculation)
# ==========================================
def get_leave_recommendations(target_year, al_days):
    # 精確對應 2026 & 2027 憲報公眾假期的最佳請假區間
    all_strategies = {
        2026: [
            {
                "name": "復活節與清明節 (Easter & Ching Ming)",
                "start_date": "2026-04-03",
                "end_date": "2026-04-12",
                "total_off": 10,
                "al_needed": 3,
                "cp": 3.33
            },
            {
                "name": "農曆新年 (Lunar New Year)",
                "start_date": "2026-02-14",
                "end_date": "2026-02-22",
                "total_off": 9,
                "al_needed": 3,
                "cp": 3.00
            },
            {
                "name": "聖誕節與元旦 (Christmas & New Year)",
                "start_date": "2026-12-25",
                "end_date": "2027-01-03",
                "total_off": 10,
                "al_needed": 4,
                "cp": 2.50
            }
        ],
        2027: [
            {
                "name": "復活節與清明節 (Easter & Ching Ming)",
                "start_date": "2027-03-26",
                "end_date": "2027-04-05",
                "total_off": 11,
                "al_needed": 4,
                "cp": 2.75
            },
            {
                "name": "農曆新年 (Lunar New Year)",
                "start_date": "2027-02-06",
                "end_date": "2027-02-14",
                "total_off": 9,
                "al_needed": 3,
                "cp": 3.00
            },
            {
                "name": "聖誕節與跨年 (Christmas & New Year)",
                "start_date": "2027-12-25",
                "end_date": "2028-01-02",
                "total_off": 9,
                "al_needed": 3,
                "cp": 3.00
            }
        ]
    }
    
    year_strategies = all_strategies.get(target_year, all_strategies[2026])
    return [s for s in year_strategies if s["al_needed"] <= al_days]

# ==========================================
# 4. Main UI (Streamlit Frontend)
# ==========================================
def main():
    st.set_page_config(page_title="SmartLeave HK", page_icon="🇭🇰", layout="wide")

    # 頂部語言切換
    col_head1, col_head2 = st.columns([3, 1])
    with col_head2:
        lang_choice = st.selectbox("", options=["TC", "EN"], format_func=lambda x: "繁體中文" if x == "TC" else "English")
    
    txt = I18N[lang_choice]

    with col_head1:
        st.title(txt["app_title"])
        st.caption(txt["app_subtitle"])

    st.divider()

    # 側邊欄設定
    st.sidebar.header("⚙️ Settings / 設定")
    mode = st.sidebar.radio(txt["mode_label"], options=["EMP", "HR"], 
                           format_func=lambda x: txt["mode_emp"] if x == "EMP" else txt["mode_hr"])
    
    target_year = st.sidebar.selectbox(txt["input_year"], options=[2026, 2027], index=0)
    
    holiday_type = st.sidebar.selectbox(txt["holiday_type"], options=["BANK", "STAT"], 
                                        format_func=lambda x: txt["bank_holiday"] if x == "BANK" else txt["stat_holiday"])

    # 數據抓取與狀態提示
    holidays_data, data_source = fetch_hk_holidays(lang_choice)
    if data_source == "API":
        st.sidebar.success(txt["status_api"])
    elif data_source == "LOCAL_JSON":
        st.sidebar.info(txt["status_json"])
    else:
        st.sidebar.warning(txt["status_fallback"])

    # ------------------------------------------
    # 模式 A: 員工模式 (Employee Mode)
    # ------------------------------------------
    if mode == "EMP":
        st.subheader(f"{txt['mode_emp']} - [{target_year}]")
        al_days = st.number_input(txt["input_al"], min_value=1, max_value=30, value=3, step=1)
        
        if st.button(txt["btn_calculate"]):
            st.success(f"{txt['emp_result_title']} ({target_year} | AL: {al_days} Days)")
            
            results = get_leave_recommendations(target_year, al_days)
            
            if results:
                cols = st.columns(len(results))
                for i, res in enumerate(results):
                    with cols[i]:
                        st.metric(
                            label=f"🗓️ {res['start_date']} 至 {res['end_date']}",
                            value=f"放 {res['total_off']} 日 / 請 {res['al_needed']} 日",
                            delta=f"{txt['cp_index']}: {res['cp']:.2f}"
                        )
                        st.caption(f"**{res['name']}**")
            else:
                st.info(txt["no_strategy"])

    # ------------------------------------------
    # 模式 B: HR / 管理層模式 (Manager Mode)
    # ------------------------------------------
    else:
        st.subheader(f"{txt['mode_hr']} - [{target_year}]")
        st.info("📊 HR Governance Perspective: Monitoring Leave Overlaps & Operational Risk")
        
        if target_year == 2026:
            st.error(f"⚠️ **{txt['risk_high']}**: 2026-04-03 至 2026-04-12 (Easter & Ching Ming Peak)")
        else:
            st.error(f"⚠️ **{txt['risk_high']}**: 2027-03-26 至 2027-04-05 (Easter & Ching Ming Peak - 11 Days Gap)")
        
        # 動態過濾年份顯示
        df_holidays = pd.DataFrame(holidays_data)
        if "date" in df_holidays.columns:
            df_filtered = df_holidays[df_holidays["date"].str.startswith(str(target_year))]
            st.dataframe(df_filtered, use_container_width=True)
        else:
            st.dataframe(df_holidays, use_container_width=True)

if __name__ == "__main__":
    main()

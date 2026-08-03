import streamlit as st
import requests
import pandas as pd
from datetime import datetime

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
        "api_status_success": "已成功同步香港政府 1823 最新公眾假期 API",
        "api_status_error": "無法讀取政府 API，已切換至備用假期數據",
        "input_al": "請輸入你想請假的天數 (Annual Leave Days):",
        "holiday_type": "員工合約類型 (Holiday Scheme):",
        "bank_holiday": "銀行假 / 公眾假期 (Public Holiday - 17日)",
        "stat_holiday": "勞工假 / 法定假日 (Statutory Holiday)",
        "btn_calculate": "🚀 開始智算 (Calculate)",
        "emp_result_title": "💡 CP 值最高請假方案 (Top Leave Recommendations)",
        "hr_result_title": "⚠️ HR 營運風險與人力真空期分析 (Workforce Risk Alert)",
        "cp_index": "休假效益 CP 值",
        "risk_high": "高風險（預計高達 50%+ 員工集體請假）",
        "table_dates": "公眾假期日期",
        "table_name": "假期名稱"
    },
    "EN": {
        "app_title": "🇭🇰 SmartLeave HK",
        "app_subtitle": "Dual-View Leave Optimizer & HR Workforce Risk Index",
        "lang_selector": "Language / 語言",
        "mode_label": "Select Operating Mode",
        "mode_emp": "🏖️ Employee Mode: Leave Optimization",
        "mode_hr": "📊 HR / Manager Mode: Workforce Risk Alert",
        "api_status_success": "Successfully synced with HK Gov 1823 Public Holiday API",
        "api_status_error": "API unreachable. Fallback to local holiday database.",
        "input_al": "Enter Available Annual Leave (AL) Days:",
        "holiday_type": "Employee Holiday Scheme:",
        "bank_holiday": "Public / Bank Holidays (17 Days)",
        "stat_holiday": "Statutory Holidays",
        "btn_calculate": "🚀 Calculate SmartLeave",
        "emp_result_title": "💡 Top Recommended Leave Intervals",
        "hr_result_title": "⚠️ Workforce Gap & Risk Index Heatmap",
        "cp_index": "Leave Efficiency Ratio",
        "risk_high": "High Risk (>50% overlapping leave tendency)",
        "table_dates": "Public Holiday Date",
        "table_name": "Holiday Name"
    }
}

# ==========================================
# 2. 自動抓取政府 1823 官方 API 數據
# ==========================================
@st.cache_data(ttl=86400)  # 快取 24 小時，避免頻繁請求
def fetch_hk_holidays(lang_code):
    # 政府 1823 JSON API Endpoint
    url_map = {
        "TC": "https://www.1823.gov.hk/datagovhk/v2/1823_cal_tc.json",
        "EN": "https://www.1823.gov.hk/datagovhk/v2/1823_cal_en.json"
    }
    url = url_map.get(lang_code, url_map["TC"])
    
    try:
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            holidays = []
            # 解析 1823 的 v3.0.0 JSON 結構
            raw_list = data.get("v3.0.0", {}).get("holidays", [])
            for item in raw_list:
                d_str = item.get("date")  # YYYYMMDD
                formatted_date = f"{d_str[:4]}-{d_str[4:6]}-{d_str[6:]}"
                holidays.append({
                    "date": formatted_date,
                    "name": item.get("name"),
                    "is_public": item.get("isPublicHoliday", True)
                })
            return holidays, True
    except Exception as e:
        pass
    
    # Fallback 本地基礎資料 (若 API 無法連線時)
    fallback_data = [
        {"date": "2026-12-25", "name": "Christmas Day / 聖誕節", "is_public": True},
        {"date": "2026-12-26", "name": "Boxing Day / 聖誕節後第一個周日", "is_public": True},
        {"date": "2027-01-01", "name": "New Year / 元旦", "is_public": True}
    ]
    return fallback_data, False

# ==========================================
# 3. Streamlit 介面建構 (UI Layer)
# ==========================================
def main():
    st.set_page_config(page_title="SmartLeave HK", page_icon="🇭🇰", layout="wide")

    # 頂部列：語言切換
    col_head1, col_head2 = st.columns([3, 1])
    with col_head2:
        lang_choice = st.selectbox("", options=["TC", "EN"], format_func=lambda x: "繁體中文" if x == "TC" else "English")
    
    txt = I18N[lang_choice]

    with col_head1:
        st.title(txt["app_title"])
        st.caption(txt["app_subtitle"])

    st.divider()

    # 側邊欄：模式切換與設定
    st.sidebar.header("⚙️ Settings / 設定")
    mode = st.sidebar.radio(txt["mode_label"], options=["EMP", "HR"], 
                           format_func=lambda x: txt["mode_emp"] if x == "EMP" else txt["mode_hr"])

    holiday_type = st.sidebar.selectbox(txt["holiday_type"], 
                                        options=["BANK", "STAT"], 
                                        format_func=lambda x: txt["bank_holiday"] if x == "BANK" else txt["stat_holiday"])

    # 抓取假期數據
    holidays_data, is_api_live = fetch_hk_holidays(lang_choice)
    
    if is_api_live:
        st.sidebar.success(txt["api_status_success"])
    else:
        st.sidebar.warning(txt["api_status_error"])

    # ==========================================
    # 4. 業務邏輯展示 (Phase 1 介面骨架)
    # ==========================================
    if mode == "EMP":
        st.subheader(txt["mode_emp"])
        al_days = st.number_input(txt["input_al"], min_value=1, max_value=30, value=3, step=1)
        
        if st.button(txt["btn_calculate"]):
            st.success(f"{txt['emp_result_title']} (Annual Leave: {al_days} Days)")
            
            # 範例展示 CP 值結果卡片
            c1, c2, c3 = st.columns(3)
            with c1:
                st.metric(label="Easter & Ching Ming (復活節與清明)", value="放 10 日 / 請 3 日", delta=f"{txt['cp_index']}: 3.33")
            with c2:
                st.metric(label="Christmas & New Year (聖誕與元旦)", value="放 10 日 / 請 4 日", delta=f"{txt['cp_index']}: 2.50")
            with c3:
                st.metric(label="Lunar New Year (農曆新年)", value="放 9 日 / 請 3 日", delta=f"{txt['cp_index']}: 3.00")

    else:
        st.subheader(txt["mode_hr"])
        st.info("📊 HR Governance Perspective: Monitoring Leave Overlaps & Operational Risk")
        
        # 範例展示 HR 風險指標
        st.error(f"⚠️ **{txt['risk_high']}**: Easter Holiday Period (Apr 2026)")
        
        df_holidays = pd.DataFrame(holidays_data)
        st.dataframe(df_holidays, use_container_width=True)

if __name__ == "__main__":
    main()

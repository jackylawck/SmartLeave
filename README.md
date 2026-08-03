# SmartLeave 智休假 🏖️📊

**HK Dual-View Leave Optimizer & Workforce Risk Index (Offline-First PWA)**
**香港雙視角請假攻略 & HR 人力風險預警系統 (離線優先 PWA)**

🔗 **Live Demo / 在線體驗**: [https://jackylawck.github.io/SmartLeave/](https://jackylawck.github.io/SmartLeave/)

---

## 📖 Project Overview / 專案簡介

**[EN]**
SmartLeave is an Offline-First, serverless client-side Progressive Web Application (PWA) designed to optimize annual leave planning for employees in Hong Kong, while equipping HR professionals and management with critical workforce overlap risk alerts. By integrating official Hong Kong Government API data with a dual-view interface and offline caching, this tool balances employee experience (EX) with operational risk management and high availability.

**[TC]**
SmartLeave 是一個「離線優先 (Offline-First)」、無伺服器純前端運算的漸進式網頁應用程式 (PWA)。它不僅能為香港員工計算最高 CP 值的請假攻略，更能為 HR 與管理層提供連假期間的人力真空風險預警。透過整合香港政府官方 API 數據、離線快取引擎與雙視角介面，本系統完美平衡了員工體驗 (EX) 與企業營運風險管理。

---

## ✨ Key Features / 核心功能

*   **Offline-First & PWA (離線優先與 PWA 支援)**: Built-in Service Worker caches core assets. Works 100% seamlessly even without internet access or in flight mode.
    *(內建 Service Worker 離線快取，飛行模式或無網路狀態下仍可 100% 正常計算。)*
*   **Dual-View Mode (雙視角模式)**: Toggle seamlessly between "Employee Mode" (Leave Optimization) and "HR Mode" (Workforce Risk Alert).
    *(無縫切換「員工請假攻略」與「HR / 管理層風險預警」視角。)*
*   **Bilingual Interface (雙語介面)**: Native support for English and Traditional Chinese (i18n).
    *(全中/全英雙語系切換。)*
*   **Live Gov API Integration (政府數據直連)**: Automatically fetches the latest gazetted public holidays directly from `DATA.GOV.HK` via secure proxy.
    *(透過安全代理直連香港政府官方資料庫。)*
*   **Leave Efficiency Algorithm (請假效益演算法)**: Automatically calculates and filters the best leave intervals based on the user's available Annual Leave (AL) balance.
    *(根據可用 AL 天數自動智算最高 CP 值請假組合。)*

---

## 🛡️ Governance & Architecture / 治理與系統架構

This project is built with Enterprise Governance, Risk, and Compliance (GRC) principles at its core:
本專案在架構設計上深度融合了企業治理、風險管理與合規精神：

*   **Privacy by Design (ISO 27001 Alignment)**: Utilizes 100% Client-Side Rendering (CSR). User inputs (AL days) and interaction logs are processed entirely within the local browser. Zero data is transmitted to or stored on external servers, eliminating data breach risks.
    *(隱私造就設計：全面採用端到端本地運算，零資料外洩風險，對齊 ISO 27001 資訊安全精神。)*
*   **Business Continuity & Failover (ISO 22301 Alignment)**: Implements a High-Availability 3-Tier Failover mechanism combined with Service Worker caching. If the primary Government API connection is restricted or offline, the system instantly degrades gracefully to a pre-loaded local JSON database (2026-2027 Gazetted Holidays), ensuring 99.9% uptime and zero-disruption offline execution.
    *(高可用性與營運持續：結合 Service Worker 快取與 3-Tier 備援機制，斷網或 API 異常時無縫切換至本地資料庫，展現 ISO 22301 系統韌性。)*
*   **Algorithm Transparency**: Clear display of the Leave Efficiency Ratio logic (Total Days Off ÷ Required AL Days) to prevent black-box decision-making.
    *(演算法透明度：清晰展示 CP 值計算邏輯，避免黑箱作業。)*

---

## 🛠️ Tech Stack / 技術棧

*   **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS (via CDN)
*   **PWA / Offline**: Service Worker API, Cache Storage
*   **Data Source**: HK Gov 1823 API (`DATA.GOV.HK`), Local Fallback JSON
*   **Hosting**: GitHub Pages
*   **Proxy Integration**: CORS optimization via `api.allorigins.win`

---

## 🚀 How to Run Locally / 本地運行方式

Since this is a client-side application, no backend server setup is required.
由於本專案為純前端應用程式，無需設定任何後端伺服器。

1. Clone the repository / 複製專案:
   ```bash
   git clone [https://github.com/jackylawck/SmartLeave.git](https://github.com/jackylawck/SmartLeave.git)

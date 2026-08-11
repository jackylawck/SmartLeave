# 🤖 AI 治理、風險管理與透明度報告 | AI Governance & Transparency Report

[繁體中文](#-繁體中文) | [English](#-english)

---

## 🇭🇰 繁體中文

本報告概述 SmartLeave 在開發與營運過程中，如何對齊全球主要 AI 治理框架，包括：
* **歐盟《人工智慧法案》（EU AI Act）**
* **ISO/IEC 42001:2023（人工智慧管理系統 AI Management System）**
* **NIST AI 風險管理框架（NIST AI RMF 1.0）**
* **ISO/IEC 22989（AI 概念與術語標準）**

### 1. EU AI Act 風險分類與透明度 (EU AI Act Compliance)
* **風險等級**：**極低/微乎其微風險（Minimal / Minimal Risk AI System）**。
* **透明度義務**：本系統主要採用確定性演算法（Deterministic Algorithms）進行請假天數與 CP 值試算，不涉及高風險（High-Risk）之 AI 自動化招募、個人信用評級或心理測繪。系統對數據來源（1823、天文台、運輸署）保持 100% 透明。

### 2. 人工智慧風險管理 (NIST AI RMF Alignment)
* **GOVERN（治理）**：明確責任歸屬，確保系統設計符合道德規範，不進行演算法偏見排班。
* **MAP（識別）**：識別外部 API 斷線與 CORS 跨域風險，並建立 Failover 備援機制。
* **MEASURE（測量）**：驗證休假演算法邏輯之精確性，不產生錯誤假期推薦。
* **MANAGE（管理）**：透過純前端離線技術，從根本上消除 AI 數據外洩風險（Zero Data Leakage）。

### 3. ISO/IEC 42001 AI 管理體系架構
* **公平性與無偏見 (Fairness & Non-discrimination)**：請假 CP 值演算完全依據公開行事曆與數學公式，對所有員工公平透明。
* **可解釋性 (Explainability)**：請假方案之算式（`連續放假總天數 ÷ 扣除 AL 天數`）完全公開可查，非黑箱模型。
* **可靠性與安全性 (Reliability & Safety)**：提供 3 秒超時保護與預設備用數據，保障高可用性。

---

## 🇬🇧 English

This report details how SmartLeave aligns with global AI governance standards and regulatory frameworks, including the **EU AI Act**, **ISO/IEC 42001:2023 (AIMS)**, and the **NIST AI Risk Management Framework (AI RMF 1.0)**.

### 1. EU AI Act Risk Classification & Transparency
* **Risk Categorization**: **Minimal Risk System**.
* **Transparency Obligation**: SmartLeave utilizes deterministic logic and transparent calculations for leave optimization. It does not engage in high-risk AI practices such as automated employment profiling, biometric scoring, or emotion recognition.

### 2. NIST AI Risk Management Framework (AI RMF) Alignment
* **GOVERN**: Ethical governance practices are embedded in the design to prevent algorithmic bias in leave recommendations.
* **MAP**: Identified risks associated with third-party API dependencies and CORS failures.
* **MEASURE**: Verified mathematical precision of leave optimization ratios (CP values).
* **MANAGE**: Implemented strict local client-side execution to completely eliminate data privacy risks.

### 3. ISO/IEC 42001 Principles Implementation
* **Fairness**: Leave algorithms apply uniformly to all users based on objective public holiday calendars.
* **Explainability**: The ratio formula (`Total Days Off ÷ Required AL Days`) is fully transparent and auditable, avoiding black-box decision-making.
* **Reliability & Robustness**: Built-in fallback datasets and API timeout guards ensure continuous system reliability and resilience.

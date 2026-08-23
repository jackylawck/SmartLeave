/**
 * @file config.js
 * @description SmartLeave System Configuration & City Registry
 * @author Jacky Law (羅子淇)
 */

/** @constant {string[]} 支援的法定貨幣清單 */
const SUPPORTED_CURRENCIES = Object.freeze([
    'HKD', 'CNY', 'MOP', 'TWD', 'JPY',
    'KRW', 'THB', 'SGD', 'GBP', 'EUR',
    'AUD', 'CAD', 'USD'
]);

/** @type {Array<Object>} 目的地氣象與匯率配置資料庫 */
const CITIES = Object.freeze([
    { id: "HK", nameTC: "香港 (本地)", nameEN: "Hong Kong (Local)", lat: 22.3193, lng: 114.1694, currency: "HKD" },
    { id: "SZ", nameTC: "深圳 (Shenzhen)", nameEN: "Shenzhen", lat: 22.5431, lng: 114.0579, currency: "CNY" },
    { id: "GZ", nameTC: "廣州 (Guangzhou)", nameEN: "Guangzhou", lat: 23.1291, lng: 113.2644, currency: "CNY" },
    { id: "MO", nameTC: "澳門 (Macau)", nameEN: "Macau", lat: 22.1987, lng: 113.5439, currency: "MOP" },
    { id: "TPE", nameTC: "台北 (Taipei)", nameEN: "Taipei", lat: 25.0330, lng: 121.5654, currency: "TWD" },
    { id: "TYO", nameTC: "東京 (Tokyo)", nameEN: "Tokyo", lat: 35.6762, lng: 139.6503, currency: "JPY" },
    { id: "OSA", nameTC: "大阪 (Osaka)", nameEN: "Osaka", lat: 34.6937, lng: 135.5023, currency: "JPY" },
    { id: "FUK", nameTC: "福岡 (Fukuoka)", nameEN: "Fukuoka", lat: 33.5904, lng: 130.4017, currency: "JPY" },
    { id: "OKA", nameTC: "沖繩 (Okinawa)", nameEN: "Okinawa", lat: 26.2124, lng: 127.6809, currency: "JPY" },
    { id: "SEL", nameTC: "首爾 (Seoul)", nameEN: "Seoul", lat: 37.5665, lng: 126.9780, currency: "KRW" },
    { id: "BKK", nameTC: "曼谷 (Bangkok)", nameEN: "Bangkok", lat: 13.7563, lng: 100.5018, currency: "THB" },
    { id: "SIN", nameTC: "新加坡 (Singapore)", nameEN: "Singapore", lat: 1.3521, lng: 103.8198, currency: "SGD" },
    { id: "LON", nameTC: "倫敦 (London)", nameEN: "London", lat: 51.5074, lng: -0.1278, currency: "GBP" },
    { id: "PAR", nameTC: "巴黎 (Paris)", nameEN: "Paris", lat: 48.8566, lng: 2.3522, currency: "EUR" },
    { id: "SYD", nameTC: "悉尼 (Sydney)", nameEN: "Sydney", lat: -33.8688, lng: 151.2093, currency: "AUD" },
    { id: "YVR", nameTC: "溫哥華 (Vancouver)", nameEN: "Vancouver", lat: 49.2827, lng: -123.1207, currency: "CAD" },
    { id: "NYC", nameTC: "紐約 (New York)", nameEN: "New York", lat: 40.7128, lng: -74.0060, currency: "USD" }
]);

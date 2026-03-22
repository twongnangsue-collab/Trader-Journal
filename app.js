// ==========================================
// ไฟล์ app.js: สมองกลจัดการข้อมูล (Firestore + ImgBB API)
// ==========================================
import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, doc, deleteDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { clearTradeForm, goBackFromTrade, beforeImages, afterImages, triggerAddTrade } from './ui.js';
import {
    initI18n,
    t,
    getCalendarMonths,
    getChartShortMonths
} from './i18n.js';

console.log("🚀 app.js ทำงาน: พร้อมใช้งานระบบ Firestore + ImgBB API");

const getEl = (id) => document.getElementById(id);

// ==========================================
// 1. สถานะข้อมูล (State & Variables)
// ==========================================
let currentBalance = 0;
let transactions = [];
let tradeHistory = [];
let displayCurrency = localStorage.getItem('displayCurrency') || 'USD';
let selectedDateForNewTrade = null; 
let equityChartInstance = null;
let outcomeChartInstance = null;
let orderTypeChartInstance = null;

/** @type {'month'|'quarter'|'year'} */
let overviewPeriod = 'month';

/** ป้องกัน loadData ซ้อนกันตอนกดลบ/บันทึกรัวๆ */
let loadDataQueued = false;
let loadDataRunning = false;

/** ป้องกันลบซ้ำซ้อน */
let deleteTxInProgress = false;

// ตั้งค่าปฏิทิน
let currentDate = new Date();
let viewingMonth = currentDate.getMonth(); 
let viewingYear = currentDate.getFullYear();
// 🔑 API Key ของ ImgBB
const IMGBB_API_KEY = "3185f6ab6b8a895af77cab0d3f399e26"; 

// ==========================================
// 2. ระบบเชื่อมต่อและอัปโหลด (API & Firebase)
// ==========================================

// โยนรูปขึ้น ImgBB อัตโนมัติ
async function uploadToImgBB(base64Image) {
    const base64Data = base64Image.split(',')[1];
    const formData = new FormData();
    formData.append('image', base64Data);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
    });
    const data = await response.json();
    return data.data.url;
}

/** ลบเอกสารในคอลเลกชันทั้งก้อน (แบ่ง batch ตามขีดจำกัด Firestore) */
async function deleteAllDocumentsInCollection(colName) {
    const snap = await getDocs(collection(db, colName));
    const docs = [...snap.docs];
    for (let i = 0; i < docs.length; i += 400) {
        const batch = writeBatch(db);
        docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
    }
}

// โหลดข้อมูลทั้งหมดจาก Firebase (ตอนเปิดแอป) — คิวซ้อนกันถ้ายังโหลดไม่จบ
window.loadData = async function() {
    if (loadDataRunning) {
        loadDataQueued = true;
        return;
    }
    loadDataRunning = true;
    try {
        do {
            loadDataQueued = false;
            await loadDataFromFirestore();
        } while (loadDataQueued);
    } finally {
        loadDataRunning = false;
    }
};

async function loadDataFromFirestore() {
    try {
        console.log("กำลังดึงข้อมูลจาก Firebase...");

        const txSnapshot = await getDocs(collection(db, "transactions"));
        transactions = txSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        const trSnapshot = await getDocs(collection(db, "trades"));
        tradeHistory = trSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        currentBalance = 0;
        transactions.forEach((tx) => {
            const amt = Number(tx.amountUSD);
            if (isNaN(amt) || amt < 0) return;
            if (tx.type === "deposit") currentBalance += amt;
            else currentBalance -= amt;
        });
        if (isNaN(currentBalance)) currentBalance = 0;

        updateBalanceUI();
        renderTransactions();
        renderCalendar();
        if (typeof window.renderOverview === "function") window.renderOverview();
        else renderEquityChart();
    } catch (error) {
        console.error("❌ โหลดข้อมูลล้มเหลว:", error);
    }
}

// ==========================================
// 3. ระบบวาดหน้าจอ (UI Renderers)
// ==========================================

// อัปเดตยอดเงินหน้าหลัก
function updateBalanceUI() {
    if(!getEl('balanceValue') || !getEl('currencySymbol')) return;
    if (displayCurrency === 'USD') {
        getEl('currencySymbol').textContent = '$'; 
        getEl('balanceValue').textContent = currentBalance.toLocaleString('en-US', {minimumFractionDigits: 2}); 
        if(getEl('toggleCurrencyBtn')) getEl('toggleCurrencyBtn').textContent = t('hero.toUSC');
    } else {
        getEl('currencySymbol').textContent = '¢'; 
        getEl('balanceValue').textContent = (currentBalance * 100).toLocaleString('en-US', {maximumFractionDigits: 0}); 
        if(getEl('toggleCurrencyBtn')) getEl('toggleCurrencyBtn').textContent = t('hero.toUSD');
    }
}

// ---------- Overview: ช่วงวันที่ & ฟอร์แมต ----------
function getOverviewDateRange() {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    if (overviewPeriod === 'month') {
        const start = new Date(y, m, 1, 0, 0, 0, 0);
        const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
        return { start, end };
    }
    if (overviewPeriod === 'quarter') {
        const start = new Date(y, m - 2, 1, 0, 0, 0, 0);
        const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
        return { start, end };
    }
    const start = new Date(y, 0, 1, 0, 0, 0, 0);
    const end = new Date(y, 11, 31, 23, 59, 59, 999);
    return { start, end };
}

function tradeInDateRange(trade, start, end) {
    if (trade.date && typeof trade.date === 'string') {
        const ds = trade.date.slice(0, 10);
        const t = new Date(ds + 'T12:00:00');
        return !isNaN(t) && t >= start && t <= end;
    }
    if (trade.timestamp) {
        const t = new Date(trade.timestamp);
        return t >= start && t <= end;
    }
    return false;
}

function formatOverviewMoney(amountUsd) {
    const abs = Math.abs(amountUsd);
    if (displayCurrency === 'USC') {
        const cents = abs * 100;
        return (amountUsd >= 0 ? '+' : '−') + '¢' + cents.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return (amountUsd >= 0 ? '+' : '−') + '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatOrderTypeLabel(ot) {
    if (!ot) return 'ไม่ระบุ';
    return String(ot).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** ดึงเทรดในช่วง overview + คำนวณสถิติ */
function computeOverviewTradeStats() {
    const { start, end } = getOverviewDateRange();
    const list = (tradeHistory || []).filter((t) => tradeInDateRange(t, start, end));
    let netUsd = 0;
    let wins = 0;
    let losses = 0;
    const byDay = {};

    list.forEach((t) => {
        let amt = Number(t.finalAmount) || 0;
        if (t.finalCurrency === 'USC') amt = amt / 100;
        const win = t.finalOutcome === 'win' || t.result === 'win';
        if (win) {
            wins++;
            netUsd += amt;
        } else {
            losses++;
            netUsd -= amt;
        }
        let dayKey = null;
        if (t.date && typeof t.date === 'string') dayKey = t.date.slice(0, 10);
        else if (t.timestamp) dayKey = new Date(t.timestamp).toISOString().slice(0, 10);
        if (dayKey) {
            const signed = win ? amt : -amt;
            byDay[dayKey] = (byDay[dayKey] || 0) + signed;
        }
    });

    const total = wins + losses;
    const winRate = total > 0 ? (wins / total) * 100 : null;
    const avg = total > 0 ? netUsd / total : 0;

    let bestDay = null;
    let worstDay = null;
    Object.entries(byDay).forEach(([day, v]) => {
        if (bestDay === null || v > bestDay.v) bestDay = { day, v };
        if (worstDay === null || v < worstDay.v) worstDay = { day, v };
    });

    return { list, netUsd, wins, losses, total, winRate, avg, bestDay, worstDay };
}

function renderOverviewKPIs() {
    const netEl = getEl('overviewNetPL');
    if (!netEl) return;

    const { netUsd, wins, losses, total, winRate, avg, bestDay, worstDay } = computeOverviewTradeStats();

    netEl.textContent = total === 0 ? (displayCurrency === 'USC' ? '¢0' : '$0.00') : formatOverviewMoney(netUsd);
    netEl.className = 'overview-kpi-value ' + (netUsd >= 0 ? 'is-pos' : 'is-neg');

    const wrEl = getEl('overviewWinRate');
    if (wrEl) {
        wrEl.textContent = winRate == null ? '—' : `${winRate.toFixed(1)}%`;
        wrEl.className = 'overview-kpi-value ' + (winRate == null ? '' : winRate >= 50 ? 'is-pos' : 'is-neg');
    }
    const wh = getEl('overviewWinLossHint');
    if (wh) wh.textContent = t('overview.kpiWLFmt').replace('{w}', String(wins)).replace('{l}', String(losses));

    const tc = getEl('overviewTradeCount');
    if (tc) tc.textContent = String(total);

    const avgEl = getEl('overviewAvgPL');
    if (avgEl) {
        avgEl.textContent = total === 0 ? (displayCurrency === 'USC' ? '¢0' : '$0.00') : formatOverviewMoney(avg);
        avgEl.className = 'overview-kpi-value ' + (avg >= 0 ? 'is-pos' : 'is-neg');
    }

    const insight = getEl('overviewInsight');
    if (insight) {
        if (total > 0 && bestDay && worstDay) {
            insight.hidden = false;
            const fmtDay = (d) => {
                try {
                    const [yy, mm, dd] = d.split('-').map(Number);
                    return new Date(yy, mm - 1, dd).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
                } catch { return d; }
            };
            const b = getEl('overviewBestDay');
            const w = getEl('overviewWorstDay');
            if (b) b.textContent = `${fmtDay(bestDay.day)} (${formatOverviewMoney(bestDay.v)})`;
            if (w) w.textContent = `${fmtDay(worstDay.day)} (${formatOverviewMoney(worstDay.v)})`;
        } else {
            insight.hidden = true;
        }
    }
}

function renderOutcomeCharts() {
    const { list, wins, losses, total } = computeOverviewTradeStats();
    const orderMap = {};
    list.forEach((t) => {
        const key = t.orderType || 'unknown';
        orderMap[key] = (orderMap[key] || 0) + 1;
    });

    const outCanvas = getEl('outcomeChart');
    const ordCanvas = getEl('orderTypeChart');
    const outEmpty = getEl('outcomeChartEmpty');
    const ordEmpty = getEl('orderTypeChartEmpty');

    if (outCanvas) {
        if (outcomeChartInstance) {
            outcomeChartInstance.destroy();
            outcomeChartInstance = null;
        }
        if (total === 0) {
            if (outEmpty) outEmpty.hidden = false;
            outCanvas.style.display = 'none';
        } else {
            if (outEmpty) outEmpty.hidden = true;
            outCanvas.style.display = 'block';
            outcomeChartInstance = new Chart(outCanvas, {
                type: 'doughnut',
                data: {
                    labels: [t('overview.win'), t('overview.loss')],
                    datasets: [{
                        data: [wins, losses],
                        backgroundColor: ['#00e676', '#ff003c'],
                        borderWidth: 0,
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#cbd5e1', font: { size: 12 }, padding: 14 }
                        }
                    },
                    cutout: '62%'
                }
            });
        }
    }

    if (ordCanvas) {
        if (orderTypeChartInstance) {
            orderTypeChartInstance.destroy();
            orderTypeChartInstance = null;
        }
        const entries = Object.entries(orderMap).sort((a, b) => b[1] - a[1]);
        if (entries.length === 0) {
            if (ordEmpty) ordEmpty.hidden = false;
            ordCanvas.style.display = 'none';
        } else {
            if (ordEmpty) ordEmpty.hidden = true;
            ordCanvas.style.display = 'block';
            const labels = entries.map(([k]) => formatOrderTypeLabel(k));
            const data = entries.map(([, v]) => v);
            orderTypeChartInstance = new Chart(ordCanvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'ออเดอร์',
                        data,
                        backgroundColor: 'rgba(255,255,255,0.12)',
                        borderColor: 'rgba(255,255,255,0.35)',
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: { color: '#94a3b8', stepSize: 1 },
                            grid: { color: 'rgba(255,255,255,0.06)' }
                        },
                        y: {
                            ticks: { color: '#e2e8f0', font: { size: 11 } },
                            grid: { display: false }
                        }
                    }
                }
            });
        }
    }
}

// วาดกราฟ Equity Curve (รองรับช่วง month / quarter / year)
window.renderEquityChart = function() {
    const ctx = getEl('equityChart');
    if (!ctx) return;

    const titleEl = getEl('equityChartTitle');
    if (titleEl) {
        if (overviewPeriod === 'month') titleEl.textContent = t('overview.chartMonth');
        else if (overviewPeriod === 'quarter') titleEl.textContent = t('overview.chartQuarter');
        else titleEl.textContent = t('overview.chartYear');
    }

    const today = new Date();
    const labels = [];
    const dataPoints = [];

    if (overviewPeriod === 'month') {
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) labels.push(String(i));

        const startOfMonthTimestamp = new Date(year, month, 1).getTime();
        let balanceBeforeThisMonth = 0;
        transactions.forEach((tx) => {
            if (tx.timestamp && tx.timestamp < startOfMonthTimestamp) {
                if (tx.type === 'deposit') balanceBeforeThisMonth += tx.amountUSD;
                else balanceBeforeThisMonth -= tx.amountUSD;
            }
        });

        let runningBalance = balanceBeforeThisMonth;
        for (let day = 1; day <= daysInMonth; day++) {
            const startOfDay = new Date(year, month, day, 0, 0, 0, 0).getTime();
            const endOfDay = new Date(year, month, day, 23, 59, 59, 999).getTime();
            const dailyTx = transactions.filter((tx) => tx.timestamp >= startOfDay && tx.timestamp <= endOfDay);
            dailyTx.forEach((tx) => {
                if (tx.type === 'deposit') runningBalance += tx.amountUSD;
                else runningBalance -= tx.amountUSD;
            });
            dataPoints.push(displayCurrency === 'USC' ? runningBalance * 100 : runningBalance);
        }
    } else if (overviewPeriod === 'quarter') {
        const year = today.getFullYear();
        const month = today.getMonth();
        const rangeStart = new Date(year, month - 2, 1, 0, 0, 0, 0);
        const rangeEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
        let cursor = new Date(rangeStart);
        while (cursor <= rangeEnd) {
            const weekEnd = new Date(cursor);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            const endTime = Math.min(weekEnd.getTime(), rangeEnd.getTime());
            labels.push(`${cursor.getMonth() + 1}/${cursor.getDate()}`);
            let bal = 0;
            transactions.forEach((tx) => {
                if (tx.timestamp && tx.timestamp <= endTime) {
                    if (tx.type === 'deposit') bal += tx.amountUSD;
                    else bal -= tx.amountUSD;
                }
            });
            dataPoints.push(displayCurrency === 'USC' ? bal * 100 : bal);
            cursor.setDate(cursor.getDate() + 7);
            cursor.setHours(0, 0, 0, 0);
        }
    } else {
        const year = today.getFullYear();
        const shortMonths = getChartShortMonths();
        for (let m = 0; m < 12; m++) {
            labels.push(shortMonths[m]);
            const lastDay = new Date(year, m + 1, 0, 23, 59, 59, 999).getTime();
            let bal = 0;
            transactions.forEach((tx) => {
                if (tx.timestamp && tx.timestamp <= lastDay) {
                    if (tx.type === 'deposit') bal += tx.amountUSD;
                    else bal -= tx.amountUSD;
                }
            });
            dataPoints.push(displayCurrency === 'USC' ? bal * 100 : bal);
        }
    }

    if (dataPoints.length === 0) return;

    if (equityChartInstance) equityChartInstance.destroy();

    const startVal = dataPoints[0] ?? 0;
    const endVal = dataPoints[dataPoints.length - 1] ?? 0;
    const isProfit = endVal >= startVal;
    const lineColor = isProfit ? '#10b981' : '#ef4444';
    const bgColor = isProfit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    const sym = displayCurrency === 'USD' ? '$' : '¢';
    equityChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: `${t('overview.balanceLabel')} (${displayCurrency})`,
                data: dataPoints,
                borderColor: lineColor,
                backgroundColor: bgColor,
                borderWidth: 2,
                fill: true,
                tension: 0.35,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label(ctx) {
                            return ` ${sym}${Number(ctx.parsed.y).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 45 } },
                y: {
                    border: { display: false },
                    ticks: {
                        color: '#94a3b8',
                        callback: (value) => (displayCurrency === 'USD' ? '$' + value : '¢' + value)
                    }
                }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });
};

window.renderOverview = function () {
    renderOverviewKPIs();
    renderEquityChart();
    renderOutcomeCharts();
};

// วาดรายการประวัติหน้าแรก (พร้อมเกราะเหล็กดักบัคการคลิก 100%)
function renderTransactions() {
    const txList = getEl('transactionList');
    if (!txList) return;
    txList.innerHTML = '';

    if (transactions.length === 0) { 
        txList.innerHTML = `<div class="empty-state" style="color: #94a3b8; grid-column: 1 / -1; text-align: center; padding: 20px;">${t('empty.transactions')}</div>`; 
        return; 
    }
    
    const sortedTx = [...transactions].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));

    sortedTx.forEach(tx => {
        const isDep = tx.type === 'deposit'; 
        const colorHex = isDep ? '#00e676' : '#ff003c'; 

        let percentBadge = '';
        if (tx.percentChange) { 
            percentBadge = `<span style="background: ${isDep ? 'rgba(0,230,118,0.1)' : 'rgba(255,0,60,0.1)'}; color: ${colorHex}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;">${tx.percentChange}</span>`; 
        }

        const usdNum = Number(tx.amountUSD);
        const safeUsd = isNaN(usdNum) ? 0 : usdNum;
        let mainAmount = '';
        let subAmount = '';
        if (tx.currency === 'USC') {
            mainAmount = `${isDep ? '+' : '-'}${tx.originalAmount} USC`;
            subAmount = `(${isDep ? '+' : '-'}$${safeUsd.toFixed(2)})`;
        } else {
            mainAmount = `${isDep ? '+' : '-'}$${safeUsd.toFixed(2)}`;
            subAmount = '';
        }

        // เช็คให้ชัวร์ว่าเป็นการเทรด (ดักจับทุกรูปแบบที่อาจจะบันทึกไว้)
        const isTradeRecord = tx.isTrade || tx.type === 'trade' || tx.symbol;
        let titleText = isDep ? t('tx.deposit') : t('tx.withdraw');
        if (isTradeRecord) titleText = isDep ? t('tx.tradeWin') : t('tx.tradeLoss');
        
        const linkedToTrade = !!(tx.isTrade || tx.tradeId);
        const safeTid = String(tx.tradeId || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const safeId = String(tx.id || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const delLabel = t('tx.delete');
        const deleteBtn = `<button onclick="deleteTx(event, '${safeId}', ${linkedToTrade ? 'true' : 'false'}, '${safeTid}')" style="background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #ef4444; border-radius: 6px; padding: 4px 12px; font-size: 11px; font-weight: 600; cursor: pointer; text-transform: uppercase; transition: 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.1)'; this.style.borderColor='#ef4444';" onmouseout="this.style.background='transparent'; this.style.borderColor='rgba(255,255,255,0.1)';">${delLabel}</button>`;

        const card = document.createElement('div'); 
        card.style.cssText = `background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); border-left: 3px solid ${colorHex}; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px; transition: transform 0.2s, border-color 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.3);`;
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <span style="font-size: 13px; font-weight: 800; color: #f8fafc; letter-spacing: 0.5px;">${titleText}</span>
                    <div>${percentBadge}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 16px; font-weight: 800; color: ${colorHex}; line-height: 1;">${mainAmount}</div>
                    ${subAmount ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">${subAmount}</div>` : ''}
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span style="color: #cbd5e1; font-size: 12px;">${tx.note || '-'}</span>
                    <span style="font-size: 10px; color: #64748b; letter-spacing: 0.5px;">${tx.date}</span>
                </div>
                <div>${deleteBtn}</div>
            </div>
        `;
        
        // 🚨 ท่าไม้ตายดักบัค: บังคับให้กดได้เสมอถ้าเป็นข้อมูลออเดอร์
        if (isTradeRecord) {
            card.style.cursor = 'pointer';
            card.title = t('tx.viewDetails');
            card.onmouseover = () => { card.style.transform = 'translateY(-2px)'; card.style.borderColor = 'rgba(255,255,255,0.15)'; };
            card.onmouseout = () => { card.style.transform = 'translateY(0)'; card.style.borderColor = 'rgba(255,255,255,0.05)'; };
            
            card.addEventListener('click', (e) => {
                // ถ้ากดโดนปุ่ม Delete ให้ข้ามไป ไม่ต้องเปิดหน้าต่าง
                if (e.target.tagName === 'BUTTON') return;
                
                console.log("👉 ตรวจจับการคลิกออเดอร์:", tx);

                // ดึงข้อมูลตัวเต็มมาแสดง (ถ้าหาไม่เจอ ให้เอาข้อมูล tx นี่แหละไปแสดงเลย!)
                let tradeData = tx; 
                if (typeof tradeHistory !== 'undefined' && tradeHistory.length > 0) {
                    const found = tradeHistory.find(t => t.id === tx.tradeId || t.id === tx.id);
                    if (found) tradeData = found;
                }

                // เรียกฟังก์ชันเปิดหน้าต่าง
                if (typeof window.openViewDayModal === 'function') {
                    window.openViewDayModal(tradeData.date || 'Record', [tradeData]);
                } else {
                    alert(t('alert.detailLoadFail'));
                }
            });
        }

        txList.appendChild(card);
    });

    if(typeof window.updateOrbitingBalls === 'function') {
        window.updateOrbitingBalls(typeof tradeHistory !== 'undefined' ? tradeHistory : []);
    }
}

/** เติมรายการเดือน/ปีในปฏิทิน (รองรับสลับภาษา) */
function buildCalendarSelectors() {
    const monthOptionsList = document.getElementById('monthOptionsList');
    const yearOptionsList = document.getElementById('yearOptionsList');
    const monthWrapper = document.getElementById('monthWrapper');
    const yearWrapper = document.getElementById('yearWrapper');
    if (!monthOptionsList || !yearOptionsList) return;

    monthOptionsList.innerHTML = '';
    const months = getCalendarMonths();
    months.forEach((month, index) => {
        const div = document.createElement('div');
        div.className = 'custom-option';
        div.textContent = month;
        div.addEventListener('click', () => {
            viewingMonth = index;
            renderCalendar();
            if (monthWrapper) monthWrapper.classList.remove('open');
        });
        monthOptionsList.appendChild(div);
    });

    yearOptionsList.innerHTML = '';
    const cy = typeof viewingYear !== 'undefined' ? viewingYear : new Date().getFullYear();
    for (let y = cy - 3; y <= cy + 3; y++) {
        const div = document.createElement('div');
        div.className = 'custom-option';
        div.textContent = String(y);
        div.addEventListener('click', () => {
            viewingYear = y;
            renderCalendar();
            if (yearWrapper) yearWrapper.classList.remove('open');
        });
        yearOptionsList.appendChild(div);
    }
}

// วาดปฏิทิน (สมบูรณ์ 100%)
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return; 
    calendarGrid.innerHTML = ''; 

    const vMonth = typeof viewingMonth !== 'undefined' ? viewingMonth : new Date().getMonth();
    const vYear = typeof viewingYear !== 'undefined' ? viewingYear : new Date().getFullYear();

    buildCalendarSelectors();

    const monthNames = getCalendarMonths();
    if (document.getElementById('monthText')) document.getElementById('monthText').textContent = monthNames[vMonth]; 
    if (document.getElementById('yearText')) document.getElementById('yearText').textContent = vYear;

    document.querySelectorAll('#monthOptionsList .custom-option').forEach((el, i) => { el.classList.toggle('selected', i === vMonth); });
    document.querySelectorAll('#yearOptionsList .custom-option').forEach((el) => { el.classList.toggle('selected', parseInt(el.textContent) === vYear); });

    const firstDay = new Date(vYear, vMonth, 1).getDay();
    const daysInMonth = new Date(vYear, vMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) { 
        let emptyDiv = document.createElement('div'); 
        emptyDiv.className = 'calendar-day empty'; 
        calendarGrid.appendChild(emptyDiv); 
    }
    
    const safeToday = new Date();

    for (let day = 1; day <= daysInMonth; day++) {
        let dayDiv = document.createElement('div'); 
        dayDiv.className = 'calendar-day'; 
        const currentCellDateStr = `${vYear}-${String(vMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const dayTrades = tradeHistory.filter(t => t.date === currentCellDateStr);
        const dayTxs = transactions.filter(tx => !tx.isTrade && tx.txDate === currentCellDateStr);
        
        if (dayTrades.length > 0 || dayTxs.length > 0) {
            dayDiv.classList.add('has-trade');
            let netAmount = 0;
            
            dayTrades.forEach(t => {
                let amt = t.finalCurrency === 'USC' ? Number(t.finalAmount) / 100 : Number(t.finalAmount);
                if(t.finalOutcome === 'win') netAmount += amt; else netAmount -= amt;
            });
            dayTxs.forEach(tx => {
                if(tx.type === 'deposit') netAmount += tx.amountUSD; else netAmount -= tx.amountUSD;
            });

            if (netAmount > 0) dayDiv.classList.add('trade-win');
            else if (netAmount < 0) dayDiv.classList.add('trade-loss');
            else dayDiv.style.border = "1px solid #94a3b8"; 
            
            let summaryText = [];
            if (dayTrades.length > 0) summaryText.push(t('cal.orderCountFmt').replace('{n}', String(dayTrades.length)));
            if (dayTxs.length > 0) summaryText.push(`💰 ${t('cal.fund')}`);

            dayDiv.innerHTML = `<span>${day}</span><span class="trade-percent-label" style="font-size:9px; line-height: 1.3;">${summaryText.join('<br>')}</span>`;
            dayDiv.addEventListener('click', () => { if(typeof openViewDayModal === 'function') openViewDayModal(currentCellDateStr, dayTrades, dayTxs); });
        } else {
            dayDiv.textContent = day;
            dayDiv.addEventListener('click', () => { if(typeof openViewDayModal === 'function') openViewDayModal(currentCellDateStr, [], []); });
        }
        if (day === safeToday.getDate() && vMonth === safeToday.getMonth() && vYear === safeToday.getFullYear()) { 
            dayDiv.classList.add('today'); 
        }
        calendarGrid.appendChild(dayDiv);
    }
}

/**
 * ยอดเป็นดอลลาร์ (USD) สำหรับคำนวณ/เปรียบเทียบ — รองรับทั้งเอกสาร trades และ transactions
 * (เดิมหน้ารายละเอียดอ่านแค่ amountUSD ซึ่งมีแค่ใน transactions เลยกลายเป็น 0)
 */
function getTradeAmountUsd(tx) {
    if (tx == null) return 0;
    const aud = Number(tx.amountUSD);
    if (!Number.isNaN(aud) && tx.amountUSD !== undefined && tx.amountUSD !== null && tx.amountUSD !== '') {
        return aud;
    }
    const fa = Number(tx.finalAmount);
    if (!Number.isNaN(fa) && fa >= 0) {
        if (tx.finalCurrency === 'USC') return fa / 100;
        return fa;
    }
    const orig = Number(tx.originalAmount);
    if (!Number.isNaN(orig) && orig >= 0) {
        if (tx.currency === 'USC') return orig / 100;
        return orig;
    }
    const am = Number(tx.amount);
    return Number.isNaN(am) ? 0 : am;
}

/** แสดงผลกำไร/ขาดทุน: ถ้าเป็น USC แสดงจำนวน USC ที่กรอก + ค่าเทียบเป็น $ */
function formatTradeAmountLabel(tx, isWin) {
    const usd = getTradeAmountUsd(tx);
    const sign = isWin ? '+' : '−';
    if (tx.finalCurrency === 'USC' && tx.finalAmount != null && !Number.isNaN(Number(tx.finalAmount))) {
        const u = Number(tx.finalAmount);
        return `${sign}${u.toLocaleString('en-US')} USC <span style="font-size:12px;font-weight:600;opacity:0.85">(≈ $${Math.abs(usd).toFixed(2)})</span>`;
    }
    return `${sign}$${Math.abs(usd).toFixed(2)}`;
}

// 🚀 ฟังก์ชันเปิดดูรายละเอียดออเดอร์ (อิงธีมหน้าหลัก + เชื่อม ID หน้าเพจใหม่ถูกต้อง 100%)
window.openViewDayModal = function(dateStr, trades) {
    console.log("👉 กำลังเปิดประวัติเทรดวันที่:", dateStr);

    // 🚨 แก้ไขให้เรียกหา ID ของหน้าเพจใหม่ (viewTradePage) ให้ถูกต้อง
    const container = document.getElementById('tradeDetailsContainer');
    const title = document.getElementById('viewTradeTitle');
    const targetPage = document.getElementById('viewTradePage');

    // ถ้าหาหน้าต่าง HTML ไม่เจอ ให้แจ้งเตือน
    if (!container || !title || !targetPage) {
        console.error("❌ หา HTML ไม่เจอ! ตรวจสอบ ID: tradeDetailsContainer, viewTradeTitle, viewTradePage");
        return;
    }

    if (!trades || trades.length === 0) return;

    title.textContent = `${t('detail.tradeRecord')}: ${dateStr}`;
    container.innerHTML = '';

    trades.forEach(tx => {
        const isWin = tx.finalOutcome === 'win' || tx.result === 'win';
        const colorHex = isWin ? '#00e676' : '#ff003c'; 
        const percentText = tx.percent || tx.percentChange || '';
        
        const amountText = formatTradeAmountLabel(tx, isWin);
        
        const imgStyle = "width: 100%; height: 100%; object-fit: contain; cursor: zoom-in; border-radius: 8px; transition: 0.2s;";
        const beforeImgHtml = (tx.beforeImages && tx.beforeImages.length > 0) 
            ? `<img src="${tx.beforeImages[0]}" style="${imgStyle}" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'" onclick="if(window.openImageViewer) window.openImageViewer(this.src)">` 
            : `<div style="color: #52525b; font-size: 14px; font-weight: bold; letter-spacing: 1px;">${t('detail.noImage')}</div>`;
            
        const afterImgHtml = (tx.afterImages && tx.afterImages.length > 0) 
            ? `<img src="${tx.afterImages[0]}" style="${imgStyle}" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'" onclick="if(window.openImageViewer) window.openImageViewer(this.src)">` 
            : `<div style="color: #52525b; font-size: 14px; font-weight: bold; letter-spacing: 1px;">${t('detail.noImage')}</div>`;

        const reasonStr = tx.reason || tx.tradeReasonStep2 || tx.tradeSetup || '-';
        const emotionBeforeStr = tx.emotionBefore || tx.tradeEmotionStep2 || '-';
        const lessonStr = tx.lesson || tx.mistake || tx.tradeLessonStep3 || tx.tradeResult || '-';
        const emotionAfterStr = tx.emotionAfter || tx.tradeEmotionStep3 || '-';
        
        const lotStr = tx.lot || tx.lotSize || tx.tradeRiskLot || tx.riskLot || '-';
        const rrStr = tx.rr || tx.riskRR || tx.tradeRiskRR || '-';

        const tradePanel = document.createElement('div');
        tradePanel.style.cssText = 'display: flex; gap: 30px; width: 100%; align-items: stretch; margin-bottom: 20px;';

        const panelStyle = "flex: 1; display: flex; flex-direction: column; gap: 20px; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; background: rgba(255,255,255,0.03); padding: 25px; box-shadow: inset 0 0 20px rgba(0,0,0,0.5);";
        const textBlockStyle = (borderColor) => `background: rgba(0,0,0,0.3); border-left: 3px solid ${borderColor}; padding: 16px 20px; border-radius: 0 8px 8px 0; border-top: 1px solid rgba(255,255,255,0.02); border-right: 1px solid rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.02);`;
        const miniCardStyle = "background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; text-align: center;";

        tradePanel.innerHTML = `
            <div style="${panelStyle}">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 4px; height: 18px; background: #ffffff; border-radius: 4px;"></div>
                        <h4 style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 800; letter-spacing: 1px;">${t('detail.before')}</h4>
                    </div>
                    <span style="color: #ffffff; font-size: 15px; font-weight: 800; letter-spacing: 1px; background: rgba(255,255,255,0.1); padding: 6px 14px; border-radius: 8px;">${tx.symbol || 'ASSET'}</span>
                </div>

                <div style="width: 100%; height: 350px; background: rgba(0,0,0,0.6); border-radius: 12px; overflow: hidden; display: flex; justify-content: center; align-items: center; border: 1px solid rgba(255,255,255,0.04);">
                    ${beforeImgHtml}
                </div>

                <div style="display: flex; flex-direction: column; gap: 15px; flex: 1;">
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                        <div style="${miniCardStyle}">
                            <span style="color: #a1a1aa; font-size: 10px; font-weight: 700; display: block; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">${t('detail.time')}</span>
                            <span style="color: #ffffff; font-size: 14px; font-weight: 700;">${tx.time || '-'}</span>
                        </div>
                        <div style="${miniCardStyle}">
                            <span style="color: #a1a1aa; font-size: 10px; font-weight: 700; display: block; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">${t('detail.type')}</span>
                            <span style="color: #ffffff; font-size: 14px; font-weight: 700;">${tx.orderType ? tx.orderType.toUpperCase() : '-'}</span>
                        </div>
                        <div style="${miniCardStyle}">
                            <span style="color: #a1a1aa; font-size: 10px; font-weight: 700; display: block; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">${t('detail.lot')}</span>
                            <span style="color: #ffffff; font-size: 14px; font-weight: 700;">${lotStr}</span>
                        </div>
                        <div style="${miniCardStyle}">
                            <span style="color: #a1a1aa; font-size: 10px; font-weight: 700; display: block; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">${t('detail.rr')}</span>
                            <span style="color: #ffffff; font-size: 14px; font-weight: 700;">1:${rrStr}</span>
                        </div>
                    </div>

                    <div style="${textBlockStyle('#ffffff')}">
                        <span style="color: #a1a1aa; font-size: 11px; font-weight: 800; display: block; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">${t('detail.setup')}</span>
                        <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0; font-weight: 400;">${reasonStr}</p>
                    </div>
                    <div style="${textBlockStyle('#ffffff')} margin-bottom: 0;">
                        <span style="color: #a1a1aa; font-size: 11px; font-weight: 800; display: block; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">${t('detail.emotionPre')}</span>
                        <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0; font-weight: 400;">${emotionBeforeStr}</p>
                    </div>
                </div>
            </div>

            <div style="${panelStyle}">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 4px; height: 18px; background: ${colorHex}; border-radius: 4px;"></div>
                        <h4 style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 800; letter-spacing: 1px;">${t('detail.after')}</h4>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 22px; font-weight: 800; color: ${colorHex}; letter-spacing: 0.5px;">${amountText}</span>
                        ${percentText ? `<span style="background: ${isWin ? 'rgba(0,230,118,0.1)' : 'rgba(255,0,60,0.1)'}; color: ${colorHex}; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 800; letter-spacing: 0.5px;">${percentText}</span>` : ''}
                    </div>
                </div>

                <div style="width: 100%; height: 350px; background: rgba(0,0,0,0.6); border-radius: 12px; overflow: hidden; display: flex; justify-content: center; align-items: center; border: 1px solid rgba(255,255,255,0.04);">
                    ${afterImgHtml}
                </div>

                <div style="display: flex; flex-direction: column; gap: 15px; flex: 1;">
                    <div style="${textBlockStyle(colorHex)}">
                        <span style="color: #a1a1aa; font-size: 11px; font-weight: 800; display: block; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">${t('detail.lesson')}</span>
                        <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0; font-weight: 400;">${lessonStr}</p>
                    </div>
                    <div style="${textBlockStyle(colorHex)} margin-bottom: 0;">
                        <span style="color: #a1a1aa; font-size: 11px; font-weight: 800; display: block; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">${t('detail.emotionPost')}</span>
                        <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0; font-weight: 400;">${emotionAfterStr}</p>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(tradePanel);
    });

    // 🚨 ซ่อนหน้าอื่นๆ ทั้งหมด แล้วโชว์หน้า viewTradePage อย่างเดียว
    try {
        ['homePage', 'calendarPage', 'overviewPage', 'addTradePage', 'addTradeStep2Page', 'addTradeStep3Page', 'addTradeStep4Page'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.style.display = 'none';
        });
        targetPage.style.display = 'block';
        
        if(document.getElementById('navHome')) document.getElementById('navHome').style.color = 'var(--accent-color)';
        if(document.getElementById('navOverview')) document.getElementById('navOverview').style.color = 'var(--text-main)';
        if(document.getElementById('navCalendar')) document.getElementById('navCalendar').style.color = 'var(--text-main)';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        console.error("❌ เปลี่ยนหน้าไม่สำเร็จ:", err);
    }
};

// ==========================================
// 4. ระบบลบข้อมูล (Delete Data)
// ==========================================

// ลบทีละรายการ
window.deleteTx = async function(event, txId, isTrade, tradeId) {
    if (event) event.stopPropagation();
    if (deleteTxInProgress) return;

    const confirmMsg = isTrade ? t('alert.deleteTradeConfirm') : t('alert.deleteRegularConfirm');

    if (!confirm(confirmMsg)) return;

    deleteTxInProgress = true;
    try {
        const batch = writeBatch(db);
        if (txId) batch.delete(doc(db, "transactions", txId));
        if (isTrade && tradeId) batch.delete(doc(db, "trades", tradeId));
        await batch.commit();

        alert(t('alert.deleteSuccess'));
        if (getEl("viewTradePage")) getEl("viewTradePage").style.display = "none";
        if (getEl("homePage")) getEl("homePage").style.display = "block";
        if (typeof loadData === "function") await loadData();
    } catch (error) {
        alert(t('alert.deleteFail') + error.message);
    } finally {
        deleteTxInProgress = false;
    }
};

// ==========================================
    // 5. เหตุการณ์และปุ่มกด (Event Listeners)
    // ==========================================
    function initAppEvents() {

        const prevMonthBtn = getEl('prevMonthBtn');
        const nextMonthBtn = getEl('nextMonthBtn');
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                viewingMonth--;
                if (viewingMonth < 0) {
                    viewingMonth = 11;
                    viewingYear--;
                }
                renderCalendar();
            });
        }
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                viewingMonth++;
                if (viewingMonth > 11) {
                    viewingMonth = 0;
                    viewingYear++;
                }
                renderCalendar();
            });
        }
        
        // 🚀 ระบบบันทึกการเทรด (Save Trade) รุ่นสมบูรณ์แบบ
        const saveBtn = document.getElementById('saveTradeBtn'); // ใช้ ID ของปุ่มใหม่ (Step 4)

        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                if (saveBtn.dataset.processing === '1') return;

                // 1. ดึงยอดเงินจากช่องใหม่
                const finalAmount = Number(getEl('tradeAmount').value);
                if (isNaN(finalAmount) || finalAmount <= 0) return alert(t('alert.saveAmountInvalid'));

                const btn = getEl('saveTradeBtn');
                saveBtn.dataset.processing = '1';
                btn.innerHTML = t('trade.uploading'); 
                btn.style.pointerEvents = 'none';

                try {
                    // 2. ดึงค่าจาก Radio Button รุ่นใหม่
                    const currencyElem = document.querySelector('input[name="tradeCurrency"]:checked');
                    const outcomeElem = document.querySelector('input[name="tradeResult"]:checked');
                    const currency = currencyElem ? currencyElem.value : 'USD';
                    const outcome = outcomeElem ? outcomeElem.value : 'win';
                    const symbol = getEl('tradeSymbol') ? getEl('tradeSymbol').value : 'Unknown';
                    let amountUSD = currency === 'USC' ? finalAmount / 100 : finalAmount;

                    // 3. คำนวณเปอร์เซ็นต์
                    let percentChange = currentBalance > 0 ? (amountUSD / currentBalance) * 100 : 100;
                    let percentChangeStr = outcome === 'win' ? `+${percentChange.toFixed(2)}%` : `-${percentChange.toFixed(2)}%`;

                    // 4. โยนรูปขึ้น ImgBB (เหมือนระบบเดิมของคุณที่สมบูรณ์อยู่แล้ว)
                    let finalBeforeImgs = [];
                    for (let i = 0; i < beforeImages.length; i++) {
                        const imgUrl = await uploadToImgBB(beforeImages[i]);
                        finalBeforeImgs.push(imgUrl); 
                    }

                    let finalAfterImgs = [];
                    for (let i = 0; i < afterImages.length; i++) {
                        const imgUrl = await uploadToImgBB(afterImages[i]);
                        finalAfterImgs.push(imgUrl);
                    }

                    const getVal = (id) => getEl(id) ? getEl(id).value : '';
                    const getRadio = (name) => document.querySelector(`input[name="${name}"]:checked`) ? document.querySelector(`input[name="${name}"]:checked`).value : '';

                    // 5. เตรียมข้อมูล Trade (ใช้ ID ตาม UI ใหม่)
                    const tradeData = {
                        date: getVal('tradeDate'), 
                        time: getVal('tradeTime'), 
                        symbol: symbol.toUpperCase(), 
                        orderType: getVal('tradeOrderType'), 
                        percent: percentChangeStr, 
                        reason: getVal('tradeReasonStep2'), 
                        emotionBefore: getVal('tradeEmotionStep2'), 
                        lot: getVal('tradeRiskLot'), 
                        rr: getVal('tradeRiskRR'), 
                        mistake: getVal('tradeLessonStep3'), // บทเรียนหลังเทรด
                        emotionAfter: getVal('tradeEmotionStep3'), // อารมณ์หลังเทรด
                        finalOutcome: outcome, 
                        finalAmount: finalAmount, 
                        finalCurrency: currency, 
                        beforeImages: finalBeforeImgs, 
                        afterImages: finalAfterImgs, 
                        timestamp: Date.now()
                    };
                    
                    // บันทึกลง Firestore (Trades) แล้วค่อย Transaction — ถ้า transaction พังให้ลบ trade คืน (กันยอดค้าง/คู่ไม่ครบ)
                    const tradeRef = await addDoc(collection(db, "trades"), tradeData);

                    try {
                        await addDoc(collection(db, "transactions"), {
                            tradeId: tradeRef.id,
                            type: outcome === 'win' ? 'deposit' : 'withdraw',
                            isTrade: true,
                            currency: currency,
                            originalAmount: finalAmount,
                            amountUSD: amountUSD,
                            percentChange: percentChangeStr,
                            note: `รายการเทรด ${symbol.toUpperCase()}`,
                            date: new Date().toLocaleString('th-TH'),
                            timestamp: Date.now()
                        });
                    } catch (txErr) {
                        try {
                            await deleteDoc(doc(db, 'trades', tradeRef.id));
                        } catch (cleanupErr) {
                            console.error('rollback trade failed:', cleanupErr);
                        }
                        throw txErr;
                    }

                    // 7. สำเร็จ! โชว์ป๊อปอัป และล้างฟอร์ม
                    if(getEl('customSuccessModal')) getEl('customSuccessModal').style.display = 'flex';
                    
                } catch (e) {
                    console.error(e); 
                    alert(t('alert.saveFail') + e.message);
                } finally {
                    saveBtn.dataset.processing = '';
                    btn.innerHTML = t('trade.confirmSaveBtn'); 
                    btn.style.pointerEvents = 'auto';
                }
            });
        }

        // --- ฝาก/ถอน (Fund Management) → Firestore ---
        const confirmTxBtn = getEl('confirmTxBtn');
        if (confirmTxBtn) {
            let fundBusy = false;
            confirmTxBtn.addEventListener('click', async () => {
                if (fundBusy) return;
                const type = document.querySelector('input[name="txTypeNew"]:checked')?.value || 'deposit';
                const curr = document.querySelector('input[name="txCurrNew"]:checked')?.value || 'USD';
                const raw = Number(getEl('txAmount')?.value);
                if (isNaN(raw) || raw <= 0) {
                    alert(t('alert.fundAmountInvalid'));
                    return;
                }
                const amtUSD = curr === 'USC' ? raw / 100 : raw;
                if (type === 'withdraw' && currentBalance < amtUSD) {
                    alert(t('alert.fundWithdrawInsufficient'));
                    return;
                }

                let percentChange = currentBalance > 0 ? (amtUSD / currentBalance) * 100 : 100;
                let percentChangeStr = type === 'deposit' ? `+${percentChange.toFixed(2)}%` : `-${percentChange.toFixed(2)}%`;

                const txDateVal = getEl('txDate')?.value;
                let ts = Date.now();
                if (txDateVal) {
                    const d = new Date(txDateVal + 'T12:00:00');
                    if (!isNaN(d.getTime())) ts = d.getTime();
                }

                fundBusy = true;
                confirmTxBtn.disabled = true;
                try {
                    const dayStr = txDateVal && /^\d{4}-\d{2}-\d{2}$/.test(txDateVal)
                        ? txDateVal
                        : new Date(ts).toISOString().slice(0, 10);
                    await addDoc(collection(db, 'transactions'), {
                        type,
                        isTrade: false,
                        currency: curr,
                        originalAmount: raw,
                        amountUSD: amtUSD,
                        percentChange: percentChangeStr,
                        note: getEl('txNote')?.value || '',
                        date: new Date(ts).toLocaleString('th-TH'),
                        timestamp: ts,
                        txDate: dayStr
                    });
                    if (getEl('txModal')) getEl('txModal').style.display = 'none';
                    if (getEl('txAmount')) getEl('txAmount').value = '';
                    if (getEl('txNote')) getEl('txNote').value = '';
                    await loadData();
                } catch (e) {
                    alert(t('alert.fundSaveFail') + e.message);
                } finally {
                    fundBusy = false;
                    confirmTxBtn.disabled = false;
                }
            });
        }

        // --- ลบทั้งหมด (Firestore) ---
        const deleteAllBtn = getEl('deleteAllBtn');
        const confirmDeleteAllBtn = getEl('confirmDeleteAllBtn');
        const cancelDeleteAllBtn = getEl('cancelDeleteAllBtn');
        if (cancelDeleteAllBtn) {
            cancelDeleteAllBtn.addEventListener('click', () => {
                if (getEl('deleteAllModal')) getEl('deleteAllModal').style.display = 'none';
            });
        }
        if (deleteAllBtn && confirmDeleteAllBtn) {
            deleteAllBtn.addEventListener('click', () => {
                if (!transactions.length && !tradeHistory.length) {
                    alert(t('alert.clearNoData'));
                    return;
                }
                if (getEl('deleteAllModal')) getEl('deleteAllModal').style.display = 'flex';
            });
            confirmDeleteAllBtn.addEventListener('click', async () => {
                confirmDeleteAllBtn.disabled = true;
                try {
                    await deleteAllDocumentsInCollection('trades');
                    await deleteAllDocumentsInCollection('transactions');
                    if (getEl('deleteAllModal')) getEl('deleteAllModal').style.display = 'none';
                    await loadData();
                    alert(t('alert.clearDone'));
                } catch (e) {
                    alert(t('alert.clearFail') + e.message);
                } finally {
                    confirmDeleteAllBtn.disabled = false;
                }
            });
        }
        
        // ---- 8. จัดการปุ่ม "ตกลง" ใน Popup ความสำเร็จ ----
        const closeSuccessBtn = document.getElementById('closeSuccessBtn');
        if (closeSuccessBtn) {
            closeSuccessBtn.addEventListener('click', () => {
                if(getEl('customSuccessModal')) getEl('customSuccessModal').style.display = 'none';
                
                clearTradeForm(); 
                goBackFromTrade(); 
                
                // โหลดข้อมูลจาก Firestore ใหม่หมด เพื่อให้ยอดเงินและปฏิทินอัปเดตแบบสดๆ!
                loadData(); 
            });
        }

        document.querySelectorAll('[data-overview-period]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const p = btn.getAttribute('data-overview-period');
                if (p !== 'month' && p !== 'quarter' && p !== 'year') return;
                overviewPeriod = p;
                document.querySelectorAll('[data-overview-period]').forEach((b) => {
                    b.classList.toggle('active', b === btn);
                });
                if (typeof window.renderOverview === 'function') window.renderOverview();
            });
        });
    }

// ==========================================
// 🚀 6. เริ่มต้นการทำงานของแอป (Initialize)
// ==========================================
initAppEvents();
buildCalendarSelectors();
initI18n();
window.addEventListener('app:languagechange', () => {
    updateBalanceUI();
    renderTransactions();
    renderCalendar();
    if (typeof window.renderOverview === 'function') window.renderOverview();
});
loadData();
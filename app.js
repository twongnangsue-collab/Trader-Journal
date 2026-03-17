// ==========================================
// ไฟล์ app.js: สมองกลจัดการข้อมูล (Firestore + ImgBB API)
// ==========================================
import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { clearTradeForm, goBackFromTrade, beforeImages, afterImages, triggerAddTrade } from './ui.js';

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

// ตั้งค่าปฏิทิน
let currentDate = new Date();
let viewingMonth = currentDate.getMonth(); 
let viewingYear = currentDate.getFullYear();
const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

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

// โหลดข้อมูลทั้งหมดจาก Firebase (ตอนเปิดแอป)
window.loadData = async function() {
    try {
        console.log("กำลังดึงข้อมูลจาก Firebase...");
        
        const txSnapshot = await getDocs(collection(db, "transactions"));
        transactions = txSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const trSnapshot = await getDocs(collection(db, "trades"));
        tradeHistory = trSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        currentBalance = 0;
        transactions.forEach(tx => {
            if(tx.type === 'deposit') currentBalance += tx.amountUSD;
            else currentBalance -= tx.amountUSD;
        });

        // อัปเดตหน้าจอหลังจากได้ข้อมูลครบ
        updateBalanceUI();
        renderTransactions();
        renderCalendar();
        renderEquityChart();

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
        if(getEl('toggleCurrencyBtn')) getEl('toggleCurrencyBtn').textContent = 'เปลี่ยนเป็น USC';
    } else {
        getEl('currencySymbol').textContent = '¢'; 
        getEl('balanceValue').textContent = (currentBalance * 100).toLocaleString('en-US', {maximumFractionDigits: 0}); 
        if(getEl('toggleCurrencyBtn')) getEl('toggleCurrencyBtn').textContent = 'เปลี่ยนเป็น USD';
    }
}

// วาดกราฟ Equity Curve
window.renderEquityChart = function() {
    const ctx = getEl('equityChart');
    if (!ctx) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const labels = [];
    for (let i = 1; i <= daysInMonth; i++) labels.push(i);

    const startOfMonthTimestamp = new Date(year, month, 1).getTime();
    let balanceBeforeThisMonth = 0;
    
    transactions.forEach(tx => {
        if (tx.timestamp && tx.timestamp < startOfMonthTimestamp) {
            if (tx.type === 'deposit') balanceBeforeThisMonth += tx.amountUSD;
            else balanceBeforeThisMonth -= tx.amountUSD;
        }
    });

    const dataPoints = [];
    let runningBalance = balanceBeforeThisMonth;

    for (let day = 1; day <= daysInMonth; day++) {
        const startOfDay = new Date(year, month, day, 0, 0, 0, 0).getTime();
        const endOfDay = new Date(year, month, day, 23, 59, 59, 999).getTime();

        const dailyTx = transactions.filter(tx => tx.timestamp >= startOfDay && tx.timestamp <= endOfDay);
        dailyTx.forEach(tx => {
            if (tx.type === 'deposit') runningBalance += tx.amountUSD;
            else runningBalance -= tx.amountUSD;
        });

        let displayValue = displayCurrency === 'USC' ? runningBalance * 100 : runningBalance;
        dataPoints.push(displayValue);
    }

    if (equityChartInstance) equityChartInstance.destroy();

    const currentDayVal = dataPoints[today.getDate() - 1]; 
    const startVal = displayCurrency === 'USC' ? balanceBeforeThisMonth * 100 : balanceBeforeThisMonth;
    const isProfit = currentDayVal >= startVal; 
    
    const lineColor = isProfit ? '#10b981' : '#ef4444'; 
    const bgColor = isProfit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'; 

    equityChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `ยอดเงิน (${displayCurrency})`,
                data: dataPoints,
                borderColor: lineColor,
                backgroundColor: bgColor,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }, 
                tooltip: { callbacks: { label: function(context) { let symbol = displayCurrency === 'USD' ? '$' : '¢'; return ` ${symbol}${context.parsed.y.toLocaleString('en-US', {minimumFractionDigits: 2})}`; } } }
            },
            scales: {
                x: { grid: { display: false } }, 
                y: { border: { display: false }, ticks: { callback: function(value) { return displayCurrency === 'USD' ? '$' + value : '¢' + value; } } }
            },
            interaction: { intersect: false, mode: 'index' },
        }
    });
}

// วาดรายการประวัติหน้าแรก
function renderTransactions() {
    const txList = getEl('transactionList');
    if (!txList) return;
    txList.innerHTML = '';

    if (transactions.length === 0) { 
        txList.innerHTML = '<div class="empty-state">ยังไม่มีประวัติการทำรายการ</div>'; 
        return; 
    }
    
    const sortedTx = [...transactions].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));

    sortedTx.forEach(tx => {
        const isDep = tx.type === 'deposit'; 
        const clr = isDep ? 'deposit' : 'withdraw';
        let percentHtml = '';
        if (tx.percentChange) { 
            percentHtml = `<div class="history-percent ${isDep ? 'pos' : 'neg'}">${tx.percentChange}</div>`; 
        }

        const html = tx.currency === 'USC' 
            ? `${isDep?'+':'-'}${tx.originalAmount} USC <br><span style="font-size:11px; color:var(--text-muted);">(${isDep?'+':'-'}$${tx.amountUSD.toFixed(2)})</span>` 
            : `${isDep?'+':'-'}$${tx.amountUSD.toFixed(2)}`;
            
        let titleText = isDep ? 'รายการฝากเงิน' : 'รายการถอนเงิน';
        if (tx.isTrade) titleText = isDep ? '🏆 กำไรจากเทรด' : '💔 ขาดทุนจากเทรด';
        
        const deleteBtnHtml = `<button onclick="deleteTx(event, '${tx.id}', ${tx.isTrade ? 'true' : 'false'}, '${tx.tradeId || ''}')" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:14px; padding:0; margin-left:10px;" title="ลบรายการนี้">🗑️</button>`;

        const card = document.createElement('div'); 
        card.className = `tx-card ${clr}`;
        card.innerHTML = `
            <div class="tx-info">
                <h4 style="display:flex; justify-content:space-between; align-items:center;">
                    <span>${titleText} ${percentHtml}</span> 
                    ${deleteBtnHtml}
                </h4>
                <p>📝 ${tx.note||'-'}</p>
                <p style="font-size:10px; color:var(--text-muted); margin-top:3px;">⏰ ${tx.date}</p>
            </div>
            <div class="tx-right-group">
                <div class="tx-amount ${clr}">${html}</div>
            </div>
        `;
        
        if (tx.isTrade && tx.tradeId) {
            card.style.cursor = 'pointer';
            card.title = 'คลิกเพื่อดูรายละเอียดออเดอร์';
            card.onmouseover = () => { card.style.transform = 'scale(1.02)'; card.style.transition = '0.2s'; };
            card.onmouseout = () => card.style.transform = 'scale(1)';
            card.addEventListener('click', () => {
                const matchedTrade = tradeHistory.find(t => t.id === tx.tradeId);
                if (matchedTrade) {
                    window.openViewDayModal(matchedTrade.date, [matchedTrade]);
                }
            });
        }

        txList.appendChild(card);
    });
}

// วาดปฏิทิน (สมบูรณ์ 100%)
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return; 
    calendarGrid.innerHTML = ''; 

    const vMonth = typeof viewingMonth !== 'undefined' ? viewingMonth : new Date().getMonth();
    const vYear = typeof viewingYear !== 'undefined' ? viewingYear : new Date().getFullYear();

    if (document.getElementById('monthText')) document.getElementById('monthText').textContent = thaiMonths[vMonth]; 
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
            if(dayTrades.length > 0) summaryText.push(`${dayTrades.length} ออเดอร์`);
            if(dayTxs.length > 0) summaryText.push(`💰 ฝาก/ถอน`);

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

// หน้าต่างแสดงรายละเอียดแต่ละวัน
window.openViewDayModal = function(dateStr, tradesList, txsList = []) {
    if (typeof selectedDateForNewTrade !== 'undefined') selectedDateForNewTrade = dateStr; 
    
    const [y, m, d] = dateStr.split('-');
    const displayDate = `${parseInt(d)} ${thaiMonths[parseInt(m)-1]} ${y}`;
    
    if(document.getElementById('viewDayTitle')) document.getElementById('viewDayTitle').textContent = `บันทึกวันที่ ${displayDate}`;
    
    const listContainer = document.getElementById('dayTradesList');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (tradesList.length === 0 && txsList.length === 0) {
        listContainer.innerHTML = `<div class="empty-state">ไม่มีข้อมูลการทำรายการในวันนี้</div>`;
    } else {
        // การ์ดฝากถอนเงิน
        txsList.forEach((tx) => {
            const isDep = tx.type === 'deposit';
            const card = document.createElement('div');
            card.className = 'trade-record-card';
            card.style.borderLeft = `4px solid ${isDep ? '#10b981' : '#ef4444'}`;
            card.innerHTML = `
                <div class="trade-card-header" style="border-bottom:none; margin-bottom:0; padding-bottom:0;">
                    <div class="trade-card-title-group">
                        <h4 class="trade-symbol">${isDep ? '🟢 ฝากเงิน' : '🔴 ถอนเงิน'} <span style="font-size:12px; font-weight:normal; color:#64748b;">(${tx.originalAmount} ${tx.currency})</span></h4>
                    </div>
                    <button class="delete-card-btn" onclick="if(typeof deleteTx === 'function') deleteTx(event, '${tx.id}', false, null)">🗑️ ลบ</button>
                </div>
                ${tx.note ? `<div style="font-size:12px; color:#64748b; margin-top:8px;">📝 หมายเหตุ: ${tx.note}</div>` : ''}
            `;
            listContainer.appendChild(card);
        });

        // การ์ดออเดอร์เทรด
        tradesList.forEach((trade) => {
            let beforeImgsHtml = '';
            if(trade.beforeImages && trade.beforeImages.length > 0) {
                beforeImgsHtml = `<div class="section-label" style="margin-top:15px;">Before</div><div class="trade-img-row">` + trade.beforeImages.map(img => `<img src="${img}" class="trade-preview-img" onclick="expandImg(this.src)">`).join('') + `</div>`;
            }
            let afterImgsHtml = '';
            if(trade.afterImages && trade.afterImages.length > 0) {
                afterImgsHtml = `<div class="section-label" style="background: rgba(40, 167, 69, 0.1); color: #28a745;">After</div><div class="trade-img-row">` + trade.afterImages.map(img => `<img src="${img}" class="trade-preview-img" onclick="expandImg(this.src)">`).join('') + `</div>`;
            }

            const matchingTx = transactions.find(t => t.tradeId === trade.id);
            const txIdForDelete = matchingTx ? matchingTx.id : '';

            const card = document.createElement('div');
            card.className = 'trade-record-card';
            card.innerHTML = `
                <div class="trade-card-header">
                    <div class="trade-card-title-group">
                        <h4 class="trade-symbol">${trade.symbol || '-'}</h4>
                        <span class="trade-result-badge ${trade.finalOutcome === 'win' ? 'win' : 'loss'}">${trade.finalOutcome === 'win' ? '🏆' : '💔'} ${trade.percent || ''}</span>
                    </div>
                    <button class="delete-card-btn" onclick="if(typeof deleteTx === 'function') deleteTx(event, '${txIdForDelete}', true, '${trade.id}')">🗑️ ลบ</button>
                </div>
                
                <div class="trade-info-grid">
                    <div class="info-item"><span class="info-label">เวลาเข้าเทรด</span><span class="info-value">${trade.time || '-'}</span></div>
                    <div class="info-item"><span class="info-label">ฝั่งที่เข้าเทรด</span><span class="info-value" style="color:var(--primary-color);">${(trade.orderType||'').toUpperCase()}</span></div>
                    <div class="info-item"><span class="info-label">ขนาด Lot</span><span class="info-value">${trade.lot || '-'}</span></div>
                    <div class="info-item"><span class="info-label">R:R</span><span class="info-value">${trade.rr || '-'}</span></div>
                </div>

                <div class="trade-notes-box">
                    <div class="note-row"><span class="note-label">📝 เหตุผลการเข้า:</span><span class="note-text">${trade.reason || '-'}</span></div>
                    <div class="note-row"><span class="note-label">🧠 อารมณ์ก่อนเทรด:</span><span class="note-text">${trade.emotionBefore || '-'}</span></div>
                </div>

                <div class="trade-notes-box ${trade.followPlan === 'yes' ? 'plan-yes' : 'plan-no'}">
                    <div class="note-row"><span class="note-label">🎯 ทำตามแผนไหม?:</span><span class="note-text" style="font-weight:bold; color: ${trade.followPlan === 'yes' ? '#10b981' : '#ef4444'}">${trade.followPlan === 'yes' ? '✅ ทำตามแผนอย่างเคร่งครัด' : '❌ หลุดแผน/ใช้อารมณ์'}</span></div>
                    <div class="note-row"><span class="note-label">⚠️ ข้อผิดพลาด:</span><span class="note-text">${trade.mistake || '-'}</span></div>
                    <div class="note-row"><span class="note-label">💡 แนวทางแก้ไข:</span><span class="note-text">${trade.improvement || '-'}</span></div>
                    <div class="note-row"><span class="note-label">🧘 อารมณ์หลังเทรด:</span><span class="note-text">${trade.emotionAfter || '-'}</span></div>
                </div>
                ${beforeImgsHtml} ${afterImgsHtml}
            `;
            listContainer.appendChild(card);
        });
    }
    
    const viewDayModal = document.getElementById('viewDayModal');
    if(viewDayModal) viewDayModal.style.display = 'flex';
}

// ==========================================
// 4. ระบบลบข้อมูล (Delete Data)
// ==========================================

// ลบทีละรายการ
window.deleteTx = async function(event, txId, isTrade, tradeId) {
    if (event) event.stopPropagation(); 
    
    const confirmMsg = isTrade 
        ? "รายการนี้คือผลกำไร/ขาดทุนจากการเทรด \nหากลบ ระบบจะลบออเดอร์เทรดนี้ออกจากปฏิทินด้วย ยืนยันหรือไม่?" 
        : "ต้องการลบรายการฝาก/ถอนนี้ใช่หรือไม่?";
        
    if (confirm(confirmMsg)) {
        try {
            if (txId) await deleteDoc(doc(db, "transactions", txId)); 
            if (isTrade && tradeId) await deleteDoc(doc(db, "trades", tradeId)); 
            
            alert("ลบข้อมูลสำเร็จ ระบบกำลังอัปเดตยอดเงิน...");
            if (getEl('viewDayModal')) getEl('viewDayModal').style.display = 'none';
            if (typeof loadData === 'function') loadData(); 
        } catch (error) {
            alert("ลบไม่สำเร็จ: " + error.message);
        }
    }
};

// ==========================================
    // 5. เหตุการณ์และปุ่มกด (Event Listeners)
    // ==========================================
    function initAppEvents() {
        
        // 🚀 ระบบบันทึกการเทรด (Save Trade) รุ่นสมบูรณ์แบบ
        const saveBtn = document.getElementById('saveTradeBtn'); // ใช้ ID ของปุ่มใหม่ (Step 4)

        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                // 1. ดึงยอดเงินจากช่องใหม่
                const finalAmount = Number(getEl('tradeAmount').value);
                if(isNaN(finalAmount) || finalAmount <= 0) return alert('กรุณาระบุจำนวนเงินสุทธิให้ถูกต้อง');

                const btn = getEl('saveTradeBtn');
                btn.textContent = '⏳ กำลังอัปโหลด...'; 
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
                    
                    // บันทึกลง Firestore (Trades)
                    const tradeRef = await addDoc(collection(db, "trades"), tradeData);

                    // 6. บันทึกลง Firestore (Transactions เพื่อให้ยอดเงินขยับ)
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

                    // 7. สำเร็จ! โชว์ป๊อปอัป และล้างฟอร์ม
                    if(getEl('customSuccessModal')) getEl('customSuccessModal').style.display = 'flex';
                    
                } catch (e) {
                    console.error(e); 
                    alert('⚠️ ไม่สามารถบันทึกได้: ' + e.message);
                } finally {
                    btn.innerHTML = '💾 ยืนยันการบันทึกข้อมูล'; 
                    btn.style.pointerEvents = 'auto';
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
    }



// ==========================================
// 🚀 6. เริ่มต้นการทำงานของแอป (Initialize)
// ==========================================
initAppEvents();
loadData();
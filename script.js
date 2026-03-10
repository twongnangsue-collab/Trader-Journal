document.addEventListener("DOMContentLoaded", function() {
    
    // --- ตัวแปรควบคุมหน้าจอ (ที่ผมลืมใส่ไปรอบที่แล้ว 🙏) ---
    let isShowingCalendar = false; 
    let previousPage = 'home';
    let selectedDateForNewTrade = null; 
    let itemToDelete = null;
    let currentDate = new Date();

    // --- ระบบซ่อมแซมตัวเอง (Auto-Repair) ---
    let currentBalance = 0.00;
    let transactions = [];
    let tradeHistory = [];
    
    try {
        let bal = parseFloat(localStorage.getItem('myBalance'));
        if (isNaN(bal) || !isFinite(bal)) bal = 0.00;
        currentBalance = bal;

        let tx = JSON.parse(localStorage.getItem('myTransactions'));
        transactions = Array.isArray(tx) ? tx : [];
        
        let th = JSON.parse(localStorage.getItem('myTradeHistory'));
        tradeHistory = Array.isArray(th) ? th : [];
    } catch(e) {
        console.warn("Storage Error - รีเซ็ตข้อมูลอัตโนมัติ");
        currentBalance = 0.00; transactions = []; tradeHistory = [];
    }

    let displayCurrency = localStorage.getItem('displayCurrency') || 'USD';
    let isDarkMode = localStorage.getItem('darkMode') === 'true';

    // --- ดึง UI Elements อย่างปลอดภัย ---
    const getEl = (id) => document.getElementById(id);
    
    const balanceValue = getEl('balanceValue');
    const currencySymbol = getEl('currencySymbol');
    const toggleCurrencyBtn = getEl('toggleCurrencyBtn');
    const themeToggleBtn = getEl('themeToggleBtn');
    const txListContainer = getEl('transactionList');
    
    const homePage = getEl('homePage');
    const calendarPage = getEl('calendarPage');
    const pageToggleBtn = getEl('pageToggleBtn');

    const addTradePage = getEl('addTradePage');
    const addTradeStep2Page = getEl('addTradeStep2Page'); 
    const addTradeStep3Page = getEl('addTradeStep3Page'); 
    const addTradeStep4Page = document.getElementById('addTradeStep4Page'); 
    
    const addTradeFabBtn = getEl('addTradeFabBtn'); 
    const nextStepFabBtn = getEl('nextStepFabBtn'); 
    const nextStep2FabBtn = getEl('nextStep2FabBtn'); 
    const nextStep3FabBtn = getEl('nextStep3FabBtn'); 
    const saveTradeFabBtn = getEl('saveTradeFabBtn'); 
    
    const backFromTradeBtn = getEl('backFromTradeBtn'); 
    const backToStep1Btn = getEl('backToStep1Btn'); 
    const backToStep2Btn = getEl('backToStep2Btn'); 
    const backToStep3Btn = getEl('backToStep3Btn'); 
    const cancelTradeModal = getEl('cancelTradeModal');

    // ==========================================
    // ระบบสลับหน้าบันทึกเทรด
    // ==========================================
    function triggerAddTrade(prefillDate = null) {
        previousPage = isShowingCalendar ? 'calendar' : 'home';
        if(homePage) homePage.style.display = 'none'; 
        if(calendarPage) calendarPage.style.display = 'none';
        if(addTradeFabBtn) addTradeFabBtn.style.display = 'none'; 
        if(pageToggleBtn) pageToggleBtn.style.display = 'none'; 
        if(themeToggleBtn) themeToggleBtn.style.display = 'none'; 
        if(toggleCurrencyBtn) toggleCurrencyBtn.style.display = 'none'; 

        const now = new Date();
        const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
        
        if(getEl('tradeDate')) getEl('tradeDate').value = prefillDate ? prefillDate : localDate.toISOString().split('T')[0];
        if(getEl('tradeTime')) getEl('tradeTime').value = now.toTimeString().slice(0,5);

        if(addTradePage) addTradePage.style.display = 'block'; 
        if(nextStepFabBtn) nextStepFabBtn.style.display = 'block'; 
    }

    if (addTradeFabBtn) addTradeFabBtn.addEventListener('click', () => triggerAddTrade());

    if (nextStepFabBtn) {
        nextStepFabBtn.addEventListener('click', () => {
            if(addTradePage) addTradePage.style.display = 'none';
            if (addTradeStep2Page) addTradeStep2Page.style.display = 'block';
            if (nextStepFabBtn) nextStepFabBtn.style.display = 'none';
            if (nextStep2FabBtn) nextStep2FabBtn.style.display = 'block';
        });
    }

    if (backToStep1Btn) {
        backToStep1Btn.addEventListener('click', () => {
            if (addTradeStep2Page) addTradeStep2Page.style.display = 'none';
            if (addTradePage) addTradePage.style.display = 'block';
            if (nextStep2FabBtn) nextStep2FabBtn.style.display = 'none';
            if (nextStepFabBtn) nextStepFabBtn.style.display = 'block';
        });
    }

    if (nextStep2FabBtn) {
        nextStep2FabBtn.addEventListener('click', () => {
            if (addTradeStep2Page) addTradeStep2Page.style.display = 'none';
            if (addTradeStep3Page) addTradeStep3Page.style.display = 'block';
            if (nextStep2FabBtn) nextStep2FabBtn.style.display = 'none';
            if (nextStep3FabBtn) nextStep3FabBtn.style.display = 'block';
        });
    }

    if (backToStep2Btn) {
        backToStep2Btn.addEventListener('click', () => {
            if (addTradeStep3Page) addTradeStep3Page.style.display = 'none';
            if (addTradeStep2Page) addTradeStep2Page.style.display = 'block';
            if (nextStep3FabBtn) nextStep3FabBtn.style.display = 'none';
            if (nextStep2FabBtn) nextStep2FabBtn.style.display = 'block';
        });
    }

    if (nextStep3FabBtn) {
        nextStep3FabBtn.addEventListener('click', () => {
            if (addTradeStep3Page) addTradeStep3Page.style.display = 'none';
            if (addTradeStep4Page) addTradeStep4Page.style.display = 'block';
            if (nextStep3FabBtn) nextStep3FabBtn.style.display = 'none';
            if (saveTradeFabBtn) saveTradeFabBtn.style.display = 'block';
        });
    }

    if (backToStep3Btn) {
        backToStep3Btn.addEventListener('click', () => {
            if (addTradeStep4Page) addTradeStep4Page.style.display = 'none';
            if (addTradeStep3Page) addTradeStep3Page.style.display = 'block';
            if (saveTradeFabBtn) saveTradeFabBtn.style.display = 'none';
            if (nextStep3FabBtn) nextStep3FabBtn.style.display = 'block';
        });
    }

    // ==========================================
    // ระบบอัปโหลดรูปภาพ
    // ==========================================
    let beforeImages = []; let afterImages = [];
    function setupCarousel(inputId, wrapperId, placeholderId, dotsId, prevBtnId, nextBtnId, zoomBtnId, addMoreBtnId, imgArray) {
        const input = getEl(inputId); const container = input ? input.parentElement : null;
        const wrapper = getEl(wrapperId); const placeholderBox = getEl(placeholderId);
        const prevBtn = getEl(prevBtnId); const nextBtn = getEl(nextBtnId);
        const dotsContainer = getEl(dotsId); const zoomBtn = getEl(zoomBtnId);
        const addMoreBtn = getEl(addMoreBtnId); let isContain = false;
        if (!input) return;
        input.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                if(placeholderBox) placeholderBox.style.display = 'none';
                if(container) container.classList.add('has-images');
                if(zoomBtn) zoomBtn.style.display = 'block';
                if(addMoreBtn) addMoreBtn.style.display = 'block';
                let loadedCount = 0;
                files.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        imgArray.push(event.target.result); loadedCount++;
                        if (loadedCount === files.length) renderCarousel();
                    }
                    reader.readAsDataURL(file);
                });
            }
        });
        function renderCarousel() {
            if(!wrapper) return;
            const slides = wrapper.querySelectorAll('.carousel-slide'); slides.forEach(s => s.remove());
            if(dotsContainer) dotsContainer.innerHTML = '';
            if (imgArray.length > 1) { if(prevBtn) prevBtn.style.display = 'block'; if(nextBtn) nextBtn.style.display = 'block'; } 
            else { if(prevBtn) prevBtn.style.display = 'none'; if(nextBtn) nextBtn.style.display = 'none'; }
            imgArray.forEach((imgSrc, index) => {
                const slide = document.createElement('div'); slide.className = 'carousel-slide';
                const img = document.createElement('img'); img.src = imgSrc; if (isContain) img.classList.add('contain-mode');
                slide.appendChild(img); wrapper.appendChild(slide);
                if(dotsContainer) {
                    const dot = document.createElement('div'); dot.className = 'dot' + (index === 0 ? ' active' : '');
                    dot.addEventListener('click', () => wrapper.scrollTo({ left: wrapper.clientWidth * index, behavior: 'smooth' }));
                    dotsContainer.appendChild(dot);
                }
            });
        }
        if (prevBtn) prevBtn.addEventListener('click', () => wrapper.scrollBy({ left: -wrapper.clientWidth, behavior: 'smooth' }));
        if (nextBtn) nextBtn.addEventListener('click', () => wrapper.scrollBy({ left: wrapper.clientWidth, behavior: 'smooth' }));
        if (wrapper) wrapper.addEventListener('scroll', () => { const idx = Math.round(wrapper.scrollLeft / wrapper.clientWidth); const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : []; dots.forEach((d, i) => d.classList.toggle('active', i === idx)); });
        if (zoomBtn) zoomBtn.addEventListener('click', () => { isContain = !isContain; const imgs = wrapper.querySelectorAll('img'); imgs.forEach(img => isContain ? img.classList.add('contain-mode') : img.classList.remove('contain-mode')); zoomBtn.textContent = isContain ? '🖼️' : '🔍'; });
    }
    setupCarousel('beforeImageInput', 'beforeCarouselWrapper', 'beforeImagePlaceholderBox', 'beforeDotsContainer', 'beforePrevBtn', 'beforeNextBtn', 'beforeZoomBtn', 'beforeAddMoreBtn', beforeImages);
    setupCarousel('afterImageInput', 'afterCarouselWrapper', 'afterImagePlaceholderBox', 'afterDotsContainer', 'afterPrevBtn', 'afterNextBtn', 'afterZoomBtn', 'afterAddMoreBtn', afterImages);


    // ==========================================
    // ระบบบันทึกเทรด (กด Save)
    // ==========================================
    if (saveTradeFabBtn) {
        saveTradeFabBtn.addEventListener('click', () => {
            const finalAmount = parseFloat(document.getElementById('tradeFinalAmount').value);
            if(isNaN(finalAmount) || finalAmount <= 0) return alert('กรุณาระบุจำนวนเงินสุทธิให้ถูกต้อง');

            const currencyElem = document.querySelector('input[name="tradeCurrency"]:checked');
            const outcomeElem = document.querySelector('input[name="tradeOutcome"]:checked');
            const currency = currencyElem ? currencyElem.value : 'USD';
            const outcome = outcomeElem ? outcomeElem.value : 'win';
            const symbol = getEl('tradeSymbol') ? getEl('tradeSymbol').value : 'Unknown';
            
            let amountUSD = currency === 'USC' ? finalAmount / 100 : finalAmount;
            const txId = Date.now();
            const tradeId = txId + 1;

            if (isNaN(currentBalance)) currentBalance = 0;

            let percentChange = currentBalance > 0 ? (amountUSD / currentBalance) * 100 : 100;
            let percentChangeStr = outcome === 'win' ? `+${percentChange.toFixed(2)}%` : `-${percentChange.toFixed(2)}%`;

            if (outcome === 'win') { currentBalance += amountUSD; } else { currentBalance -= amountUSD; }

            const newTx = {
                id: txId,
                type: outcome === 'win' ? 'deposit' : 'withdraw', 
                isTrade: true, 
                currency: currency,
                originalAmount: finalAmount,
                amountUSD: amountUSD,
                percentChange: percentChangeStr,
                note: `รายการเทรด ${symbol}`, 
                date: new Date().toLocaleString('th-TH')
            };

            const getVal = (id) => getEl(id) ? getEl(id).value : '';
            const getRadio = (name) => document.querySelector(`input[name="${name}"]:checked`) ? document.querySelector(`input[name="${name}"]:checked`).value : '';

            const newTrade = {
                id: tradeId,
                txId: txId,
                date: getVal('tradeDate'),
                time: getVal('tradeTime'),
                symbol: symbol,
                orderType: getVal('tradeOrderType'),
                percent: percentChangeStr,
                reason: getVal('tradeReasonStep2'),
                emotionBefore: getVal('tradeEmotionStep2'),
                lot: getVal('tradeRiskLot'),
                rr: getVal('tradeRiskRR'),
                followPlan: getRadio('followPlan'),
                mistake: getVal('tradeMistake'),
                improvement: getVal('tradeImprovement'),
                emotionAfter: getVal('tradeEmotionAfter'),
                finalOutcome: outcome,
                finalAmount: finalAmount,
                finalCurrency: currency,
                beforeImages: [...beforeImages], 
                afterImages: [...afterImages]
            };

            try {
                transactions.push(newTx);
                tradeHistory.push(newTrade);
                
                localStorage.setItem('myBalance', currentBalance.toFixed(2));
                localStorage.setItem('myTransactions', JSON.stringify(transactions));
                localStorage.setItem('myTradeHistory', JSON.stringify(tradeHistory));
                
                // โชว์ Popup ความสำเร็จ 
                if(getEl('successSaveModal')) {
                    getEl('successSaveModal').style.display = 'flex';
                }

            } catch (e) {
                alert('⚠️ ไม่สามารถบันทึกได้ พื้นที่อุปกรณ์อาจเต็ม แนะนำให้จำกัดขนาดหรือจำนวนรูปภาพ');
                transactions.pop(); tradeHistory.pop();
            }
        });
    }

    // เมื่อกด "ตกลง" ใน Popup
    if (getEl('closeSuccessSaveBtn')) {
        getEl('closeSuccessSaveBtn').addEventListener('click', () => {
            if(getEl('successSaveModal')) getEl('successSaveModal').style.display = 'none';
            clearTradeForm();
            goBackFromTrade(); 
            updateBalanceUI(); 
            renderTransactions(); 
            renderCalendar();
        });
    }

    // ==========================================
    // ระบบยกเลิกและเคลียร์ฟอร์ม
    // ==========================================
    if (backFromTradeBtn) {
        backFromTradeBtn.addEventListener('click', () => {
            const symbol = getEl('tradeSymbol') ? getEl('tradeSymbol').value : '';
            if (symbol && symbol !== "XAUUSD" && cancelTradeModal) cancelTradeModal.style.display = 'flex';
            else { if(cancelTradeModal) cancelTradeModal.style.display = 'flex'; else { clearTradeForm(); goBackFromTrade(); } }
        });
    }

    if (getEl('resumeTradeBtn')) getEl('resumeTradeBtn').addEventListener('click', () => { if(cancelTradeModal) cancelTradeModal.style.display = 'none'; });
    
    if (getEl('confirmCancelTradeBtn')) {
        getEl('confirmCancelTradeBtn').addEventListener('click', () => {
            if(cancelTradeModal) cancelTradeModal.style.display = 'none';
            clearTradeForm();
            goBackFromTrade();
        });
    }

    function clearTradeForm() {
        if(getEl('tradeFormStep1')) getEl('tradeFormStep1').reset(); 
        if(getEl('tradeSymbol')) getEl('tradeSymbol').value = "XAUUSD"; 
        ['tradeReasonStep2','tradeEmotionStep2','tradeRiskLot','tradeRiskRR','tradeMistake','tradeImprovement','tradeEmotionAfter','tradeFinalAmount'].forEach(id => { if(getEl(id)) getEl(id).value = ''; });
        beforeImages = []; afterImages = [];
        const resetBox = (boxId, phId, wrapId, contId) => {
            const box = getEl(boxId); if(box) { box.style.backgroundImage = 'none'; box.style.borderStyle = 'dashed'; box.style.display = 'flex'; }
            const ph = getEl(phId); if(ph) ph.style.display = 'block';
            const wrapper = getEl(wrapId); if(wrapper) wrapper.querySelectorAll('.carousel-slide').forEach(s => s.remove());
            const cont = getEl(contId); if(cont) cont.classList.remove('has-images');
            document.querySelectorAll(`#${contId} button, #${contId} .add-more-img-btn`).forEach(b => b.style.display='none');
        };
        resetBox('beforeImagePlaceholderBox', 'beforeImagePlaceholder', 'beforeCarouselWrapper', 'beforeCarouselContainer');
        resetBox('afterImagePlaceholderBox', 'afterImagePlaceholder', 'afterCarouselWrapper', 'afterCarouselContainer');
    }

    function goBackFromTrade() {
        if (addTradePage) addTradePage.style.display = 'none';
        if (addTradeStep2Page) addTradeStep2Page.style.display = 'none';
        if (addTradeStep3Page) addTradeStep3Page.style.display = 'none';
        if (addTradeStep4Page) addTradeStep4Page.style.display = 'none';
        
        if (nextStepFabBtn) nextStepFabBtn.style.display = 'none'; 
        if (nextStep2FabBtn) nextStep2FabBtn.style.display = 'none';
        if (nextStep3FabBtn) nextStep3FabBtn.style.display = 'none';
        if (saveTradeFabBtn) saveTradeFabBtn.style.display = 'none';
        
        if (addTradeFabBtn) addTradeFabBtn.style.display = 'flex'; 
        if (pageToggleBtn) pageToggleBtn.style.display = 'block';
        if (themeToggleBtn) themeToggleBtn.style.display = 'block';
        if (toggleCurrencyBtn) toggleCurrencyBtn.style.display = 'block';

        if (previousPage === 'calendar') { 
            if(calendarPage) calendarPage.style.display = 'block'; 
        } else { 
            if(homePage) homePage.style.display = 'block'; 
        }
    }

    // ==========================================
    // ปฏิทินแบบใหม่ 
    // ==========================================
    if (pageToggleBtn) {
        pageToggleBtn.addEventListener('click', () => {
            isShowingCalendar = !isShowingCalendar;
            if (isShowingCalendar) {
                if(homePage) homePage.style.display = 'none'; 
                if(calendarPage) calendarPage.style.display = 'block';
                pageToggleBtn.innerHTML = '🏠 กลับหน้าหลัก'; pageToggleBtn.style.backgroundColor = '#28a745';
                renderCalendar();
            } else {
                if(homePage) homePage.style.display = 'block'; 
                if(calendarPage) calendarPage.style.display = 'none';
                pageToggleBtn.innerHTML = '📅 ปฏิทิน'; pageToggleBtn.style.backgroundColor = '#007bff';
            }
        });
    }

    const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const monthWrapper = getEl('monthWrapper'); const yearWrapper = getEl('yearWrapper');
    const monthText = getEl('monthText'); const yearText = getEl('yearText');
    const monthOptionsList = getEl('monthOptionsList'); const yearOptionsList = getEl('yearOptionsList');
    
    let viewingMonth = currentDate.getMonth(); let viewingYear = currentDate.getFullYear();

    if (monthOptionsList) { thaiMonths.forEach((month, index) => { let div = document.createElement('div'); div.className = 'custom-option'; div.textContent = month; div.addEventListener('click', () => { viewingMonth = index; renderCalendar(); monthWrapper.classList.remove('open'); }); monthOptionsList.appendChild(div); }); }
    const baseYear = currentDate.getFullYear();
    if (yearOptionsList) { for (let y = baseYear - 2; y <= baseYear + 2; y++) { let div = document.createElement('div'); div.className = 'custom-option'; div.textContent = y; div.addEventListener('click', () => { viewingYear = y; renderCalendar(); yearWrapper.classList.remove('open'); }); yearOptionsList.appendChild(div); } }
    if (monthWrapper) monthWrapper.querySelector('.custom-select-trigger').addEventListener('click', (e) => { e.stopPropagation(); if(yearWrapper) yearWrapper.classList.remove('open'); monthWrapper.classList.toggle('open'); });
    if (yearWrapper) yearWrapper.querySelector('.custom-select-trigger').addEventListener('click', (e) => { e.stopPropagation(); if(monthWrapper) monthWrapper.classList.remove('open'); yearWrapper.classList.toggle('open'); });
    document.addEventListener('click', () => { if (monthWrapper) monthWrapper.classList.remove('open'); if (yearWrapper) yearWrapper.classList.remove('open'); });
    
    if (getEl('prevMonthBtn')) { getEl('prevMonthBtn').addEventListener('click', () => { viewingMonth--; if (viewingMonth < 0) { viewingMonth = 11; viewingYear--; } renderCalendar(); }); }
    if (getEl('nextMonthBtn')) { getEl('nextMonthBtn').addEventListener('click', () => { viewingMonth++; if (viewingMonth > 11) { viewingMonth = 0; viewingYear++; } renderCalendar(); }); }

    function renderCalendar() {
        if (monthText) monthText.textContent = thaiMonths[viewingMonth]; if (yearText) yearText.textContent = viewingYear;
        document.querySelectorAll('#monthOptionsList .custom-option').forEach((el, i) => { el.classList.toggle('selected', i === viewingMonth); });
        document.querySelectorAll('#yearOptionsList .custom-option').forEach((el) => { el.classList.toggle('selected', parseInt(el.textContent) === viewingYear); });

        const calendarGrid = getEl('calendarGrid');
        if (!calendarGrid) return; 
        calendarGrid.innerHTML = ''; 
        const firstDay = new Date(viewingYear, viewingMonth, 1).getDay();
        const daysInMonth = new Date(viewingYear, viewingMonth + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) { let emptyDiv = document.createElement('div'); emptyDiv.className = 'calendar-day empty'; calendarGrid.appendChild(emptyDiv); }
        for (let day = 1; day <= daysInMonth; day++) {
            let dayDiv = document.createElement('div'); dayDiv.className = 'calendar-day'; 
            
            const currentCellDateStr = `${viewingYear}-${String(viewingMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTrades = tradeHistory.filter(t => t && t.date === currentCellDateStr);
            
            if (dayTrades.length > 0) {
                dayDiv.classList.add('has-trade');
                
                let netAmount = 0;
                dayTrades.forEach(t => {
                    let amt = t.finalCurrency === 'USC' ? Number(t.finalAmount) / 100 : Number(t.finalAmount);
                    if(isNaN(amt)) amt = 0;
                    if(t.finalOutcome === 'win') netAmount += amt; else netAmount -= amt;
                });

                if (netAmount >= 0) dayDiv.classList.add('trade-win');
                else dayDiv.classList.add('trade-loss');
                
                dayDiv.innerHTML = `<span>${day}</span><span class="trade-percent-label" style="font-size:9px;">${dayTrades.length} รายการ</span>`;
                dayDiv.addEventListener('click', () => openViewDayModal(currentCellDateStr, dayTrades));
            } else {
                dayDiv.textContent = day;
                dayDiv.addEventListener('click', () => openViewDayModal(currentCellDateStr, []));
            }

            if (day === currentDate.getDate() && viewingMonth === currentDate.getMonth() && viewingYear === currentDate.getFullYear()) { dayDiv.classList.add('today'); }
            calendarGrid.appendChild(dayDiv);
        }
    }

    function openViewDayModal(dateStr, tradesList) {
        selectedDateForNewTrade = dateStr;
        const [y, m, d] = dateStr.split('-');
        const displayDate = `${parseInt(d)} ${thaiMonths[parseInt(m)-1]} ${y}`;
        
        if(getEl('viewDayTitle')) getEl('viewDayTitle').textContent = `บันทึกวันที่ ${displayDate}`;
        
        const listContainer = getEl('dayTradesList');
        if(!listContainer) return;
        listContainer.innerHTML = '';

        if (tradesList.length === 0) {
            listContainer.innerHTML = `<div class="empty-state">ไม่มีข้อมูลการเทรดในวันนี้</div>`;
        } else {
            tradesList.forEach((trade) => {
                if(!trade) return;
                const resultColor = trade.finalOutcome === 'loss' ? '#dc3545' : '#28a745';
                
                // 1. ดึงรูปภาพ Before
                let beforeImgsHtml = '';
                if(trade.beforeImages && trade.beforeImages.length > 0) {
                    beforeImgsHtml = `<div style="font-size:12px; font-weight:bold; color:#007bff; margin-top:10px;">ภาพ Before</div>
                        <div class="trade-img-row" style="display:flex; gap:10px; overflow-x:auto; margin-top:5px; padding-bottom:5px;">` + 
                        trade.beforeImages.map(img => `<img src="${img}" style="width:80px; height:80px; object-fit:cover; border-radius:8px; cursor:zoom-in; border:1px solid #eee;" onclick="expandImg(this.src)">`).join('') + 
                        `</div>`;
                }
                
                // 2. ดึงรูปภาพ After
                let afterImgsHtml = '';
                if(trade.afterImages && trade.afterImages.length > 0) {
                    afterImgsHtml = `<div style="font-size:12px; font-weight:bold; color:#28a745; margin-top:10px;">ภาพ After</div>
                        <div class="trade-img-row" style="display:flex; gap:10px; overflow-x:auto; margin-top:5px; padding-bottom:5px;">` + 
                        trade.afterImages.map(img => `<img src="${img}" style="width:80px; height:80px; object-fit:cover; border-radius:8px; cursor:zoom-in; border:1px solid #eee;" onclick="expandImg(this.src)">`).join('') + 
                        `</div>`;
                }

                const card = document.createElement('div');
                card.className = 'trade-record-card';
                card.innerHTML = `
                    <div class="trade-record-header">
                        <h4 class="trade-record-title">${trade.symbol || '-'} <span style="font-size:12px; color:${resultColor};">(${trade.finalOutcome === 'win' ? '🏆' : '💔'} ${trade.percent || ''})</span></h4>
                        <button class="delete-card-btn" onclick="deleteTradeFromDay('${trade.id}', '${trade.txId}')">🗑️ ลบ</button>
                    </div>
                   <div class="detail-box">
                        <p><span class="label">เวลา:</span> <span class="value">${trade.time}</span></p>
                        <p><span class="label">คำสั่ง:</span> <span class="value" style="font-weight:bold;">${(trade.orderType||'').toUpperCase()}</span> (Lot: ${trade.lot||'-'} | RR: ${trade.rr||'-'})</p>
                        <p><span class="label">เหตุผล:</span> <span class="value">${trade.reason || '-'}</span></p>
                        <p><span class="label">ปฏิบัติตามแผน:</span> <span class="value">${trade.followPlan === 'yes' ? '✅ ใช่' : '❌ ไม่'}</span></p>
                        <p><span class="label">การแก้ไข:</span> <span class="value">${trade.improvement || '-'}</span></p>
                        ${beforeImgsHtml}
                        ${afterImgsHtml}
                    </div>
                `;
                listContainer.appendChild(card);
            });
        }
        if(getEl('viewDayModal')) getEl('viewDayModal').style.display = 'flex';
    }

    if(getEl('closeViewDayBtn')) {
        getEl('closeViewDayBtn').addEventListener('click', () => { 
            if(getEl('viewDayModal')) getEl('viewDayModal').style.display = 'none'; 
        });
    }

    if(getEl('addTradeFromDayBtn')) {
        getEl('addTradeFromDayBtn').addEventListener('click', () => {
            if(getEl('viewDayModal')) getEl('viewDayModal').style.display = 'none';
            triggerAddTrade(selectedDateForNewTrade); 
        });
    }

    // ฟังก์ชันซูมรูปภาพ
    window.expandImg = function(src) {
        if(getEl('fullScreenImage')) getEl('fullScreenImage').src = src;
        if(getEl('imageViewerModal')) {
            getEl('imageViewerModal').style.display = 'flex';
        }
    }
    
    // ฟังก์ชันปิดรูปภาพเมื่อกดปุ่ม X
    if(getEl('closeImageViewer')) {
        getEl('closeImageViewer').addEventListener('click', () => { 
            if(getEl('imageViewerModal')) getEl('imageViewerModal').style.display = 'none'; 
        });
    }

    window.deleteTradeFromDay = function(tradeIdStr, txIdStr) {
        if(confirm('ยืนยันการลบข้อมูลการเทรดรายการนี้?\n(ยอดเงินจะถูกคำนวณปรับปรุงเข้าพอร์ตอัตโนมัติ)')) {
            const tradeId = parseInt(tradeIdStr);
            const txId = parseInt(txIdStr);
            
            const tradeToDelete = tradeHistory.find(t => t && t.id === tradeId);
            if(!tradeToDelete) return;

            let amountUSD = tradeToDelete.finalCurrency === 'USC' ? Number(tradeToDelete.finalAmount) / 100 : Number(tradeToDelete.finalAmount);
            if(isNaN(amountUSD)) amountUSD = 0;
            
            if (tradeToDelete.finalOutcome === 'win') { currentBalance -= amountUSD; } else { currentBalance += amountUSD; }
            
            tradeHistory = tradeHistory.filter(t => t && t.id !== tradeId);
            transactions = transactions.filter(tx => tx && tx.id !== txId);
            
            localStorage.setItem('myBalance', currentBalance.toFixed(2));
            localStorage.setItem('myTransactions', JSON.stringify(transactions));
            localStorage.setItem('myTradeHistory', JSON.stringify(tradeHistory));
            
            updateBalanceUI(); renderTransactions(); renderCalendar();
            
            if(getEl('viewDayModal')) getEl('viewDayModal').style.display = 'none';
            const dayTrades = tradeHistory.filter(t => t && t.date === tradeToDelete.date);
            openViewDayModal(tradeToDelete.date, dayTrades);
        }
    }

    // ==========================================
    // UI ควบคุมทั่วไป (ยอดเงิน/ประวัติ)
    // ==========================================
    function applyTheme() { if (isDarkMode) { document.body.classList.add('dark-mode'); if(themeToggleBtn) themeToggleBtn.textContent = '☀️'; } else { document.body.classList.remove('dark-mode'); if(themeToggleBtn) themeToggleBtn.textContent = '🌙'; } }
    applyTheme();
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', () => { isDarkMode = !isDarkMode; localStorage.setItem('darkMode', isDarkMode); applyTheme(); });

    function updateBalanceUI() {
        if(!balanceValue || !currencySymbol) return;
        if(isNaN(currentBalance)) currentBalance = 0; 
        if (displayCurrency === 'USD') {
            currencySymbol.textContent = '$'; 
            balanceValue.textContent = currentBalance.toLocaleString('en-US', {minimumFractionDigits: 2}); 
            if(toggleCurrencyBtn) toggleCurrencyBtn.textContent = '🪙 USC';
        } else {
            currencySymbol.textContent = '¢'; 
            balanceValue.textContent = (currentBalance * 100).toLocaleString('en-US', {maximumFractionDigits: 0}); 
            if(toggleCurrencyBtn) toggleCurrencyBtn.textContent = '🇺🇸 USD';
        }
    }
    if (toggleCurrencyBtn) toggleCurrencyBtn.addEventListener('click', () => { displayCurrency = displayCurrency === 'USD' ? 'USC' : 'USD'; localStorage.setItem('displayCurrency', displayCurrency); updateBalanceUI(); });

    function renderTransactions() {
        try {
            if (!txListContainer) return;
            txListContainer.innerHTML = '';
            if (transactions.length === 0) { txListContainer.innerHTML = '<div class="empty-state">ยังไม่มีประวัติการทำรายการ</div>'; return; }
            [...transactions].reverse().forEach(tx => {
                if(!tx) return;
                const isDep = tx.type === 'deposit'; const clr = isDep ? 'deposit' : 'withdraw';
                const txCurrency = tx.currency || 'USD';
                
                let percentHtml = '';
                if (tx.percentChange) {
                    const pClass = isDep ? 'pos' : 'neg';
                    percentHtml = `<div class="history-percent ${pClass}">${tx.percentChange}</div>`;
                }

                let amtUSD = Number(tx.amountUSD !== undefined ? tx.amountUSD : (tx.amount || 0));
                let origAmt = Number(tx.originalAmount !== undefined ? tx.originalAmount : (tx.amount || 0));
                if(isNaN(amtUSD)) amtUSD = 0;
                if(isNaN(origAmt)) origAmt = 0;

                const html = txCurrency === 'USC' 
                    ? `${isDep?'+':'-'}${origAmt} USC <br><span style="font-size:11px; color:var(--text-muted);">(${isDep?'+':'-'}$${amtUSD.toFixed(2)})</span>` 
                    : `${isDep?'+':'-'}$${amtUSD.toFixed(2)}`;
                    
                let titleText = isDep ? 'รายการฝากเงิน' : 'รายการถอนเงิน';
                if (tx.isTrade) titleText = isDep ? '🏆 กำไรจากเทรด' : '💔 ขาดทุนจากเทรด';
                
                const card = document.createElement('div'); card.className = `tx-card ${clr}`;
                card.innerHTML = `<div class="tx-info"><h4>${titleText} ${percentHtml}</h4><p>📝 ${tx.note||'-'}</p><p style="font-size:10px; color:var(--text-muted); margin-top:3px;">⏰ ${tx.date}</p></div><div class="tx-right-group"><div class="tx-amount ${clr}">${html}</div><button class="delete-tx-btn">🗑️</button></div>`;
                
                card.querySelector('.delete-tx-btn').addEventListener('click', (e) => { e.stopPropagation(); itemToDelete = tx; if(getEl('deleteSingleModal')) getEl('deleteSingleModal').style.display = 'flex'; });
                txListContainer.appendChild(card);
            });
        } catch(err) {
            console.error("Tx Render Error", err);
        }
    }

    if (getEl('cancelDeleteSingleBtn')) getEl('cancelDeleteSingleBtn').addEventListener('click', () => { if(getEl('deleteSingleModal')) getEl('deleteSingleModal').style.display = 'none'; });
    if (getEl('confirmDeleteSingleBtn')) {
        getEl('confirmDeleteSingleBtn').addEventListener('click', () => {
            if (itemToDelete) {
                if(isNaN(currentBalance)) currentBalance = 0;
                let amountToReverse = Number(itemToDelete.amountUSD || itemToDelete.amount || 0);
                if(isNaN(amountToReverse)) amountToReverse = 0;
                
                currentBalance += (itemToDelete.type === 'deposit' ? -1 : 1) * amountToReverse;
                transactions = transactions.filter(t => t && t.id !== itemToDelete.id);
                
                if(itemToDelete.isTrade) { 
                    tradeHistory = tradeHistory.filter(th => th && th.txId !== itemToDelete.id); 
                    localStorage.setItem('myTradeHistory', JSON.stringify(tradeHistory)); 
                }
                localStorage.setItem('myBalance', currentBalance.toFixed(2)); localStorage.setItem('myTransactions', JSON.stringify(transactions));
                updateBalanceUI(); renderTransactions(); renderCalendar(); 
                if(getEl('deleteSingleModal')) getEl('deleteSingleModal').style.display = 'none';
            }
        });
    }

    if (getEl('deleteAllBtn')) getEl('deleteAllBtn').addEventListener('click', () => { if(transactions.length>0 && getEl('deleteAllModal')) getEl('deleteAllModal').style.display = 'flex'; });
    if (getEl('cancelDeleteAllBtn')) getEl('cancelDeleteAllBtn').addEventListener('click', () => { if(getEl('deleteAllModal')) getEl('deleteAllModal').style.display = 'none'; });
    if (getEl('confirmDeleteAllBtn')) {
        getEl('confirmDeleteAllBtn').addEventListener('click', () => { 
            transactions=[]; tradeHistory=[]; currentBalance=0; 
            localStorage.setItem('myTransactions', '[]'); localStorage.setItem('myTradeHistory', '[]'); localStorage.setItem('myBalance', '0'); 
            updateBalanceUI(); renderTransactions(); renderCalendar(); 
            if(getEl('deleteAllModal')) getEl('deleteAllModal').style.display = 'none'; 
        });
    }

    if (getEl('openModalBtn')) getEl('openModalBtn').addEventListener('click', () => { if(getEl('txModal')) getEl('txModal').style.display = 'flex'; });
    if (getEl('cancelModalBtn')) getEl('cancelModalBtn').addEventListener('click', () => { if(getEl('txModal')) getEl('txModal').style.display = 'none'; if(getEl('txAmount')) getEl('txAmount').value = ''; if(getEl('txNote')) getEl('txNote').value = '';});

    if (getEl('confirmTxBtn')) {
        getEl('confirmTxBtn').addEventListener('click', () => {
            const type = document.querySelector('input[name="txType"]:checked') ? document.querySelector('input[name="txType"]:checked').value : 'deposit'; 
            const curr = document.querySelector('input[name="txCurrency"]:checked') ? document.querySelector('input[name="txCurrency"]:checked').value : 'USD'; 
            const amtElem = getEl('txAmount');
            const amt = amtElem ? Number(amtElem.value) : 0;
            if (isNaN(amt) || amt <= 0) return alert("กรุณาระบุจำนวนเงินให้ถูกต้อง");
            
            if(isNaN(currentBalance)) currentBalance = 0;
            const amtUSD = curr === 'USC' ? amt/100 : amt;

            let percentChange = currentBalance > 0 ? (amtUSD / currentBalance) * 100 : 100;
            let percentChangeStr = type === 'deposit' ? `+${percentChange.toFixed(2)}%` : `-${percentChange.toFixed(2)}%`;

            if (type === 'deposit') currentBalance += amtUSD; else { if (currentBalance < amtUSD) return alert("ยอดเงินไม่เพียงพอสำหรับการทำรายการ"); currentBalance -= amtUSD; }
            
            const noteElem = getEl('txNote');
            transactions.push({ id: Date.now(), type: type, currency: curr, originalAmount: amt, amountUSD: amtUSD, percentChange: percentChangeStr, note: noteElem ? noteElem.value : '', date: new Date().toLocaleString('th-TH') });
            
            localStorage.setItem('myBalance', currentBalance.toFixed(2)); localStorage.setItem('myTransactions', JSON.stringify(transactions));
            updateBalanceUI(); renderTransactions(); 
            if(getEl('cancelModalBtn')) getEl('cancelModalBtn').click();
        });
    }

    // เริ่มต้นระบบ
    updateBalanceUI(); 
    renderTransactions();
    renderCalendar();
});
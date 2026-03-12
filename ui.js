// ==========================================
// ไฟล์ ui.js: รับหน้าที่จัดการหน้าจอและปุ่มกด (Frontend Manager)
// ==========================================
console.log("🎨 ui.js ทำงาน: ระบบจัดการหน้าจอพร้อมใช้งาน");

const getEl = (id) => document.getElementById(id);

// ตัวแปรที่เราต้องส่งออกไปให้ app.js ใช้งานด้วย
export let isShowingCalendar = false;
export let previousPage = 'home';
export let beforeImages = [];
export let afterImages = [];

// ==========================================
// 1. ระบบ Theme (โหมดมืด/สว่าง)
// ==========================================
let isDarkMode = localStorage.getItem('darkMode') === 'true';
const themeToggleBtn = getEl('themeToggleBtn');

export function applyTheme() { 
    if (isDarkMode) { 
        document.body.classList.add('dark-mode'); 
        if(themeToggleBtn) themeToggleBtn.textContent = '☀️'; 
    } else { 
        document.body.classList.remove('dark-mode'); 
        if(themeToggleBtn) themeToggleBtn.textContent = '🌙'; 
    } 
}
applyTheme();
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => { 
        isDarkMode = !isDarkMode; 
        localStorage.setItem('darkMode', isDarkMode); 
        applyTheme(); 
    });
}

// ==========================================
// 2. ระบบสลับหน้าปฏิทิน / หน้าหลัก
// ==========================================
const pageToggleBtn = getEl('pageToggleBtn');
if (pageToggleBtn) {
    pageToggleBtn.addEventListener('click', () => {
        isShowingCalendar = !isShowingCalendar;
        if (isShowingCalendar) {
            if(getEl('homePage')) getEl('homePage').style.display = 'none'; 
            if(getEl('calendarPage')) getEl('calendarPage').style.display = 'block';
            pageToggleBtn.innerHTML = '🏠 กลับหน้าหลัก'; 
            pageToggleBtn.style.backgroundColor = '#28a745';
        } else {
            if(getEl('homePage')) getEl('homePage').style.display = 'block'; 
            if(getEl('calendarPage')) getEl('calendarPage').style.display = 'none';
            pageToggleBtn.innerHTML = '📅 ปฏิทิน'; 
            pageToggleBtn.style.backgroundColor = '#007bff';
        }
    });
}

// ==========================================
// 3. ระบบสลับหน้าต่าง จดบันทึกเทรด (Step 1-4)
// ==========================================
export function triggerAddTrade(prefillDate = null) {
    previousPage = isShowingCalendar ? 'calendar' : 'home';
    if(getEl('homePage')) getEl('homePage').style.display = 'none'; 
    if(getEl('calendarPage')) getEl('calendarPage').style.display = 'none';
    if(getEl('addTradeFabBtn')) getEl('addTradeFabBtn').style.display = 'none'; 
    if(pageToggleBtn) pageToggleBtn.style.display = 'none'; 
    if(themeToggleBtn) themeToggleBtn.style.display = 'none'; 
    if(getEl('toggleCurrencyBtn')) getEl('toggleCurrencyBtn').style.display = 'none'; 

    const now = new Date();
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    
    if(getEl('tradeDate')) getEl('tradeDate').value = prefillDate ? prefillDate : localDate.toISOString().split('T')[0];
    if(getEl('tradeTime')) getEl('tradeTime').value = now.toTimeString().slice(0,5);

    if(getEl('addTradePage')) getEl('addTradePage').style.display = 'block'; 
    if(getEl('nextStepFabBtn')) getEl('nextStepFabBtn').style.display = 'block'; 
}

if (getEl('addTradeFabBtn')) getEl('addTradeFabBtn').addEventListener('click', () => triggerAddTrade());

// ปุ่ม ถัดไป (Next)
const nextBtn1 = getEl('nextStepFabBtn');
const nextBtn2 = getEl('nextStep2FabBtn');
const nextBtn3 = getEl('nextStep3FabBtn');
const saveBtn = getEl('saveTradeFabBtn');

if (nextBtn1) nextBtn1.addEventListener('click', () => { getEl('addTradePage').style.display = 'none'; getEl('addTradeStep2Page').style.display = 'block'; nextBtn1.style.display = 'none'; if(nextBtn2) nextBtn2.style.display = 'block'; });
if (nextBtn2) nextBtn2.addEventListener('click', () => { getEl('addTradeStep2Page').style.display = 'none'; getEl('addTradeStep3Page').style.display = 'block'; nextBtn2.style.display = 'none'; if(nextBtn3) nextBtn3.style.display = 'block'; });
if (nextBtn3) nextBtn3.addEventListener('click', () => { getEl('addTradeStep3Page').style.display = 'none'; getEl('addTradeStep4Page').style.display = 'block'; nextBtn3.style.display = 'none'; if(saveBtn) saveBtn.style.display = 'block'; });

// ปุ่ม ย้อนกลับ (Back)
if (getEl('backToStep1Btn')) getEl('backToStep1Btn').addEventListener('click', () => { getEl('addTradeStep2Page').style.display = 'none'; getEl('addTradePage').style.display = 'block'; if(nextBtn2) nextBtn2.style.display = 'none'; if(nextBtn1) nextBtn1.style.display = 'block'; });
if (getEl('backToStep2Btn')) getEl('backToStep2Btn').addEventListener('click', () => { getEl('addTradeStep3Page').style.display = 'none'; getEl('addTradeStep2Page').style.display = 'block'; if(nextBtn3) nextBtn3.style.display = 'none'; if(nextBtn2) nextBtn2.style.display = 'block'; });
if (getEl('backToStep3Btn')) getEl('backToStep3Btn').addEventListener('click', () => { getEl('addTradeStep4Page').style.display = 'none'; getEl('addTradeStep3Page').style.display = 'block'; if(saveBtn) saveBtn.style.display = 'none'; if(nextBtn3) nextBtn3.style.display = 'block'; });

// ==========================================
// 4. ระบบยกเลิกและเคลียร์ฟอร์ม
// ==========================================
export function clearTradeForm() {
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

export function goBackFromTrade() {
    ['addTradePage','addTradeStep2Page','addTradeStep3Page','addTradeStep4Page'].forEach(id => { if(getEl(id)) getEl(id).style.display = 'none'; });
    [nextBtn1, nextBtn2, nextBtn3, saveBtn].forEach(btn => { if(btn) btn.style.display = 'none'; });
    
    if (getEl('addTradeFabBtn')) getEl('addTradeFabBtn').style.display = 'flex'; 
    if (pageToggleBtn) pageToggleBtn.style.display = 'block';
    if (themeToggleBtn) themeToggleBtn.style.display = 'block';
    if (getEl('toggleCurrencyBtn')) getEl('toggleCurrencyBtn').style.display = 'block';

    if (previousPage === 'calendar') { if(getEl('calendarPage')) getEl('calendarPage').style.display = 'block'; } 
    else { if(getEl('homePage')) getEl('homePage').style.display = 'block'; }
}

if (getEl('backFromTradeBtn')) {
    getEl('backFromTradeBtn').addEventListener('click', () => {
        const symbol = getEl('tradeSymbol') ? getEl('tradeSymbol').value : '';
        if (symbol && symbol !== "XAUUSD" && getEl('cancelTradeModal')) getEl('cancelTradeModal').style.display = 'flex';
        else { if(getEl('cancelTradeModal')) getEl('cancelTradeModal').style.display = 'flex'; else { clearTradeForm(); goBackFromTrade(); } }
    });
}
if (getEl('resumeTradeBtn')) getEl('resumeTradeBtn').addEventListener('click', () => { if(getEl('cancelTradeModal')) getEl('cancelTradeModal').style.display = 'none'; });
if (getEl('confirmCancelTradeBtn')) {
    getEl('confirmCancelTradeBtn').addEventListener('click', () => {
        if(getEl('cancelTradeModal')) getEl('cancelTradeModal').style.display = 'none';
        clearTradeForm();
        goBackFromTrade();
    });
}

// ==========================================
// 5. ระบบพรีวิวรูปภาพ (Carousel)
// ==========================================
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
                    imgArray.push(event.target.result); 
                    loadedCount++;
                    if (loadedCount === files.length) renderCarousel();
                }
                reader.readAsDataURL(file); 
            });
            input.value = ''; // เคลียร์ค่า input ให้สามารถเลือกรูปเดิมซ้ำได้
        }
    });

    function renderCarousel() {
        if(!wrapper) return;
        wrapper.querySelectorAll('.carousel-slide').forEach(s => s.remove());
        if(dotsContainer) dotsContainer.innerHTML = '';
        
        // 🚨 ถ้าลบรูปจนหมดเกลี้ยง ให้กลับไปแสดงหน้าอัปโหลดปกติ
        if (imgArray.length === 0) {
            if(placeholderBox) placeholderBox.style.display = 'block';
            if(container) container.classList.remove('has-images');
            if(zoomBtn) zoomBtn.style.display = 'none';
            if(addMoreBtn) addMoreBtn.style.display = 'none';
            if(prevBtn) prevBtn.style.display = 'none'; 
            if(nextBtn) nextBtn.style.display = 'none';
            return; // หยุดการทำงาน
        }

        if (imgArray.length > 1) { if(prevBtn) prevBtn.style.display = 'block'; if(nextBtn) nextBtn.style.display = 'block'; } 
        else { if(prevBtn) prevBtn.style.display = 'none'; if(nextBtn) nextBtn.style.display = 'none'; }
        
        imgArray.forEach((imgSrc, index) => {
            const slide = document.createElement('div'); 
            slide.className = 'carousel-slide';
            slide.style.position = 'relative'; // ให้ปุ่ม X อิงตำแหน่งตามรูปนี้

            const img = document.createElement('img'); 
            img.src = imgSrc; 
            if (isContain) img.classList.add('contain-mode');

            // 🎯 สร้างปุ่มลบ (X)
            const delBtn = document.createElement('button');
            delBtn.innerHTML = '✕';
            delBtn.className = 'delete-slide-btn';
            delBtn.type = 'button';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // กันไม่ให้ไปโดน event อื่น
                imgArray.splice(index, 1); // ลบรูปนี้ออกจากความจำ
                renderCarousel(); // วาดรูปที่เหลือใหม่
            });

            slide.appendChild(img); 
            slide.appendChild(delBtn); // แปะปุ่มลบลงไปในสไลด์
            wrapper.appendChild(slide);
            
            if(dotsContainer) {
                const dot = document.createElement('div'); 
                dot.className = 'dot' + (index === 0 ? ' active' : '');
                dot.addEventListener('click', () => wrapper.scrollTo({ left: wrapper.clientWidth * index, behavior: 'smooth' }));
                dotsContainer.appendChild(dot);
            }
        });
    }
    
    if (prevBtn) prevBtn.addEventListener('click', () => wrapper.scrollBy({ left: -wrapper.clientWidth, behavior: 'smooth' }));
    if (nextBtn) nextBtn.addEventListener('click', () => wrapper.scrollBy({ left: wrapper.clientWidth, behavior: 'smooth' }));
    if (wrapper) wrapper.addEventListener('scroll', () => { 
        const idx = Math.round(wrapper.scrollLeft / wrapper.clientWidth); 
        const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : []; 
        dots.forEach((d, i) => d.classList.toggle('active', i === idx)); 
    });
    if (zoomBtn) zoomBtn.addEventListener('click', () => { 
        isContain = !isContain; 
        wrapper.querySelectorAll('img').forEach(img => isContain ? img.classList.add('contain-mode') : img.classList.remove('contain-mode')); 
        zoomBtn.textContent = isContain ? '🖼️' : '🔍'; 
    });
}

setupCarousel('beforeImageInput', 'beforeCarouselWrapper', 'beforeImagePlaceholderBox', 'beforeDotsContainer', 'beforePrevBtn', 'beforeNextBtn', 'beforeZoomBtn', 'beforeAddMoreBtn', beforeImages);
setupCarousel('afterImageInput', 'afterCarouselWrapper', 'afterImagePlaceholderBox', 'afterDotsContainer', 'afterPrevBtn', 'afterNextBtn', 'afterZoomBtn', 'afterAddMoreBtn', afterImages);

// เปิด/ปิดรูปเต็มจอ
window.expandImg = function(src) {
    if(getEl('fullScreenImage')) getEl('fullScreenImage').src = src;
    if(getEl('imageViewerModal')) getEl('imageViewerModal').style.display = 'flex';
}
if(getEl('closeImageViewer')) {
    getEl('closeImageViewer').addEventListener('click', () => { if(getEl('imageViewerModal')) getEl('imageViewerModal').style.display = 'none'; });
}
// ==========================================
// 6. ระบบเปิด/ปิด หน้าต่างจัดการเงินทุน (Deposit/Withdraw)
// ==========================================
const openModalBtn = getEl('openModalBtn');
const cancelModalBtn = getEl('cancelModalBtn');
const txModal = getEl('txModal');

// กดปุ่มเพื่อเปิดหน้าต่าง
if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
        if (txModal) txModal.style.display = 'flex';
    });
}

// กดปุ่มยกเลิกเพื่อปิดหน้าต่าง และล้างค่าในช่องกรอก
if (cancelModalBtn) {
    cancelModalBtn.addEventListener('click', () => {
        if (txModal) txModal.style.display = 'none';
        if (getEl('txAmount')) getEl('txAmount').value = '';
        if (getEl('txNote')) getEl('txNote').value = '';
    });
}
// ==========================================
// 7. ระบบปิดหน้าต่างแจ้งเตือน (Success Modal)
// ==========================================
const successModal = document.getElementById('successSaveModal');
if (successModal) {
    // ค้นหาปุ่มที่อยู่ข้างในหน้าต่างสำเร็จ (ปุ่มตกลง)
    const okBtn = successModal.querySelector('button');
    if (okBtn) {
        okBtn.addEventListener('click', () => {
            successModal.style.display = 'none';
        });
    }
}
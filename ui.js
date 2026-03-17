// ==========================================
// ไฟล์ ui.js: รับหน้าที่จัดการหน้าจอและปุ่มกด (Frontend Manager)
// ==========================================
console.log("🎨 ui.js ทำงาน: ระบบจัดการหน้าจอพร้อมใช้งาน");

const getEl = (id) => document.getElementById(id);

// ==========================================
// ฟังก์ชันโชว์ป๊อปอัปแจ้งเตือน (แทนที่ alert ธรรมดา)
// ==========================================
export function showCustomAlert(message) {
    const errorModal = getEl('customErrorModal');
    const errorText = getEl('errorMessageText');
    if (errorModal && errorText) {
        errorText.innerText = message;
        errorModal.style.display = 'flex';
    } else {
        // กรณีฉุกเฉินถ้าหาป๊อปอัปไม่เจอ
        alert(message);
    }
}

// ผูกปุ่ม "รับทราบ" ให้ปิดป๊อปอัปได้
document.addEventListener('click', function(e) {
    if (e.target.id === 'closeErrorBtn' || e.target.closest('#closeErrorBtn')) {
        const errorModal = getEl('customErrorModal');
        if (errorModal) errorModal.style.display = 'none';
    }
});

// ตัวแปรที่เราต้องส่งออกไปให้ app.js ใช้งานด้วย
export let isShowingCalendar = false;
export let previousPage = 'home';
export let beforeImages = [];
export let afterImages = [];

// ==========================================
// 1. ระบบสลับหน้าปฏิทิน / หน้าหลัก
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
// 2. ระบบสลับหน้าต่าง จดบันทึกเทรด (Step 1-4)
// ==========================================
export function triggerAddTrade(prefillDate = null) {
    previousPage = isShowingCalendar ? 'calendar' : 'home';
    if(getEl('homePage')) getEl('homePage').style.display = 'none'; 
    if(getEl('calendarPage')) getEl('calendarPage').style.display = 'none';
    if(getEl('addTradeFabBtn')) getEl('addTradeFabBtn').style.display = 'none'; 
    if(pageToggleBtn) pageToggleBtn.style.display = 'none'; 
    
    // ซ่อนปุ่มต่างๆ บน Navbar ตอนเข้าหน้าบันทึกเทรด
    if(getEl('colorPaletteBtn')) getEl('colorPaletteBtn').style.display = 'none'; 
    if(getEl('toggleCurrencyBtn')) getEl('toggleCurrencyBtn').style.display = 'none'; 

    const now = new Date();
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    
    if(getEl('tradeDate')) getEl('tradeDate').value = prefillDate ? prefillDate : localDate.toISOString().split('T')[0];
    if(getEl('tradeTime')) getEl('tradeTime').value = now.toTimeString().slice(0,5);

    if(getEl('addTradePage')) getEl('addTradePage').style.display = 'block'; 
    if(getEl('nextStepFabBtn')) getEl('nextStepFabBtn').style.display = 'block'; 
}

if (getEl('addTradeFabBtn')) getEl('addTradeFabBtn').addEventListener('click', () => triggerAddTrade());

// ==========================================
// ปุ่ม ถัดไป (Next) พร้อมระบบดักจับข้อมูล (Validation)
// ==========================================
const nextBtn1 = getEl('nextStepFabBtn');
const nextBtn2 = getEl('nextStep2FabBtn');
const nextBtn3 = getEl('nextStep3FabBtn');

// 🛡️ ด่านที่ 1: ตรวจสอบหน้าแรก (Step 1)
if (nextBtn1) {
    nextBtn1.addEventListener('click', () => {
        const date = getEl('tradeDate') ? getEl('tradeDate').value : '';
        const time = getEl('tradeTime') ? getEl('tradeTime').value : '';
        const symbol = getEl('tradeSymbol') ? getEl('tradeSymbol').value : '';
        
        // ถ้าช่องไหนว่าง ให้โชว์ป๊อปอัปสวยๆ และหยุดการทำงาน
        if (!date || !time || !symbol.trim()) {
            return showCustomAlert('กรุณากรอก วันที่, เวลา และ สินทรัพย์(Symbol) \nให้ครบถ้วนก่อนไปหน้าถัดไปครับ');
        }

        getEl('addTradePage').style.display = 'none'; 
        getEl('addTradeStep2Page').style.display = 'block'; 
        nextBtn1.style.display = 'none'; 
        if(nextBtn2) nextBtn2.style.display = 'block'; 
    });
}

// 🛡️ ด่านที่ 2: ตรวจสอบหน้าข้อมูลก่อนเทรด (Step 2)
if (nextBtn2) {
    nextBtn2.addEventListener('click', () => {
        const reason = getEl('tradeReasonStep2') ? getEl('tradeReasonStep2').value : '';
        const lot = getEl('tradeRiskLot') ? getEl('tradeRiskLot').value : '';
        const rr = getEl('tradeRiskRR') ? getEl('tradeRiskRR').value : '';
        
        // เช็คข้อความและตัวเลข
        if (!reason.trim() || !lot || !rr) {
            return showCustomAlert('กรุณากรอก "เหตุผลการเข้าเทรด", "ขนาด Lot" และ "สัดส่วน RR" ให้ครบถ้วนครับ');
        }

        // เช็คว่าลืมอัปโหลดรูปกราฟไหม (ใช้ confirm ธรรมดาเพื่อความรวดเร็วในการตัดสินใจ)
        if (typeof beforeImages !== 'undefined' && beforeImages.length === 0) {
            if(!confirm('⚠️ คุณยังไม่ได้อัปโหลดรูปภาพกราฟ (Before) ต้องการข้ามไปหน้าถัดไปหรือไม่?')) {
                return; // ถ้ากด Cancel จะไม่เปลี่ยนหน้า
            }
        }

        getEl('addTradeStep2Page').style.display = 'none'; 
        getEl('addTradeStep3Page').style.display = 'block'; 
        nextBtn2.style.display = 'none'; 
        if(nextBtn3) nextBtn3.style.display = 'block'; 
    });
}

// 🛡️ ด่านที่ 3: ตรวจสอบหน้าข้อมูลหลังปิดออเดอร์ (Step 3)
if (nextBtn3) {
    nextBtn3.addEventListener('click', () => {
        const lesson = getEl('tradeLessonStep3') ? getEl('tradeLessonStep3').value : '';
        
        // เช็คข้อความสรุปผล
        if (!lesson.trim()) {
            return showCustomAlert('กรุณากรอก "ผลการเทรดและสิ่งที่ได้เรียนรู้" \nเพื่อเป็นบทเรียนให้ครบถ้วนครับ');
        }

        getEl('addTradeStep3Page').style.display = 'none'; 
        getEl('addTradeStep4Page').style.display = 'block'; 
        nextBtn3.style.display = 'none'; 
    });
}

// ปุ่ม ย้อนกลับ (Back)
if (getEl('backToStep1Btn')) getEl('backToStep1Btn').addEventListener('click', () => { getEl('addTradeStep2Page').style.display = 'none'; getEl('addTradePage').style.display = 'block'; if(nextBtn2) nextBtn2.style.display = 'none'; if(nextBtn1) nextBtn1.style.display = 'block'; });
if (getEl('backToStep2Btn')) getEl('backToStep2Btn').addEventListener('click', () => { getEl('addTradeStep3Page').style.display = 'none'; getEl('addTradeStep2Page').style.display = 'block'; if(nextBtn3) nextBtn3.style.display = 'none'; if(nextBtn2) nextBtn2.style.display = 'block'; });
if (getEl('backToStep3Btn')) getEl('backToStep3Btn').addEventListener('click', () => { getEl('addTradeStep4Page').style.display = 'none'; getEl('addTradeStep3Page').style.display = 'block'; if(saveBtn) saveBtn.style.display = 'none'; if(nextBtn3) nextBtn3.style.display = 'block'; });

// ==========================================
// 3. ระบบยกเลิกและเคลียร์ฟอร์ม
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
    if (getEl('colorPaletteBtn')) getEl('colorPaletteBtn').style.display = 'flex';
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
// 4. ระบบพรีวิวรูปภาพ (กรอบเปลี่ยนขนาดได้ + ซูม/ลากรูป)
// ==========================================
function setupCarousel(inputId, wrapperId, placeholderId, dotsId, prevBtnId, nextBtnId, zoomBtnId, addMoreBtnId, imgArray) {
    const input = document.getElementById(inputId); 
    // ดึงกล่อง Container หลักออกมา
    const container = input ? input.closest('.carousel-container') : null;
    const wrapper = document.getElementById(wrapperId); 
    const placeholderBox = document.getElementById(placeholderId);
    const prevBtn = document.getElementById(prevBtnId); 
    const nextBtn = document.getElementById(nextBtnId);
    const dotsContainer = document.getElementById(dotsId); 
    const addMoreBtn = document.getElementById(addMoreBtnId);
    
    if (!input || !container) return;

    // 🌟 สร้างปุ่มเปลี่ยนสัดส่วน ใส่ไว้ในกรอบตั้งแต่ยังไม่โหลดรูป 🌟
    let ratioSelector = container.querySelector('.aspect-ratio-selector');
    if (!ratioSelector) {
        ratioSelector = document.createElement('select');
        ratioSelector.className = 'aspect-ratio-selector';
        ratioSelector.innerHTML = `
            <option value="16/9">สัดส่วน 16:9 (กว้าง)</option>
            <option value="21/9">สัดส่วน 21:9 (กว้างพิเศษ)</option>
            <option value="1/1">สัดส่วน 1:1 (จตุรัส)</option>
            <option value="4/3">สัดส่วน 4:3 (มาตรฐาน)</option>
            <option value="9/16">สัดส่วน 9:16 (แนวตั้ง)</option>
        `;
        
        ratioSelector.addEventListener('mousedown', e => e.stopPropagation());
        ratioSelector.addEventListener('wheel', e => e.stopPropagation());

        // เมื่อกดเปลี่ยนสัดส่วน ให้ยืด/หดกรอบ Container หลัก
        ratioSelector.addEventListener('change', (e) => {
            container.style.aspectRatio = e.target.value;
        });
        
        container.appendChild(ratioSelector); 
    }

    input.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            if(placeholderBox) placeholderBox.style.display = 'none';
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
            input.value = ''; 
        }
    });

    function renderCarousel() {
        if(!wrapper) return;
        wrapper.querySelectorAll('.carousel-slide').forEach(s => s.remove());
        if(dotsContainer) dotsContainer.innerHTML = '';
        
        // 🚨 กรณีรูปถูกลบหมดเกลี้ยง
        if (imgArray.length === 0) {
            if(placeholderBox) placeholderBox.style.display = 'flex'; // กลับมาโชว์กรอบเส้นประ
            if(addMoreBtn) addMoreBtn.style.display = 'none';
            if(prevBtn) prevBtn.style.display = 'none'; 
            if(nextBtn) nextBtn.style.display = 'none';
            return; 
        }

        if (imgArray.length > 1) { if(prevBtn) prevBtn.style.display = 'block'; if(nextBtn) nextBtn.style.display = 'block'; } 
        else { if(prevBtn) prevBtn.style.display = 'none'; if(nextBtn) nextBtn.style.display = 'none'; }
        
        imgArray.forEach((imgSrc, index) => {
            const slide = document.createElement('div'); 
            slide.className = 'carousel-slide';
            slide.style.overflow = 'hidden'; 
            slide.style.position = 'relative'; 
            slide.style.flex = '0 0 100%'; // ให้สไลด์เต็มกรอบพอดี
            slide.style.height = '100%';
            slide.style.display = 'flex';
            slide.style.justifyContent = 'center';
            slide.style.alignItems = 'center';
            slide.style.backgroundColor = 'rgba(0,0,0,0.5)';

            const img = document.createElement('img'); 
            img.src = imgSrc; 
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover'; // บังคับรูปเต็มกรอบแบบไร้ขอบดำ
            img.style.cursor = 'grab';
            img.style.transition = 'transform 0.1s ease-out'; 

            // ==============================================
            // 🌟 ระบบสมองกล เลื่อน (Pan) & ขยาย (Zoom) 🌟
            // ==============================================
            let scale = 1;
            let isDragging = false;
            let startX, startY;
            let translateX = 0, translateY = 0;

            img.addEventListener('wheel', (e) => {
                e.preventDefault(); 
                scale += e.deltaY * -0.005;
                scale = Math.min(Math.max(1, scale), 5); 
                img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            });

            img.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
                img.style.cursor = 'grabbing';
                img.style.transition = 'none'; 
            });

            img.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                e.preventDefault();
                translateX = e.clientX - startX;
                translateY = e.clientY - startY;
                img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            });

            img.addEventListener('mouseup', () => {
                isDragging = false;
                img.style.cursor = 'grab';
                img.style.transition = 'transform 0.1s ease-out'; 
            });

            img.addEventListener('mouseleave', () => {
                isDragging = false;
                img.style.cursor = 'grab';
                img.style.transition = 'transform 0.1s ease-out';
            });

            // --- ปุ่มลบรูปภาพ (ย้ายไปอยู่มุมขวาบน) ---
            const delBtn = document.createElement('button');
            delBtn.innerHTML = '✕';
            delBtn.className = 'delete-slide-btn';
            delBtn.type = 'button';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                imgArray.splice(index, 1); 
                renderCarousel(); 
            });

            slide.appendChild(img); 
            slide.appendChild(delBtn); 
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
}

// ใช้งานฟังก์ชันที่อัปเกรดแล้วกับทั้งช่อง Before และ After
setupCarousel('beforeImageInput', 'beforeCarouselWrapper', 'beforeImagePlaceholderBox', 'beforeDotsContainer', 'beforePrevBtn', 'beforeNextBtn', 'beforeZoomBtn', 'beforeAddMoreBtn', beforeImages);
setupCarousel('afterImageInput', 'afterCarouselWrapper', 'afterImagePlaceholderBox', 'afterDotsContainer', 'afterPrevBtn', 'afterNextBtn', 'afterZoomBtn', 'afterAddMoreBtn', afterImages);

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
// 5. ระบบเปิด/ปิด หน้าต่างจัดการเงินทุน (Deposit/Withdraw)
// ==========================================
const openModalBtn = getEl('openModalBtn');
const cancelModalBtn = getEl('cancelModalBtn');
const txModal = getEl('txModal');

if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
        if (txModal) txModal.style.display = 'flex';
    });
}

if (cancelModalBtn) {
    cancelModalBtn.addEventListener('click', () => {
        if (txModal) txModal.style.display = 'none';
        if (getEl('txAmount')) getEl('txAmount').value = '';
        if (getEl('txNote')) getEl('txNote').value = '';
    });
}

// ==========================================
// 6. ระบบปิดหน้าต่างแจ้งเตือน (Success Modal)
// ==========================================
const successModal = document.getElementById('successSaveModal');
if (successModal) {
    const okBtn = successModal.querySelector('button');
    if (okBtn) {
        okBtn.addEventListener('click', () => {
            successModal.style.display = 'none';
        });
    }
}

// ==========================================
// 7. ระบบเปลี่ยนธีมสี (Free-form Color Picker สุดล้ำด้วย Pickr)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const themePickerElement = document.getElementById('themePickerBtn');
    if (!themePickerElement) return;

    // ดึงสีเดิมที่เคยเซฟไว้ (ถ้าไม่มีให้ใช้สีแดง)
    const defaultColor = localStorage.getItem('userTheme') || '#ff003c';

    // สร้างหน้าต่างเลือกสี
    const pickr = Pickr.create({
        el: '#themePickerBtn',
        theme: 'nano', // ใช้ธีมแบบคลีนๆ โมเดิร์น
        default: defaultColor,
        swatches: [
            '#ff003c', '#007bff', '#00e676', '#ffb300', '#b100ff', '#00f7ff' // สีฮิตแถมไว้ให้กดง่ายๆ
        ],
        components: {
            preview: true,
            opacity: false,
            hue: true,
            interaction: {
                hex: true,
                input: true,
                clear: false,
                save: true // มีปุ่มให้กด Save
            }
        }
    });

    // ฟังก์ชันแปลง HEX เป็น RGB
    function hexToRgb(hex) {
        // จัดการกรณีค่าสีมาไม่ครบหรือผิดพลาด
        if (!hex || hex.length < 7) return { r: 255, g: 0, b: 60 }; 
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    // ฟังก์ชันอัปเดตสีใน CSS พร้อมคำนวณความสว่าง
    function updateThemeColors(hexColor) {
        const rgb = hexToRgb(hexColor);
        document.documentElement.style.setProperty('--theme-r', rgb.r);
        document.documentElement.style.setProperty('--theme-g', rgb.g);
        document.documentElement.style.setProperty('--theme-b', rgb.b);

        // 👇 สูตรคำนวณความสว่างของสี (Brightness Formula) 👇
        const brightness = Math.round(((parseInt(rgb.r) * 299) + (parseInt(rgb.g) * 587) + (parseInt(rgb.b) * 114)) / 1000);
        
        // ถ้าค่าความสว่างมากกว่า 128 (สีโทนสว่าง) ให้ใช้ตัวหนังสือสีดำเข้ม ถ้าไม่ใช่ให้ใช้สีขาว
        const textColor = (brightness > 128) ? '#1a1a1a' : '#ffffff';
        
        // ส่งค่าสีตัวหนังสือไปให้ CSS นำไปใช้กับปุ่ม
        document.documentElement.style.setProperty('--btn-text-color', textColor);
    }

    // ตอนเปิดเว็บมาครั้งแรก ให้รันสี 1 รอบ
    updateThemeColors(defaultColor);

    // เวลาผู้ใช้ลากจุดเลือกสี (สีจะเปลี่ยนแบบ Real-time)
    pickr.on('change', (color) => {
        // ใช้ toHEXA().toString() ให้มั่นใจว่าได้รหัส HEX เสมอ
        const hexColor = color.toHEXA().toString();
        updateThemeColors(hexColor);
    });

    // เวลากดปุ่ม Save ในหน้าต่าง
    pickr.on('save', (color) => {
        const hexColor = color.toHEXA().toString();
        localStorage.setItem('userTheme', hexColor);
        pickr.hide(); // ปิดหน้าต่าง
    });
});

// ==========================================
// ระบบ Auto-resize Textarea (กล่องข้อความยืดตามเนื้อหาอัตโนมัติ)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const textareas = document.querySelectorAll('.pill-textarea');
    
    function autoResize() {
        this.style.height = 'auto'; // รีเซ็ตความสูงก่อน
        this.style.height = (this.scrollHeight) + 'px'; // ตั้งค่าความสูงใหม่ตามเนื้อหาข้างใน
    }

    textareas.forEach(textarea => {
        // ให้ยืดทันทีที่มีการพิมพ์หรือลบข้อความ
        textarea.addEventListener('input', autoResize, false);
        
        // ให้คำนวณความสูงเผื่อไว้เลยตอนโหลดหน้าเว็บ
        setTimeout(() => autoResize.call(textarea), 0);
    });
});


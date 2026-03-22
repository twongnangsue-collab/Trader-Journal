/**
 * สลับภาษาไทย / อังกฤษ — เก็บใน localStorage key: appLang
 */
const STORAGE_KEY = "appLang";

export const MONTHS_TH = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export const MONTHS_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const DICT = {
    th: {
        "nav.logoTitle": "กลับหน้าหลัก",
        "nav.home": "หน้าหลัก",
        "nav.overview": "ภาพรวม",
        "nav.calendar": "ปฏิทิน",
        "nav.fund": "จัดการเงินทุน",
        "nav.newTrade": "+ บันทึกเทรด",
        "nav.profile": "โปรไฟล์",
        "nav.profileTitle": "ตั้งค่าโปรไฟล์",
        "lang.switchToEn": "EN",
        "lang.switchToTh": "ไทย",
        "lang.title": "สลับภาษา",

        "hero.subtitle": "สมุดบันทึกการเทรด",
        "hero.balance": "ยอดคงเหลือ",
        "hero.changeCurrency": "เปลี่ยนสกุลเงิน",
        "hero.toUSC": "เปลี่ยนเป็น USC",
        "hero.toUSD": "เปลี่ยนเป็น USD",

        "history.title": "ประวัติการเทรด",
        "history.clearAll": "ล้างข้อมูลทั้งหมด",

        "cal.title": "ปฏิทินการเทรด",
        "cal.sun": "อา", "cal.mon": "จ", "cal.tue": "อ", "cal.wed": "พ",
        "cal.thu": "พฤ", "cal.fri": "ศ", "cal.sat": "ส",

        "overview.title": "สรุปสถิติ",
        "overview.subtitle": "ภาพรวมผลการเทรดและเส้นโค้งพอร์ตตามช่วงเวลาที่เลือก",
        "overview.toCalendar": "ดูในปฏิทิน →",
        "overview.period": "ช่วงเวลา",
        "overview.month": "เดือนนี้",
        "overview.quarter": "3 เดือนล่าสุด",
        "overview.year": "ปีนี้",
        "overview.kpiNet": "กำไร/ขาดทุนสุทธิ (เทรด)",
        "overview.kpiNetHint": "จากออเดอร์ในช่วงที่เลือก",
        "overview.kpiWR": "อัตราชนะ",
        "overview.kpiCount": "จำนวนออเดอร์",
        "overview.kpiCountHint": "เฉพาะเทรดที่มีผลลัพธ์",
        "overview.kpiAvg": "เฉลี่ยต่อออเดอร์",
        "overview.kpiAvgHint": "กำไร/ขาดทุน ÷ จำนวน",
        "overview.chartCap": "อิงจากการฝาก/ถอนและผลเทรดในบันทึก",
        "overview.winLoss": "สัดส่วนชนะ / แพ้",
        "overview.orderTypes": "ประเภทออเดอร์",
        "overview.emptyOutcome": "ไม่มีข้อมูลเทรดในช่วงนี้",
        "overview.emptyOrders": "ไม่มีข้อมูลในช่วงนี้",
        "overview.bestDay": "วันที่ดีที่สุด",
        "overview.worstDay": "วันที่แย่ที่สุด",
        "overview.win": "ชนะ",
        "overview.loss": "แพ้",
        "overview.chartMonth": "เส้นโค้งยอดพอร์ต (เดือนนี้)",
        "overview.chartQuarter": "เส้นโค้งยอดพอร์ต (3 เดือนล่าสุด)",
        "overview.chartYear": "เส้นโค้งยอดพอร์ต (ปีนี้)",
        "overview.balanceLabel": "ยอดเงิน",
        "overview.kpiWLFmt": "ชนะ {w} / แพ้ {l}",
        "cal.orderCountFmt": "{n} ออเดอร์",

        "trade.back": "กลับ",
        "trade.step1Title": "ตั้งค่าออเดอร์ใหม่",
        "trade.step2Title": "ก่อนเข้าเทรด",
        "trade.step3Title": "หลังปิดออเดอร์",
        "trade.step4Title": "สรุปกำไร / ขาดทุน",
        "trade.entryDate": "วันที่เข้า",
        "trade.entryTime": "เวลาเข้า",
        "trade.symbol": "สินทรัพย์ (Symbol)",
        "trade.orderType": "ประเภทออเดอร์",
        "trade.next": "ถัดไป",
        "trade.upload": "คลิกอัปโหลดรูป",
        "trade.expand": "ขยาย",
        "trade.addMore": "+ เพิ่มรูป",
        "trade.setup": "แผนเทรด & Confluence",
        "trade.emotionPre": "อารมณ์ก่อนเทรด",
        "trade.riskTitle": "บริหารความเสี่ยง",
        "trade.lot": "ขนาด Lot",
        "trade.rr": "Reward : Risk (1:X)",
        "trade.resultLesson": "ผลเทรด & บทเรียน",
        "trade.emotionPost": "อารมณ์หลังเทรด",
        "trade.currency": "สกุลเงิน",
        "trade.outcome": "ผลลัพธ์",
        "trade.profit": "กำไร",
        "trade.lossLbl": "ขาดทุน",
        "trade.netAmount": "จำนวนเงินสุทธิ",
        "trade.confirmSave": "ยืนยันบันทึกเทรด",
        "trade.confirmSaveBtn": "💾 ยืนยันการบันทึกข้อมูล",
        "trade.uploading": "⏳ กำลังอัปโหลด...",

        "fund.title": "จัดการเงินทุน",
        "fund.date": "วันที่ทำรายการ",
        "fund.type": "ประเภท",
        "fund.deposit": "ฝาก",
        "fund.withdraw": "ถอน",
        "fund.currency": "สกุลเงิน",
        "fund.amount": "จำนวนเงิน",
        "fund.note": "หมายเหตุ",
        "fund.notePh": "เหตุผล...",
        "fund.cancel": "ยกเลิก",
        "fund.confirm": "ยืนยัน",

        "profile.title": "ตั้งค่าโปรไฟล์",
        "profile.name": "ชื่อ",
        "profile.role": "บทบาท / ตำแหน่ง",
        "profile.bio": "แนะนำตัว",
        "profile.cancel": "ยกเลิก",
        "profile.save": "บันทึกโปรไฟล์",

        "modal.deleteAllTitle": "คำเตือน",
        "modal.deleteAllText": "ต้องการล้างข้อมูลทั้งหมดหรือไม่?",
        "modal.deleteAllCancel": "ยกเลิก",
        "modal.deleteAllOk": "ยืนยันล้าง",

        "modal.cancelTradeTitle": "ยกเลิกการกรอก",
        "modal.cancelTradeText": "ข้อมูลที่กรอกจะไม่ถูกบันทึก",
        "modal.resume": "กลับไปกรอกต่อ",
        "modal.cancelTradeOk": "ยกเลิกการบันทึก",

        "success.tradeTitle": "สำเร็จ!",
        "success.tradeText": "บันทึกเทรดเรียบร้อยแล้ว",
        "success.ok": "ตกลง",

        "error.dataTitle": "ข้อมูลไม่ครบ",
        "error.ack": "รับทราบ",

        "empty.transactions": "ยังไม่มีประวัติการทำรายการ",

        "tx.delete": "ลบ",
        "tx.viewDetails": "ดูรายละเอียดเทรด",
        "tx.deposit": "ฝากเงิน",
        "tx.withdraw": "ถอนเงิน",
        "tx.tradeWin": "เทรดกำไร",
        "tx.tradeLoss": "เทรดขาดทุน",

        "detail.tradeRecord": "บันทึกเทรด",
        "detail.before": "ก่อนเข้าเทรด",
        "detail.after": "หลังปิดออเดอร์",
        "detail.time": "เวลา",
        "detail.type": "ประเภท",
        "detail.lot": "Lot",
        "detail.rr": "R:R",
        "detail.setup": "แผนเทรด & Confluence",
        "detail.emotionPre": "อารมณ์ก่อนเทรด",
        "detail.lesson": "ผล & บทเรียน",
        "detail.emotionPost": "อารมณ์หลังเทรด",
        "detail.noImage": "ไม่มีรูป",

        "cal.orders": "ออเดอร์",
        "cal.fund": "ฝาก/ถอน",

        "orbit.winLbl": "ชนะ",
        "orbit.lossLbl": "แพ้",

        "alert.deleteTradeConfirm": "รายการนี้คือผลกำไร/ขาดทุนจากการเทรด \nหากลบ ระบบจะลบออเดอร์เทรดนี้ออกจากปฏิทินด้วย ยืนยันหรือไม่?",
        "alert.deleteRegularConfirm": "ต้องการลบรายการฝาก/ถอนนี้ใช่หรือไม่?",
        "alert.deleteSuccess": "ลบข้อมูลสำเร็จ ระบบกำลังอัปเดตยอดเงิน...",
        "alert.deleteFail": "ลบไม่สำเร็จ: ",
        "alert.saveAmountInvalid": "กรุณาระบุจำนวนเงินสุทธิให้ถูกต้อง",
        "alert.saveFail": "⚠️ ไม่สามารถบันทึกได้: ",
        "alert.fundAmountInvalid": "กรุณาระบุจำนวนเงินให้ถูกต้อง",
        "alert.fundWithdrawInsufficient": "ยอดเงินไม่เพียงพอสำหรับการถอน",
        "alert.fundSaveFail": "บันทึกไม่สำเร็จ: ",
        "alert.clearNoData": "ไม่มีข้อมูลให้ลบ",
        "alert.clearDone": "ล้างข้อมูลเรียบร้อย",
        "alert.clearFail": "ล้างข้อมูลไม่สำเร็จ: ",
        "alert.detailLoadFail": "❌ ระบบโหลดไม่สมบูรณ์! หาฟังก์ชันเปิดหน้ารายละเอียดไม่เจอ กรุณารีเฟรชหน้าเว็บ"
    },
    en: {
        "nav.logoTitle": "Back to home",
        "nav.home": "Home",
        "nav.overview": "Overview",
        "nav.calendar": "Calendar",
        "nav.fund": "Fund Management",
        "nav.newTrade": "+ New Trade",
        "nav.profile": "Profile",
        "nav.profileTitle": "Profile settings",
        "lang.switchToEn": "EN",
        "lang.switchToTh": "TH",
        "lang.title": "Switch language",

        "hero.subtitle": "Trading Journal",
        "hero.balance": "Current Balance",
        "hero.changeCurrency": "Change currency",
        "hero.toUSC": "Switch to USC",
        "hero.toUSD": "Switch to USD",

        "history.title": "Trading History",
        "history.clearAll": "Clear All Data",

        "cal.title": "Trading Calendar",
        "cal.sun": "Sun", "cal.mon": "Mon", "cal.tue": "Tue", "cal.wed": "Wed",
        "cal.thu": "Thu", "cal.fri": "Fri", "cal.sat": "Sat",

        "overview.title": "Statistical Overview",
        "overview.subtitle": "Trading performance and portfolio curve for the selected period",
        "overview.toCalendar": "Open calendar →",
        "overview.period": "Period",
        "overview.month": "This month",
        "overview.quarter": "Last 3 months",
        "overview.year": "This year",
        "overview.kpiNet": "Net P/L (trades)",
        "overview.kpiNetHint": "From orders in selected range",
        "overview.kpiWR": "Win rate",
        "overview.kpiCount": "Number of orders",
        "overview.kpiCountHint": "Closed trades only",
        "overview.kpiAvg": "Average per order",
        "overview.kpiAvgHint": "Net P/L ÷ count",
        "overview.chartCap": "Based on deposits, withdrawals, and trade results",
        "overview.winLoss": "Wins vs losses",
        "overview.orderTypes": "Order types",
        "overview.emptyOutcome": "No trades in this period",
        "overview.emptyOrders": "No data in this period",
        "overview.bestDay": "Best day",
        "overview.worstDay": "Worst day",
        "overview.win": "Win",
        "overview.loss": "Loss",
        "overview.chartMonth": "Portfolio curve (this month)",
        "overview.chartQuarter": "Portfolio curve (last 3 months)",
        "overview.chartYear": "Portfolio curve (this year)",
        "overview.balanceLabel": "Balance",
        "overview.kpiWLFmt": "Wins {w} / Losses {l}",
        "cal.orderCountFmt": "{n} orders",

        "trade.back": "Back",
        "trade.step1Title": "New Trade Setup",
        "trade.step2Title": "Before Execution",
        "trade.step3Title": "After Execution",
        "trade.step4Title": "Profit / Loss Summary",
        "trade.entryDate": "Entry Date",
        "trade.entryTime": "Entry Time",
        "trade.symbol": "Asset (Symbol)",
        "trade.orderType": "Order Type",
        "trade.next": "Next Step",
        "trade.upload": "Click to Upload Image",
        "trade.expand": "Expand",
        "trade.addMore": "+ Add More",
        "trade.setup": "Trade Setup & Confluence",
        "trade.emotionPre": "Pre-Trade Emotion",
        "trade.riskTitle": "Risk Management",
        "trade.lot": "Lot Size",
        "trade.rr": "Reward to Risk (1:X)",
        "trade.resultLesson": "Trade Result & Lessons Learned",
        "trade.emotionPost": "Post-Trade Emotion",
        "trade.currency": "Currency",
        "trade.outcome": "Outcome",
        "trade.profit": "Profit",
        "trade.lossLbl": "Loss",
        "trade.netAmount": "Net Amount",
        "trade.confirmSave": "CONFIRM TRADE",
        "trade.confirmSaveBtn": "💾 Confirm save",
        "trade.uploading": "⏳ Uploading...",

        "fund.title": "Fund Management",
        "fund.date": "Transaction Date",
        "fund.type": "Type",
        "fund.deposit": "Deposit",
        "fund.withdraw": "Withdraw",
        "fund.currency": "Currency",
        "fund.amount": "Amount",
        "fund.note": "Note",
        "fund.notePh": "Reason...",
        "fund.cancel": "Cancel",
        "fund.confirm": "Confirm",

        "profile.title": "Profile Settings",
        "profile.name": "Name",
        "profile.role": "Role / Title",
        "profile.bio": "Bio",
        "profile.cancel": "Cancel",
        "profile.save": "Save Profile",

        "modal.deleteAllTitle": "Warning",
        "modal.deleteAllText": "Are you sure you want to clear all data?",
        "modal.deleteAllCancel": "Cancel",
        "modal.deleteAllOk": "Confirm Clear",

        "modal.cancelTradeTitle": "Cancel input",
        "modal.cancelTradeText": "The entered data will not be saved.",
        "modal.resume": "Resume",
        "modal.cancelTradeOk": "Cancel trade",

        "success.tradeTitle": "Success!",
        "success.tradeText": "Trade recorded successfully.",
        "success.ok": "OK",

        "error.dataTitle": "Incomplete Data",
        "error.ack": "Acknowledge",

        "empty.transactions": "No transaction history yet.",

        "tx.delete": "Delete",
        "tx.viewDetails": "View trade details",
        "tx.deposit": "DEPOSIT",
        "tx.withdraw": "WITHDRAWAL",
        "tx.tradeWin": "TRADE PROFIT",
        "tx.tradeLoss": "TRADE LOSS",

        "detail.tradeRecord": "TRADE RECORD",
        "detail.before": "BEFORE EXECUTION",
        "detail.after": "AFTER EXECUTION",
        "detail.time": "Time",
        "detail.type": "Type",
        "detail.lot": "Lot Size",
        "detail.rr": "R:R",
        "detail.setup": "Trade Setup & Confluence",
        "detail.emotionPre": "Pre-Trade Emotion",
        "detail.lesson": "Result & Lessons Learned",
        "detail.emotionPost": "Post-Trade Emotion",
        "detail.noImage": "NO IMAGE",

        "cal.orders": "orders",
        "cal.fund": "Deposit / WD",

        "orbit.winLbl": "Win",
        "orbit.lossLbl": "Loss",

        "alert.deleteTradeConfirm": "This is a trade P/L record.\nDeleting will also remove the trade from the calendar. Continue?",
        "alert.deleteRegularConfirm": "Delete this deposit/withdrawal?",
        "alert.deleteSuccess": "Deleted. Updating balance...",
        "alert.deleteFail": "Delete failed: ",
        "alert.saveAmountInvalid": "Please enter a valid net amount.",
        "alert.saveFail": "⚠️ Could not save: ",
        "alert.fundAmountInvalid": "Please enter a valid amount.",
        "alert.fundWithdrawInsufficient": "Insufficient balance for withdrawal.",
        "alert.fundSaveFail": "Save failed: ",
        "alert.clearNoData": "Nothing to delete.",
        "alert.clearDone": "All data cleared.",
        "alert.clearFail": "Could not clear data: ",
        "alert.detailLoadFail": "❌ Could not open details. Please refresh the page."
    }
};

let currentLang = (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY)) || "th";
if (currentLang !== "th" && currentLang !== "en") currentLang = "th";

export function getLang() {
    return currentLang;
}

export function t(key) {
    const v = DICT[currentLang]?.[key];
    return v != null ? v : key;
}

export function getCalendarMonths() {
    return currentLang === "en" ? MONTHS_EN : MONTHS_TH;
}

export const SHORT_MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
export const SHORT_MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getChartShortMonths() {
    return currentLang === "en" ? SHORT_MONTHS_EN : SHORT_MONTHS_TH;
}

export function applyDomI18n() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (key) el.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (key) el.setAttribute("placeholder", t(key));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
        const key = el.getAttribute("data-i18n-title");
        if (key) el.setAttribute("title", t(key));
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
        const key = el.getAttribute("data-i18n-html");
        if (key) el.innerHTML = t(key);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
        const key = el.getAttribute("data-i18n-aria");
        if (key) el.setAttribute("aria-label", t(key));
    });

    const langBtn = document.getElementById("langToggleBtn");
    if (langBtn) {
        langBtn.textContent = currentLang === "th" ? t("lang.switchToEn") : t("lang.switchToTh");
        langBtn.setAttribute("title", t("lang.title"));
    }

    document.documentElement.lang = currentLang;
    const tit = document.querySelector("title");
    if (tit) tit.textContent = currentLang === "th" ? "DATTER | สมุดเทรด" : "DATTER | Trading Journal";
}

export function setLang(lang) {
    if (lang !== "th" && lang !== "en") return;
    currentLang = lang;
    try {
        localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) {}
    applyDomI18n();
    window.dispatchEvent(new CustomEvent("app:languagechange", { detail: { lang } }));
}

export function toggleLang() {
    setLang(currentLang === "th" ? "en" : "th");
}

export function initI18n() {
    applyDomI18n();
    const btn = document.getElementById("langToggleBtn");
    if (btn && !btn.dataset.bound) {
        btn.dataset.bound = "1";
        btn.addEventListener("click", () => toggleLang());
    }
}

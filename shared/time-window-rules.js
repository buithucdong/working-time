/**
 * Working Time - shared/time-window-rules.js
 * Logic kiểm tra khung giờ chặn, dùng chung cho background service worker và popup.
 * Ngữ nghĩa giữ nguyên từ v1.2: biên bao gồm (inclusive), hỗ trợ rule qua đêm,
 * weekdays rỗng/không có = áp dụng mọi ngày, ngày trong tuần luôn so với ngày hiện tại.
 */

export function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

export function isWithinBlockedWindow(domainData, now = new Date()) {
    if (!domainData || !domainData.startTime || !domainData.endTime) {
        return false;
    }

    const currentDay = now.getDay(); // 0 = Chủ Nhật, 1-6 = Thứ 2 đến Thứ 7

    // Kiểm tra ngày trong tuần
    // Nếu weekdays không tồn tại hoặc là mảng rỗng, mặc định áp dụng cho tất cả các ngày
    if (domainData.weekdays && domainData.weekdays.length > 0 && !domainData.weekdays.includes(currentDay)) {
        return false; // Không áp dụng vào ngày này
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = timeToMinutes(domainData.startTime);
    const endMinutes = timeToMinutes(domainData.endTime);

    // Xử lý cả rule trong ngày (08:00-17:00) và rule overnight (22:00-06:00)
    if (startMinutes <= endMinutes) {
        // Rule trong cùng ngày
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
        // Rule qua đêm (ví dụ: 22:00 - 06:00)
        return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
}

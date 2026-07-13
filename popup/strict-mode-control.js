/**
 * Working Time - popup/strict-mode-control.js
 * Chế độ nghiêm ngặt: khóa toggle/xóa/sửa giờ của domain đang bị chặn, khóa pause,
 * khóa hủy focus, khóa import. Bật ngay lập tức; TẮT phải giữ popup mở đếm ngược
 * 30 giây (friction có chủ đích — đóng popup giữa chừng = hủy yêu cầu tắt).
 */

import { isWithinBlockedWindow } from '../shared/time-window-rules.js';

const DISABLE_COUNTDOWN_SECONDS = 30;

let countdownInterval = null;

export function initStrictModeControl() {
    const checkbox = document.getElementById('strictModeCheckbox');
    const countdownLabel = document.getElementById('strictCountdown');

    // Phản ánh trạng thái đã lưu
    chrome.storage.local.get({ strictMode: false }, function (result) {
        checkbox.checked = result.strictMode;
    });

    // Render lại danh sách khi strictMode đổi do popup-main lắng nghe storage.onChanged
    checkbox.addEventListener('change', function () {
        if (checkbox.checked) {
            chrome.storage.local.set({ strictMode: true });
            return;
        }

        // Yêu cầu tắt: giữ checkbox bật cho tới khi đếm ngược 30s xong.
        // Bấm lần nữa TRONG lúc đếm = hủy yêu cầu tắt (đóng popup cũng hủy).
        checkbox.checked = true;
        if (countdownInterval) {
            cancelCountdown(countdownLabel);
            return;
        }

        let remaining = DISABLE_COUNTDOWN_SECONDS;
        countdownLabel.textContent = `Giữ popup mở… ${remaining}s`;
        countdownLabel.classList.remove('hidden');

        countdownInterval = setInterval(function () {
            remaining--;
            if (remaining > 0) {
                countdownLabel.textContent = `Giữ popup mở… ${remaining}s`;
                return;
            }
            cancelCountdown(countdownLabel);
            checkbox.checked = false;
            chrome.storage.local.set({ strictMode: false });
        }, 1000);
    });
}

function cancelCountdown(countdownLabel) {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    countdownLabel.classList.add('hidden');
}

/**
 * Đọc context strict/focus hiện tại từ storage — dùng chung cho list, pause, import.
 * cb nhận { strictMode, focusActive }.
 */
export function getStrictContext(cb) {
    chrome.storage.local.get({ strictMode: false, focusEndTime: null }, function (result) {
        cb({
            strictMode: result.strictMode,
            focusActive: !!(result.focusEndTime && result.focusEndTime > Date.now())
        });
    });
}

/** Domain bị khóa thao tác khi strict bật VÀ domain đang thực sự bị chặn lúc này */
export function isDomainLocked(domainData, ctx, now = new Date()) {
    if (!ctx.strictMode) return false;
    return ctx.focusActive || (!!domainData.enabled && isWithinBlockedWindow(domainData, now));
}

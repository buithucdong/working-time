/**
 * Working Time - popup/focus-session-controls.js
 * Phiên focus: chặn TOÀN BỘ domain trong danh sách X phút (bỏ qua toggle/khung giờ),
 * badge đếm ngược do background quản lý. Focus thắng pause: bấm focus xóa pauseEndTime.
 * Hủy focus bị khóa khi strict mode bật.
 */

import { updateBatchToggleButtonStatus } from './batch-pause-controls.js';

export function initFocusSessionControls() {
    const focusToggleBtn = document.getElementById('focusToggleBtn');
    const focusDurationContainer = document.getElementById('focusDurationContainer');
    const focusDuration = document.getElementById('focusDuration');
    const applyFocusBtn = document.getElementById('applyFocusBtn');
    const cancelFocusBtn = document.getElementById('cancelFocusBtn');

    focusToggleBtn.addEventListener('click', function () {
        chrome.storage.local.get({ focusEndTime: null, strictMode: false }, function (result) {
            const focusActive = result.focusEndTime && result.focusEndTime > Date.now();

            if (!focusActive) {
                focusDurationContainer.classList.remove('hidden');
                return;
            }

            if (result.strictMode) {
                alert('Chế độ nghiêm ngặt đang bật — không thể hủy phiên focus.');
                return;
            }

            if (confirm('Hủy phiên focus hiện tại?')) {
                chrome.storage.local.remove('focusEndTime', function () {
                    updateFocusButtonStatus();
                });
            }
        });
    });

    applyFocusBtn.addEventListener('click', function () {
        const duration = parseInt(focusDuration.value);
        if (isNaN(duration) || duration < 5 || duration > 180) {
            alert('Vui lòng nhập thời gian hợp lệ (5-180 phút)');
            return;
        }

        const focusEndTime = Date.now() + duration * 60 * 1000;
        // Focus thắng pause — xóa pause đang chạy (nếu có) trong cùng thao tác.
        // Danh sách domain tự render lại (khóa strict) qua storage.onChanged ở popup-main.
        chrome.storage.local.set({ focusEndTime: focusEndTime }, function () {
            chrome.storage.local.remove('pauseEndTime', function () {
                updateFocusButtonStatus();
                updateBatchToggleButtonStatus();
                focusDurationContainer.classList.add('hidden');
                // Đóng luôn container pause nếu đang mở — không cho apply pause treo sẵn
                document.getElementById('pauseDurationContainer').classList.add('hidden');
            });
        });
    });

    cancelFocusBtn.addEventListener('click', function () {
        focusDurationContainer.classList.add('hidden');
    });

    updateFocusButtonStatus();
}

/** Cập nhật nhãn nút Focus theo focusEndTime trong storage */
export function updateFocusButtonStatus() {
    chrome.storage.local.get({ focusEndTime: null }, function (result) {
        const focusToggleBtn = document.getElementById('focusToggleBtn');
        const btnText = focusToggleBtn.querySelector('span');

        const now = Date.now();
        if (result.focusEndTime && result.focusEndTime > now) {
            const remainingMinutes = Math.ceil((result.focusEndTime - now) / 60000);
            btnText.textContent = `Focus (${remainingMinutes}p)`;
            focusToggleBtn.classList.add('focusing');
        } else {
            btnText.textContent = 'Focus';
            focusToggleBtn.classList.remove('focusing');
        }
    });
}

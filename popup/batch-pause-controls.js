/**
 * Working Time - popup/batch-pause-controls.js
 * Nút bật/tắt hàng loạt + tạm dừng.
 *
 * Ngữ nghĩa pause mới (v1.3): popup CHỈ ghi pauseEndTime vào storage — không đụng
 * cờ enabled, không setTimeout. Background service worker tự khôi phục chặn khi hết
 * giờ (sửa lỗi v1.2: timer chết khi đóng popup). Bấm nút khi đang pause = hủy pause.
 */

import { renderDomainList } from './domain-list-view.js';

export function initBatchPauseControls() {
    const batchToggleBtn = document.getElementById('batchToggleBtn');
    const pauseDurationContainer = document.getElementById('pauseDurationContainer');
    const pauseDuration = document.getElementById('pauseDuration');
    const applyPauseBtn = document.getElementById('applyPauseBtn');
    const cancelPauseBtn = document.getElementById('cancelPauseBtn');

    batchToggleBtn.addEventListener('click', function () {
        chrome.storage.local.get({ blockedDomains: {}, pauseEndTime: null }, function (result) {
            // Đang pause → bấm nút = hủy pause, chặn hoạt động lại ngay
            if (result.pauseEndTime && result.pauseEndTime > Date.now()) {
                chrome.storage.local.remove('pauseEndTime', updateBatchToggleButtonStatus);
                return;
            }

            const activeCount = getActiveDomainsCount(result.blockedDomains);
            const totalCount = Object.keys(result.blockedDomains).length;

            if (activeCount < totalCount) {
                // Có domain đang tắt → bật tất cả
                toggleAllDomains(true);
            } else {
                // Tất cả đang bật → hiện tùy chọn tạm dừng
                pauseDurationContainer.classList.remove('hidden');
            }
        });
    });

    applyPauseBtn.addEventListener('click', function () {
        const duration = parseInt(pauseDuration.value);
        if (isNaN(duration) || duration < 5 || duration > 120) {
            alert('Vui lòng nhập thời gian hợp lệ (5-120 phút)');
            return;
        }

        // Chỉ ghi pauseEndTime — background lo phần còn lại
        const pauseEndTime = Date.now() + duration * 60 * 1000;
        chrome.storage.local.set({ pauseEndTime: pauseEndTime }, function () {
            updateBatchToggleButtonStatus();
            pauseDurationContainer.classList.add('hidden');
        });
    });

    cancelPauseBtn.addEventListener('click', function () {
        pauseDurationContainer.classList.add('hidden');
        // Không thay đổi trạng thái các domain
    });
}

function toggleAllDomains(enable) {
    chrome.storage.local.get({ blockedDomains: {} }, function (result) {
        const blockedDomains = result.blockedDomains;
        let updated = false;

        for (const domain in blockedDomains) {
            if (blockedDomains[domain].enabled !== enable) {
                blockedDomains[domain].enabled = enable;
                updated = true;
            }
        }

        if (updated) {
            chrome.storage.local.set({ blockedDomains: blockedDomains }, function () {
                renderDomainList();
            });
        }
    });
}

/**
 * Cập nhật nhãn nút hàng loạt. Trạng thái pause đọc từ pauseEndTime trong storage
 * (cờ enabled không còn phản ánh pause như v1.2).
 */
export function updateBatchToggleButtonStatus() {
    chrome.storage.local.get({ blockedDomains: {}, pauseEndTime: null }, function (result) {
        const batchToggleBtn = document.getElementById('batchToggleBtn');
        const btnText = batchToggleBtn.querySelector('span');

        const now = Date.now();
        if (result.pauseEndTime && result.pauseEndTime > now) {
            const remainingMinutes = Math.ceil((result.pauseEndTime - now) / 60000);
            btnText.textContent = `Tạm dừng (${remainingMinutes}p)`;
            batchToggleBtn.classList.add('paused');
            return;
        }
        batchToggleBtn.classList.remove('paused');

        const activeCount = getActiveDomainsCount(result.blockedDomains);
        const totalCount = Object.keys(result.blockedDomains).length;

        if (activeCount === 0) {
            btnText.textContent = 'Bật';
            batchToggleBtn.classList.remove('all-active');
        } else if (activeCount === totalCount) {
            btnText.textContent = 'Tạm dừng';
            batchToggleBtn.classList.add('all-active');
        } else {
            btnText.textContent = `Bật (${activeCount}/${totalCount})`;
            batchToggleBtn.classList.remove('all-active');
        }
    });
}

function getActiveDomainsCount(blockedDomains) {
    let count = 0;
    for (const domain in blockedDomains) {
        if (blockedDomains[domain].enabled) {
            count++;
        }
    }
    return count;
}

/**
 * Working Time - popup/popup-main.js
 * Entry của popup: wiring các module UI. Popup là UI thuần trên chrome.storage.local —
 * KHÔNG chứa logic chặn (background service worker đảm nhiệm qua storage.onChanged).
 */

import { renderDomainList, initDomainListEvents, searchDomains } from './domain-list-view.js';
import { initDomainAddForm } from './domain-add-form.js';
import { initBatchPauseControls, updateBatchToggleButtonStatus } from './batch-pause-controls.js';
import { initFocusSessionControls, updateFocusButtonStatus } from './focus-session-controls.js';
import { initStrictModeControl } from './strict-mode-control.js';
import { initStatisticsView } from './statistics-view.js';
import { initImportExport } from './settings-import-export.js';

document.addEventListener('DOMContentLoaded', function () {
    initDomainAddForm();
    initDomainListEvents();
    initBatchPauseControls();
    initFocusSessionControls();
    initStrictModeControl();
    initStatisticsView();
    initImportExport();
    initSearchBar();

    renderDomainList();

    // Cập nhật đếm ngược pause/focus mỗi phút khi popup đang mở
    // (thời điểm kết thúc đọc từ storage, không giữ timer chặn nào ở popup)
    setInterval(function () {
        updateBatchToggleButtonStatus();
        updateFocusButtonStatus();
    }, 60000);

    // Nguồn sự thật duy nhất cho việc làm mới UI: mọi thay đổi storage liên quan
    // (kể cả do background dọn focus/pause hết hạn) → render lại danh sách + nút,
    // để trạng thái khóa strict-mode luôn đúng ngay khi focus bắt đầu/kết thúc
    chrome.storage.onChanged.addListener(function (changes, areaName) {
        if (areaName !== 'local') return;
        if (changes.blockedDomains || changes.focusEndTime || changes.strictMode || changes.pauseEndTime) {
            renderDomainList();
            updateFocusButtonStatus();
            updateBatchToggleButtonStatus();
        }
    });
});

function initSearchBar() {
    const searchToggleBtn = document.getElementById('searchToggleBtn');
    const searchContainer = document.getElementById('searchContainer');
    const searchInput = document.getElementById('searchInput');
    const searchCloseBtn = document.getElementById('searchCloseBtn');

    searchToggleBtn.addEventListener('click', function () {
        searchContainer.classList.remove('hidden');
        searchInput.focus();
    });

    searchCloseBtn.addEventListener('click', function () {
        searchContainer.classList.add('hidden');
        searchInput.value = '';
        searchDomains('');
    });

    searchInput.addEventListener('input', function () {
        searchDomains(this.value.toLowerCase());
    });
}

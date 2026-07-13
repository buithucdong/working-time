/**
 * Working Time - popup/popup-main.js
 * Entry của popup: wiring các module UI. Popup là UI thuần trên chrome.storage.local —
 * KHÔNG chứa logic chặn (background service worker đảm nhiệm qua storage.onChanged).
 */

import { renderDomainList, initDomainListEvents, searchDomains } from './domain-list-view.js';
import { initDomainAddForm } from './domain-add-form.js';
import { initBatchPauseControls, updateBatchToggleButtonStatus } from './batch-pause-controls.js';
import { initStatisticsView } from './statistics-view.js';
import { initImportExport } from './settings-import-export.js';

document.addEventListener('DOMContentLoaded', function () {
    initDomainAddForm();
    initDomainListEvents();
    initBatchPauseControls();
    initStatisticsView();
    initImportExport();
    initSearchBar();

    renderDomainList();

    // Cập nhật đếm ngược pause mỗi phút khi popup đang mở
    // (thời điểm kết thúc đọc từ pauseEndTime trong storage, không giữ timer chặn nào ở popup)
    setInterval(updateBatchToggleButtonStatus, 60000);
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

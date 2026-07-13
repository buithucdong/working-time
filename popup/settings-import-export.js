/**
 * Working Time - popup/settings-import-export.js
 * Xuất/nhập cài đặt dạng JSON. Định dạng file giữ nguyên từ v1.2
 * (blockedDomains + statistics + exportDate) — file backup cũ nhập được bình thường.
 */

import { renderDomainList } from './domain-list-view.js';
import { isValidDomainName } from './domain-add-form.js';

export function initImportExport() {
    // Toggle mở/đóng khu vực xuất/nhập
    const importExportToggle = document.getElementById('importExportToggle');
    const importExportActions = document.getElementById('importExportActions');

    importExportToggle.addEventListener('click', function () {
        this.classList.toggle('active');
        importExportActions.classList.toggle('hidden');
        importExportActions.classList.toggle('show', !importExportActions.classList.contains('hidden'));
    });

    document.getElementById('exportBtn').addEventListener('click', exportSettings);

    document.getElementById('importBtn').addEventListener('click', function () {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.classList.add('import-file-input');
        document.body.appendChild(fileInput);

        fileInput.addEventListener('change', importSettings);
        fileInput.click();

        setTimeout(() => {
            document.body.removeChild(fileInput);
        }, 5000);
    });
}

function exportSettings() {
    chrome.storage.local.get(null, function (data) {
        const exportData = {
            blockedDomains: data.blockedDomains || {},
            statistics: data.statistics || { blockCount: 0, savedTime: 0, blockHistory: {} },
            exportDate: new Date().toISOString()
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `working-time-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();

        setTimeout(() => {
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
        }, 100);
    });
}

function importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);

            if (!data.blockedDomains) {
                throw new Error('Dữ liệu không hợp lệ: thiếu thông tin blockedDomains');
            }

            // Chỉ nhận key là tên miền hợp lệ (chặn key rác/HTML vào storage và DNR),
            // normalize lowercase giống form thêm domain
            const sanitizedDomains = {};
            let skippedCount = 0;
            for (const key in data.blockedDomains) {
                const domain = key.trim().toLowerCase();
                if (isValidDomainName(domain)) {
                    sanitizedDomains[domain] = data.blockedDomains[key];
                } else {
                    skippedCount++;
                }
            }

            if (confirm('Bạn có chắc muốn nhập dữ liệu này? Tất cả cài đặt hiện tại sẽ bị ghi đè.')) {
                chrome.storage.local.set({
                    blockedDomains: sanitizedDomains,
                    statistics: data.statistics || { blockCount: 0, savedTime: 0, blockHistory: {} }
                }, function () {
                    alert(skippedCount > 0
                        ? `Nhập dữ liệu thành công! (bỏ qua ${skippedCount} mục không phải tên miền hợp lệ)`
                        : 'Nhập dữ liệu thành công!');
                    renderDomainList();
                });
            }
        } catch (error) {
            alert(`Lỗi khi nhập dữ liệu: ${error.message}`);
        }
    };
    reader.readAsText(file);
}

/**
 * Working Time - popup/domain-list-view.js
 * Render danh sách domain bị chặn: toggle, sửa giờ inline, xóa, tìm kiếm.
 * Toàn bộ event dùng delegation trên .domain-list (gắn MỘT lần, tránh double-bind).
 */

import { updateBatchToggleButtonStatus } from './batch-pause-controls.js';
import { isDomainLocked } from './strict-mode-control.js';

const domainList = document.querySelector('.domain-list');

export function renderDomainList() {
    chrome.storage.local.get({ blockedDomains: {}, strictMode: false, focusEndTime: null }, function (result) {
        const blockedDomains = result.blockedDomains;
        const ctx = {
            strictMode: result.strictMode,
            focusActive: !!(result.focusEndTime && result.focusEndTime > Date.now())
        };
        domainList.innerHTML = '';

        for (const domain in blockedDomains) {
            const domainData = blockedDomains[domain];
            const weekdayDisplay = getWeekdayDisplayText(domainData.weekdays || [1, 2, 3, 4, 5, 6, 0]);
            // Strict mode: domain đang bị chặn → disable toggle/xóa/sửa giờ (không cho lách)
            const locked = isDomainLocked(domainData, ctx);
            const dis = locked ? 'disabled' : '';

            const domainElement = document.createElement('div');
            domainElement.className = locked ? 'domain locked' : 'domain';
            domainElement.innerHTML = `
                <label class="toggle" ${locked ? 'title="Chế độ nghiêm ngặt: đang trong giờ chặn"' : ''}>
                    <input type="checkbox" ${domainData.enabled ? 'checked' : ''} ${dis}>
                    <span class="slider"></span>
                </label>
                <li>${domain}</li>
                <div class="time-display" data-domain="${domain}">
                    <input type="time" class="edit-start-time" value="${domainData.startTime}" ${dis}>
                    -
                    <input type="time" class="edit-end-time" value="${domainData.endTime}" ${dis}>
                    <span class="weekday-display" title="${weekdayDisplay}">${getShortWeekdayDisplay(domainData.weekdays)}</span>
                </div>
                <button class="delete-btn" ${dis}>×</button>`;

            domainList.appendChild(domainElement);
        }

        updateBatchToggleButtonStatus();
    });
}

/** Gắn event delegation MỘT lần khi popup mở */
export function initDomainListEvents() {
    // Nút xóa
    domainList.addEventListener('click', function (e) {
        if (!e.target.classList.contains('delete-btn')) return;

        const domainElement = e.target.closest('.domain');
        const domain = domainElement.querySelector('li').textContent;

        chrome.storage.local.get({ blockedDomains: {} }, function (result) {
            const blockedDomains = result.blockedDomains;
            delete blockedDomains[domain];
            chrome.storage.local.set({ blockedDomains: blockedDomains }, function () {
                domainElement.remove();
                updateBatchToggleButtonStatus();
            });
        });
    });

    // Toggle bật/tắt và sửa giờ inline (change nổi bọt lên .domain-list)
    domainList.addEventListener('change', function (e) {
        const domainElement = e.target.closest('.domain');
        if (!domainElement) return;
        const domain = domainElement.querySelector('li').textContent;

        if (e.target.matches('.toggle input[type="checkbox"]')) {
            const enabled = e.target.checked;
            chrome.storage.local.get({ blockedDomains: {} }, function (result) {
                const blockedDomains = result.blockedDomains;
                blockedDomains[domain].enabled = enabled;
                chrome.storage.local.set({ blockedDomains: blockedDomains }, function () {
                    updateBatchToggleButtonStatus();
                });
            });
        }

        if (e.target.matches('.edit-start-time, .edit-end-time')) {
            const parentDiv = e.target.closest('.time-display');
            const startTime = parentDiv.querySelector('.edit-start-time').value;
            const endTime = parentDiv.querySelector('.edit-end-time').value;

            chrome.storage.local.get({ blockedDomains: {} }, function (result) {
                const blockedDomains = result.blockedDomains;
                blockedDomains[domain].startTime = startTime;
                blockedDomains[domain].endTime = endTime;
                chrome.storage.local.set({ blockedDomains: blockedDomains });
            });
        }
    });
}

/** Lọc danh sách theo từ khóa tìm kiếm */
export function searchDomains(searchTerm) {
    document.querySelectorAll('.domain').forEach(domainElement => {
        const domainName = domainElement.querySelector('li').textContent.toLowerCase();
        domainElement.classList.toggle('domain-hidden', !domainName.includes(searchTerm));
    });
}

// ----- HIỂN THỊ NGÀY TRONG TUẦN -----

function getWeekdayDisplayText(weekdays) {
    if (!weekdays || weekdays.length === 0) {
        return "Tất cả các ngày";
    }
    const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return weekdays.map(day => dayNames[day]).join(', ');
}

function getShortWeekdayDisplay(weekdays) {
    if (!weekdays || weekdays.length === 7) {
        return "Tất cả";
    } else if (weekdays.length === 5 &&
               weekdays.includes(1) && weekdays.includes(2) &&
               weekdays.includes(3) && weekdays.includes(4) &&
               weekdays.includes(5)) {
        return "T2-T6";
    } else {
        return `${weekdays.length} ngày`;
    }
}

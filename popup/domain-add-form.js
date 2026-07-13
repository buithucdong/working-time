/**
 * Working Time - popup/domain-add-form.js
 * Form thêm domain: validation realtime, prefill từ tab hiện tại, chọn ngày trong tuần.
 */

import { renderDomainList } from './domain-list-view.js';

const blockForm = document.querySelector('.block-form');
const domainInput = document.querySelector('.domain-input');
const startTimeInput = document.querySelector('#startTime');
const endTimeInput = document.querySelector('#endTime');

export const DEFAULT_START_TIME = '08:00';
export const DEFAULT_END_TIME = '16:00';

let canSubmit = false;

export function initDomainAddForm() {
    startTimeInput.value = DEFAULT_START_TIME;
    endTimeInput.value = DEFAULT_END_TIME;

    // Prefill domain từ tab đang mở
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        try {
            domainInput.value = tabs[0].url.match(/https?:\/\/(?:www\.)?([^/]+)/)[1];
            validateInput();
        } catch (e) {
            domainInput.value = '';
        }
    });

    // Validation realtime
    domainInput.addEventListener('click', validateInput);
    domainInput.addEventListener('input', validateInput);
    domainInput.addEventListener('blur', () => {
        if (!domainInput.value) {
            domainInput.className = 'domain-input';
        }
    });

    blockForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!canSubmit) return;

        const domain = domainInput.value;
        if (!startTimeInput.value || !endTimeInput.value) {
            alert('Vui lòng chọn thời gian bắt đầu và kết thúc');
            return;
        }

        // Cho phép cả rule overnight (ví dụ: 22:00 - 06:00)
        addBlockedDomain(domain);

        // Reset form sau khi thêm
        setTimeout(() => {
            startTimeInput.value = DEFAULT_START_TIME;
            endTimeInput.value = DEFAULT_END_TIME;
            domainInput.value = '';
            canSubmit = false;
            domainInput.className = 'domain-input';
        }, 100);
    });
}

function addBlockedDomain(domain) {
    if (!domain) return;

    // DNR requestDomains yêu cầu lowercase — normalize ngay khi lưu
    domain = domain.trim().toLowerCase();

    // Lấy các ngày được chọn
    const weekdays = [];
    document.querySelectorAll('input[name="weekday"]:checked').forEach(checkbox => {
        weekdays.push(parseInt(checkbox.value));
    });

    chrome.storage.local.get({ blockedDomains: {} }, function (result) {
        const blockedDomains = result.blockedDomains;
        blockedDomains[domain] = {
            enabled: true,
            startTime: startTimeInput.value,
            endTime: endTimeInput.value,
            weekdays: weekdays.length > 0 ? weekdays : [1, 2, 3, 4, 5, 6, 0] // Không chọn ngày nào = tất cả các ngày
        };

        chrome.storage.local.set({ blockedDomains: blockedDomains }, function () {
            renderDomainList();
        });
    });
}

function validateInput() {
    domainInput.className = 'domain-input';

    if (domainInput.value === '') {
        domainInput.classList.add('domain-input-valid');
        return;
    }

    if (isValidDomainName(domainInput.value)) {
        domainInput.classList.add('domain-input-valid');
        canSubmit = true;
    } else {
        domainInput.classList.add('domain-input-invalid');
        canSubmit = false;
    }
}

/** Dùng chung cho form thêm domain và kiểm tra key khi import backup */
export function isValidDomainName(str) {
    const pattern = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return !!pattern.test(str);
}

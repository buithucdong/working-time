/**
 * Working Time - background/blocking-rules-engine.js
 * Tính danh sách domain đang bị chặn "ngay bây giờ" và đồng bộ DNR session rules.
 */

import { isWithinBlockedWindow } from '../shared/time-window-rules.js';

// DNR requestDomains chỉ chấp nhận ASCII lowercase — key không hợp lệ (dữ liệu cũ,
// file import xấu) phải bị loại ở đây, nếu không MỘT key rác làm cả batch updateSessionRules
// thất bại và toàn bộ chặn ngừng hoạt động.
const DOMAIN_KEY_PATTERN = /^[a-z0-9.-]+$/;

/**
 * Trả về danh sách domain cần chặn tại thời điểm now (đã normalize lowercase, sort, dedupe).
 * Pause (pauseEndTime trong tương lai) ghi đè toàn bộ — không đụng cờ enabled.
 */
export function computeActiveDomains(blockedDomains, pauseEndTime, now = new Date()) {
    if (pauseEndTime && now.getTime() < pauseEndTime) {
        return [];
    }

    const active = new Set();
    for (const domain in blockedDomains) {
        const domainData = blockedDomains[domain];
        if (!domainData || !domainData.enabled || !isWithinBlockedWindow(domainData, now)) {
            continue;
        }
        const key = domain.trim().toLowerCase();
        if (DOMAIN_KEY_PATTERN.test(key)) {
            active.add(key);
        }
    }
    return [...active].sort();
}

/** URL trang chặn nội bộ; originalUrl (nếu có) phải được encode sẵn. */
export function blockedPageUrl(domain, encodedOriginalUrl) {
    let url = chrome.runtime.getURL('blocked.html') + '?from=' + domain;
    if (encodedOriginalUrl) {
        url += '&url=' + encodedOriginalUrl;
    }
    return url;
}

/**
 * Đồng bộ DNR session rules với danh sách domain active (đã sort).
 * Rule id ổn định theo vị trí trong danh sách đã sort; thay toàn bộ trong MỘT
 * lệnh updateSessionRules (removeRuleIds + addRules) để tránh khoảng hở rule.
 */
export async function syncDnrRules(activeDomains) {
    const currentRules = await chrome.declarativeNetRequest.getSessionRules();

    // Bỏ qua nếu tập domain không đổi (tick mỗi phút, đa số lần không có thay đổi)
    const currentDomains = currentRules
        .map(rule => rule.condition.requestDomains && rule.condition.requestDomains[0])
        .filter(Boolean)
        .sort();
    if (JSON.stringify(currentDomains) === JSON.stringify(activeDomains)) {
        return;
    }

    // regexFilter phải khớp TOÀN BỘ URL để \0 trong regexSubstitution
    // là URL gốc đầy đủ (\0 = phần khớp, không phải cả URL nếu regex chỉ khớp prefix).
    // Lưu ý: Chrome giới hạn 1000 rule dùng regexFilter cho mỗi extension — dư thừa
    // cho danh sách domain người dùng nhập tay.
    const addRules = activeDomains.map((domain, index) => ({
        id: index + 1,
        priority: 1,
        action: {
            type: 'redirect',
            redirect: {
                regexSubstitution: blockedPageUrl(domain) + '&url=\\0'
            }
        },
        condition: {
            regexFilter: '^https?://.*',
            requestDomains: [domain],
            resourceTypes: ['main_frame']
        }
    }));

    await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: currentRules.map(rule => rule.id),
        addRules
    });
}

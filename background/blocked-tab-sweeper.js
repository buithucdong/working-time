/**
 * Working Time - background/blocked-tab-sweeper.js
 * Quét các tab đang mở và chuyển hướng tab thuộc domain bị chặn sang blocked.html.
 * DNR chỉ chặn navigation MỚI — tab đã mở sẵn khi khung giờ bắt đầu cần sweep này.
 */

import { blockedPageUrl } from './blocking-rules-engine.js';

/**
 * Khớp hostname với domain bị chặn — cùng ngữ nghĩa với DNR requestDomains:
 * khớp chính xác hoặc là subdomain (www., m., ...). Không strip www khỏi hostname
 * để domain lưu dạng "www.example.com" vẫn khớp đúng như rule DNR của nó.
 */
function matchBlockedDomain(hostname, activeDomains) {
    for (const domain of activeDomains) {
        if (hostname === domain || hostname.endsWith('.' + domain)) {
            return domain;
        }
    }
    return null;
}

export async function sweepOpenTabs(activeDomains) {
    if (activeDomains.length === 0) {
        return;
    }

    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
        // Bỏ qua tab không phải http(s): chrome://, chrome-extension:// (gồm blocked.html), v.v.
        if (!tab.url || !/^https?:\/\//.test(tab.url)) {
            continue;
        }

        try {
            const hostname = new URL(tab.url).hostname;
            const domain = matchBlockedDomain(hostname, activeDomains);
            if (domain) {
                // URL gốc truyền RAW (không encode) — cùng định dạng với DNR
                // regexSubstitution, blocked.js chỉ cần một cách parse duy nhất
                await chrome.tabs.update(tab.id, {
                    url: blockedPageUrl(domain, tab.url)
                });
            }
        } catch (e) {
            // Tab có thể đã đóng hoặc không cho phép update (Web Store...) — bỏ qua
        }
    }
}

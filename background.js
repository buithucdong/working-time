/**
 * Working Time - background.js (service worker entry)
 * Chỉ wiring listener — không giữ state trong bộ nhớ (SW có thể bị kill bất kỳ lúc nào,
 * mọi state nằm trong chrome.storage.local).
 *
 * Vòng lặp recompute tự phục hồi: alarm 1 phút + storage.onChanged + onStartup/onInstalled.
 */

import { computeActiveDomains, syncDnrRules } from './background/blocking-rules-engine.js';
import { sweepOpenTabs } from './background/blocked-tab-sweeper.js';

const RECOMPUTE_ALARM = 'recompute-blocking';

// Hàng đợi tuần tự hóa recompute: alarm + storage.onChanged có thể chồng lấn,
// hai lần chạy song song sẽ đọc session rules cũ và add trùng rule id.
// Promise này không mang state nghiệp vụ — SW bị kill chỉ reset về trạng thái rảnh.
let recomputeQueue = Promise.resolve();

function recompute() {
    recomputeQueue = recomputeQueue.then(runRecompute);
    return recomputeQueue;
}

async function runRecompute() {
    try {
        const { blockedDomains, pauseEndTime, focusEndTime } = await chrome.storage.local.get({
            blockedDomains: {},
            pauseEndTime: null,
            focusEndTime: null
        });

        const now = new Date();

        // Dọn các override đã hết hạn (ghi storage sẽ kích hoạt thêm 1 recompute — vô hại)
        if (pauseEndTime && now.getTime() >= pauseEndTime) {
            await chrome.storage.local.remove('pauseEndTime');
        }
        if (focusEndTime && now.getTime() >= focusEndTime) {
            await chrome.storage.local.remove('focusEndTime');
        }

        const activeDomains = computeActiveDomains(blockedDomains, pauseEndTime, focusEndTime, now);
        await syncDnrRules(activeDomains);
        await sweepOpenTabs(activeDomains);
        await updateFocusBadge(focusEndTime, now);
    } catch (e) {
        // Không để một lần recompute lỗi giết cả vòng lặp — tick sau sẽ thử lại
        console.error('Working Time: recompute failed', e);
    }
}

/** Badge đếm ngược focus trên icon — độ chính xác 1 phút theo cadence alarm */
async function updateFocusBadge(focusEndTime, now) {
    if (focusEndTime && now.getTime() < focusEndTime) {
        const remainingMinutes = Math.ceil((focusEndTime - now.getTime()) / 60000);
        await chrome.action.setBadgeBackgroundColor({ color: '#ffd300' });
        // setBadgeTextColor cần Chrome 110+ — bỏ qua trên bản cũ, badge vẫn hiện
        await chrome.action.setBadgeTextColor?.({ color: '#162c6e' });
        await chrome.action.setBadgeText({ text: String(remainingMinutes) });
    } else {
        await chrome.action.setBadgeText({ text: '' });
    }
}

function ensureAlarm() {
    chrome.alarms.create(RECOMPUTE_ALARM, { periodInMinutes: 1 });
}

chrome.runtime.onInstalled.addListener(() => {
    ensureAlarm();
    recompute();
});

chrome.runtime.onStartup.addListener(() => {
    ensureAlarm();
    recompute();
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === RECOMPUTE_ALARM) {
        recompute();
    }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && (changes.blockedDomains || changes.pauseEndTime || changes.focusEndTime)) {
        recompute();
    }
});

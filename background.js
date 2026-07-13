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
        const { blockedDomains, pauseEndTime } = await chrome.storage.local.get({
            blockedDomains: {},
            pauseEndTime: null
        });

        const now = new Date();

        // Dọn pauseEndTime đã hết hạn (ghi storage sẽ kích hoạt thêm 1 recompute — vô hại)
        if (pauseEndTime && now.getTime() >= pauseEndTime) {
            await chrome.storage.local.remove('pauseEndTime');
        }

        const activeDomains = computeActiveDomains(blockedDomains, pauseEndTime, now);
        await syncDnrRules(activeDomains);
        await sweepOpenTabs(activeDomains);
    } catch (e) {
        // Không để một lần recompute lỗi giết cả vòng lặp — tick sau sẽ thử lại
        console.error('Working Time: recompute failed', e);
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
    if (areaName === 'local' && (changes.blockedDomains || changes.pauseEndTime)) {
        recompute();
    }
});

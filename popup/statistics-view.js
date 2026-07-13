/**
 * Working Time - popup/statistics-view.js
 * Hiển thị và đặt lại thống kê chặn (blockCount, savedTime, blockHistory).
 */

export function initStatisticsView() {
    document.getElementById('toggleStatsBtn').addEventListener('click', function () {
        const statsContent = document.getElementById('statisticsContent');
        statsContent.classList.toggle('hidden');
        this.querySelector('span').textContent = statsContent.classList.contains('hidden') ?
            'Hiển thị thống kê' : 'Ẩn thống kê';

        if (!statsContent.classList.contains('hidden')) {
            loadStatistics();
        }
    });

    document.getElementById('resetStatsBtn').addEventListener('click', function () {
        if (confirm('Bạn có chắc muốn đặt lại tất cả thống kê?')) {
            resetStatistics();
        }
    });
}

export function loadStatistics() {
    chrome.storage.local.get({ statistics: { blockCount: 0, savedTime: 0, blockHistory: {} } }, function (result) {
        const stats = result.statistics;

        document.getElementById('blockCount').textContent = stats.blockCount.toLocaleString();

        // Chuyển từ phút sang giờ nếu lớn
        const savedTime = stats.savedTime;
        if (savedTime >= 60) {
            const hours = Math.floor(savedTime / 60);
            const minutes = savedTime % 60;
            document.getElementById('savedTime').textContent = `${hours} giờ ${minutes} phút`;
        } else {
            document.getElementById('savedTime').textContent = `${savedTime} phút`;
        }

        // Trang web bị chặn nhiều nhất
        let topDomain = '-';
        let topCount = 0;
        for (const domain in stats.blockHistory) {
            if (stats.blockHistory[domain] > topCount) {
                topCount = stats.blockHistory[domain];
                topDomain = domain;
            }
        }

        if (topCount > 0) {
            document.getElementById('topBlockedDomain').textContent = `${topDomain} (${topCount} lần)`;
        } else {
            document.getElementById('topBlockedDomain').textContent = '-';
        }
    });
}

function resetStatistics() {
    const emptyStats = {
        blockCount: 0,
        savedTime: 0,
        blockHistory: {}
    };

    chrome.storage.local.set({ statistics: emptyStats }, function () {
        loadStatistics();
    });
}

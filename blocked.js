/**
 * Working Time - blocked.js
 * Trang chặn nội bộ: hiển thị thông điệp ngẫu nhiên, cập nhật thống kê,
 * và hiển thị link quay lại trang gốc khi hết giờ chặn.
 */

const messages = [
    "LÀM VIỆC THÔI NÀO!!!",
    "Hãy kỉ luật một chút!",
    "Tuyệt vời!! Bạn đã bị chặn!",
    "Bạn đã hoàn thành mọi công việc của mình chưa?",
    "Oi oi oi! Không sao nhãng trong giờ làm việc!",
    "Làm hết sức, chơi hết mình!",
    "Bạn bị chặn! Hãy tập trung làm việc chứ không phải buông thả bản thân.",
    "Thời gian làm việc đang trôi qua, đừng lãng phí!",
    "Mỗi phút tập trung là một bước tiến đến thành công!",
    "Khoan đã! Công việc của bạn vẫn đang chờ đấy!",
    "Xin lỗi nhé, bây giờ là thời gian làm việc rồi!",
    "Bạn có chắc mình đã hoàn thành mọi nhiệm vụ hôm nay?",
    "Chú tâm vào công việc, mạng xã hội có thể đợi!",
    "Giờ không phải lúc lướt web, hãy tập trung nào!",
    "Hãy nhớ rằng, bạn đang ở đây để hoàn thành công việc!",
    "Bạn đang tìm gì vậy? Công việc đang chờ đấy!",
    "Thành công không đến từ việc lướt web giải trí đâu!",
    "Đừng để ngày hôm nay trôi qua mà không làm được gì!",
    "Tập trung! Năng suất của bạn đang bị đe dọa bởi trang này!",
    "Mỗi giây lướt web là một giây lãng phí của cuộc đời!",
    "Hãy tự hỏi: Việc này có giúp bạn tiến bộ hơn không?",
    "Bạn có chắc là không có việc gì khác quan trọng hơn để làm?",
    "Này! Quay lại làm việc ngay!",
    "Bạn vượt qua sự cám dỗ này, bạn sẽ tự hào về bản thân!",
    "Cố lên! Sắp đến giờ nghỉ rồi, hãy hoàn thành công việc trước đã!"
];

// Hiển thị thông điệp ngẫu nhiên
document.querySelector('.message').textContent =
    messages[Math.floor(Math.random() * messages.length)];

// Đọc domain bị chặn từ query param và cập nhật thống kê
const fromDomain = new URLSearchParams(location.search).get('from');
if (fromDomain) {
    updateBlockStatistics(fromDomain);
}

// Link quay lại trang gốc.
// Cả hai nguồn redirect (DNR regexSubstitution và tab sweep) đều nối URL gốc
// dạng THÔ (không encode) — không decode để khỏi phá hỏng URL chứa %26, %C3%A9...
// Không dùng URLSearchParams: lấy toàn bộ chuỗi sau "&url=" ĐẦU TIÊN — param from
// là domain nên không thể chứa "&url=", còn URL gốc có thể chứa nó ở giữa.
// Cộng thêm location.hash: nếu URL gốc có #fragment thì trình duyệt tách nó
// khỏi search — ghép lại để link trỏ đúng URL đầy đủ.
const rawSearch = location.search + location.hash;
const urlMarker = rawSearch.indexOf('&url=');
if (urlMarker !== -1) {
    const originalUrl = rawSearch.slice(urlMarker + 5);
    if (/^https?:\/\//.test(originalUrl)) {
        const link = document.querySelector('.return-link');
        link.href = originalUrl;
        link.classList.remove('hidden');
    }
}

// Hàm cập nhật thống kê (giữ nguyên schema: blockCount, savedTime, blockHistory)
function updateBlockStatistics(domain) {
    chrome.storage.local.get({ statistics: { blockCount: 0, savedTime: 0, blockHistory: {} } }, function (result) {
        const stats = result.statistics;

        // Tăng tổng số lần bị chặn
        stats.blockCount++;

        // Tăng số lần bị chặn cho domain cụ thể
        if (!stats.blockHistory[domain]) {
            stats.blockHistory[domain] = 0;
        }
        stats.blockHistory[domain]++;

        // Tăng thời gian tiết kiệm (giả định mỗi lần chặn tiết kiệm 5 phút)
        stats.savedTime += 5;

        // Lưu lại thống kê
        chrome.storage.local.set({ statistics: stats });
    });
}

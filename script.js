/**
 * Working Time Extension - script.js
 * Version: 1.1.2
 *
 * Các chức năng chính:
 * - Quản lý danh sách trang web bị chặn
 * - Điều khiển hàng loạt (bật/tắt tất cả)
 * - Tìm kiếm trang web
 * - Thống kê sử dụng
 * - Chặn theo ngày trong tuần
 * - Import/Export cài đặt
 */

const blockForm = document.querySelector('.block-form');
const domainList = document.querySelector('.domain-list');
const domainInput = document.querySelector('.domain-input');
const startTimeInput = document.querySelector('#startTime');
const endTimeInput = document.querySelector('#endTime');

// Biến toàn cục
let canSubmit = false;
let pauseTimer = null;
let pauseEndTime = null;

// Thêm biến cho thời gian mặc định
const DEFAULT_START_TIME = '08:00';
const DEFAULT_END_TIME = '16:00';

loadBlockedDomains();

// Fill out domain by default
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    try {
        domainInput.value = tabs[0].url.match(/https?:\/\/(?:www\.)?([^/]+)/)[1]
        validateInput();
    } catch (e) {
        domainInput.value = '';
    }
});

// Sự kiện khi gửi form
blockForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!canSubmit) return;

    const domain = domainInput.value;
    // Sử dụng thời gian từ input
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;

    if (!startTime || !endTime) {
        alert('Vui lòng chọn thời gian bắt đầu và kết thúc');
        return;
    }

    // Cho phép cả rule overnight (ví dụ: 22:00 - 06:00)
    // Logic xử lý overnight đã được implement trong isBlockedTime()

    addBlockedDomain(domain);

    // Reset form and explicitly reload after a short delay
    setTimeout(() => {
        startTimeInput.value = DEFAULT_START_TIME;
        endTimeInput.value = DEFAULT_END_TIME;
        domainInput.value = '';
        canSubmit = false;
        domainInput.className = 'domain-input';
        loadBlockedDomains();
    }, 100); // Small delay
});

// Real-time / live form validation
domainInput.addEventListener('click', validateInput);
domainInput.addEventListener('input', validateInput);
domainInput.addEventListener('blur', () => {
    if (!domainInput.value) {
        domainInput.className = 'domain-input';
    }
})

// Detect if buttons on list of domain items
domainList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        let domainElement = e.target.parentElement
        removeBlockedDomain(domainElement.querySelector('li').textContent)

        domainElement.remove();
    }

    if (e.target.parentElement.classList.contains('toggle')) {
        chrome.storage.local.get({ blockedDomains: {} }, function (result) {
            let blockedDomains = result.blockedDomains;
            blockedDomains[e.target.parentElement.parentElement.querySelector('li').textContent].enabled = e.target.checked;
            let dataToSave = Object.assign({}, blockedDomains); // create a copy of the object
            chrome.storage.local.set({ blockedDomains: dataToSave });
        });
    }
});

// ----- FUNCTIONS -----

// Local storage domain functions
function addBlockedDomain(domain) {
    if (!domain) return;
    
    // Lấy các ngày được chọn
    const weekdays = [];
    document.querySelectorAll('input[name="weekday"]:checked').forEach(checkbox => {
        weekdays.push(parseInt(checkbox.value));
    });
    
    chrome.storage.local.get({ blockedDomains: {} }, function (result) {
        let blockedDomains = result.blockedDomains;
        blockedDomains[domain] = {
            enabled: true,
            startTime: startTimeInput.value,
            endTime: endTimeInput.value,
            weekdays: weekdays.length > 0 ? weekdays : [1, 2, 3, 4, 5, 6, 0] // Nếu không chọn ngày nào, áp dụng tất cả các ngày
        };
        
        chrome.storage.local.set({ blockedDomains: blockedDomains }, function() {
            loadBlockedDomains();
        });
    });
}

function loadBlockedDomains() {
    chrome.storage.local.get({ blockedDomains: {} }, function (result) {
        let blockedDomains = result.blockedDomains;
        domainList.innerHTML = '';
        
        for (let domain in blockedDomains) {
            const domainData = blockedDomains[domain];

            // Hiển thị ngày trong tuần
            const weekdayDisplay = getWeekdayDisplayText(domainData.weekdays || [1, 2, 3, 4, 5, 6, 0]);

            let domainElement = document.createElement('div');
            domainElement.className = 'domain';
            domainElement.innerHTML = `
                <label class="toggle">
                    <input type="checkbox" ${domainData.enabled ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
                <li>${domain}</li>
                <div class="time-display" data-domain="${domain}">
                    <input type="time" class="edit-start-time" value="${domainData.startTime}">
                    -
                    <input type="time" class="edit-end-time" value="${domainData.endTime}">
                    <span class="weekday-display" title="${weekdayDisplay}">${getShortWeekdayDisplay(domainData.weekdays)}</span>
                </div>
                <button class="delete-btn">×</button>`;
            
            domainList.appendChild(domainElement);
            
            // Thêm event listeners cho input thời gian
            const timeInputs = domainElement.querySelectorAll('input[type="time"]');
            timeInputs.forEach(input => {
                input.addEventListener('change', function() {
                    const parentDiv = this.closest('.time-display');
                    const domain = parentDiv.dataset.domain;
                    const startTime = parentDiv.querySelector('.edit-start-time').value;
                    const endTime = parentDiv.querySelector('.edit-end-time').value;
                    
                    chrome.storage.local.get({ blockedDomains: {} }, function(result) {
                        let blockedDomains = result.blockedDomains;
                        blockedDomains[domain].startTime = startTime;
                        blockedDomains[domain].endTime = endTime;
                        chrome.storage.local.set({ blockedDomains: blockedDomains });
                    });
                });
            });
        }
        
        addEventListeners();
        
        // Thêm sự kiện sau khi tải xong
        updateBatchToggleButtonStatus();
        if (pauseEndTime) {
            updatePauseStatus();
        }
    });
}

function removeBlockedDomain(domain) {
    chrome.storage.local.get({ blockedDomains: {} }, function (result) {
        let blockedDomains = result.blockedDomains;
        delete blockedDomains[domain];
        let dataToSave = Object.assign({}, blockedDomains); // create a copy of the object
        chrome.storage.local.set({ blockedDomains: dataToSave });
    });
}

// VALIDATION FUNCTIONS
function validateInput() {
    domainInput.className = 'domain-input';

    if (domainInput.value === '') {
        domainInput.classList.add('domain-input-valid');
        return;
    }

    if (validURL(domainInput.value)) {
        domainInput.classList.add('domain-input-valid');
        canSubmit = true;
    } else {
        domainInput.classList.add('domain-input-invalid');
        canSubmit = false;
    }
}

function validURL(str) {
    pattern = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
    return !!pattern.test(str);
}

// Các hàm xử lý thời gian
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function isBlockedTime(domainData) {
    if (!domainData || !domainData.startTime || !domainData.endTime) {
        return false;
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Chủ Nhật, 1-6 = Thứ 2 đến Thứ 7

    // Kiểm tra ngày trong tuần
    // Nếu weekdays không tồn tại hoặc là mảng rỗng, mặc định áp dụng cho tất cả các ngày
    if (domainData.weekdays && domainData.weekdays.length > 0 && !domainData.weekdays.includes(currentDay)) {
        return false; // Không áp dụng vào ngày này
    }

    const currentTime = now.getHours().toString().padStart(2, '0') + ':' +
                     now.getMinutes().toString().padStart(2, '0');

    const currentMinutes = timeToMinutes(currentTime);
    const startMinutes = timeToMinutes(domainData.startTime);
    const endMinutes = timeToMinutes(domainData.endTime);

    // Xử lý cả rule trong ngày (08:00-17:00) và rule overnight (22:00-06:00)
    if (startMinutes <= endMinutes) {
        // Rule trong cùng ngày
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
        // Rule qua đêm (ví dụ: 22:00 - 06:00)
        return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
}

// Kiểm tra và cập nhật trạng thái chặn
// Lưu ý: enabled flag giờ đại diện cho lựa chọn của người dùng, không tự động thay đổi
// Việc kiểm tra thời gian được thực hiện trong content.js
function updateBlockStatus() {
    // Hàm này giữ lại để tương thích, nhưng không còn tự động thay đổi enabled flag
    // Người dùng có toàn quyền kiểm soát việc bật/tắt các rule
    chrome.storage.local.get({ blockedDomains: {} }, function(result) {
        // Chỉ reload UI để cập nhật hiển thị nếu cần
        loadBlockedDomains();
    });
}

// Thêm hàm addEventListeners
function addEventListeners() {
    // Xử lý nút delete
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const domainElement = this.closest('.domain');
            const domain = domainElement.querySelector('li').textContent;
            
            chrome.storage.local.get({ blockedDomains: {} }, function(result) {
                let blockedDomains = result.blockedDomains;
                delete blockedDomains[domain];
                chrome.storage.local.set({ blockedDomains: blockedDomains }, function() {
                    domainElement.remove();
                });
            });
        });
    });

    // Xử lý toggle switches
    document.querySelectorAll('.toggle input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const domainElement = this.closest('.domain');
            const domain = domainElement.querySelector('li').textContent;
            
            chrome.storage.local.get({ blockedDomains: {} }, function(result) {
                let blockedDomains = result.blockedDomains;
                blockedDomains[domain].enabled = checkbox.checked;
                chrome.storage.local.set({ blockedDomains: blockedDomains });
            });
        });
    });
    
    // Thiết lập điều khiển hàng loạt
    setupBatchControls();
}

// Đảm bảo gọi loadBlockedDomains khi trang được load
document.addEventListener('DOMContentLoaded', function() {
    startTimeInput.value = DEFAULT_START_TIME;
    endTimeInput.value = DEFAULT_END_TIME;
    loadBlockedDomains();
    updateBlockStatus();
    
    // Thiết lập sự kiện cho các nút mới
    document.getElementById('exportBtn').addEventListener('click', exportSettings);
    document.getElementById('importBtn').addEventListener('click', function() {
        // Tạo input file ẩn
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.classList.add('import-file-input');
        document.body.appendChild(fileInput);
        
        // Thêm sự kiện khi chọn file
        fileInput.addEventListener('change', importSettings);
        
        // Kích hoạt click để mở hộp thoại chọn file
        fileInput.click();
        
        // Xóa input sau khi sử dụng
        setTimeout(() => {
            document.body.removeChild(fileInput);
        }, 5000);
    });
    
    // Thêm sự kiện cho thanh tìm kiếm
    document.getElementById('searchInput').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        searchDomains(searchTerm);
    });
    
    // Thêm sự kiện cho nút hiển thị thống kê
    document.getElementById('toggleStatsBtn').addEventListener('click', function() {
        const statsContent = document.getElementById('statisticsContent');
        statsContent.classList.toggle('hidden');
        this.textContent = statsContent.classList.contains('hidden') ? 
            'Hiển thị thống kê' : 'Ẩn thống kê';
        
        // Tải thống kê nếu đang hiển thị
        if (!statsContent.classList.contains('hidden')) {
            loadStatistics();
        }
    });
    
    // Thêm sự kiện cho nút đặt lại thống kê
    document.getElementById('resetStatsBtn').addEventListener('click', function() {
        if (confirm('Bạn có chắc muốn đặt lại tất cả thống kê?')) {
            resetStatistics();
        }
    });
    
    // Kiểm tra interval
    setInterval(updateBlockStatus, 30000); // Kiểm tra mỗi 30 giây
    setInterval(function() {
        if (pauseEndTime) {
            updatePauseStatus();
        }
    }, 60000); // Cập nhật hiển thị thời gian còn lại mỗi phút
});

// ----- TÌM KIẾM -----

// Hàm tìm kiếm trang web
function searchDomains(searchTerm) {
    const domainElements = document.querySelectorAll('.domain');
    
    domainElements.forEach(domainElement => {
        const domainName = domainElement.querySelector('li').textContent.toLowerCase();
        
        if (domainName.includes(searchTerm)) {
            domainElement.classList.remove('domain-hidden');
        } else {
            domainElement.classList.add('domain-hidden');
        }
    });
}

// ----- ĐIỀU KHIỂN HÀNG LOẠT -----

// Thiết lập điều khiển hàng loạt
function setupBatchControls() {
    const batchToggleBtn = document.getElementById('batchToggleBtn');
    const pauseDurationContainer = document.getElementById('pauseDurationContainer');
    const pauseDuration = document.getElementById('pauseDuration');
    const applyPauseBtn = document.getElementById('applyPauseBtn');
    const cancelPauseBtn = document.getElementById('cancelPauseBtn');
    
    // Hiển thị số lượng trang web đang được chặn
    updateBatchToggleButtonStatus();
    
    // Event listener cho nút bật/tắt tất cả
    batchToggleBtn.addEventListener('click', function() {
        chrome.storage.local.get({ blockedDomains: {} }, function(result) {
            const blockedDomains = result.blockedDomains;
            const activeCount = getActiveDomainsCount(blockedDomains);
            const totalCount = Object.keys(blockedDomains).length;
            
            // Sửa lại logic: Nếu tất cả đang tắt hoặc một phần đang tắt -> bật tất cả ngay lập tức
            if (activeCount < totalCount) {
                toggleAllDomains(true);
            } else {
                // Nếu tất cả đang bật -> hiển thị tùy chọn tạm dừng
                pauseDurationContainer.classList.remove('hidden');
            }
        });
    });
    
    // Áp dụng tạm dừng
    applyPauseBtn.addEventListener('click', function() {
        const duration = parseInt(pauseDuration.value);
        if (isNaN(duration) || duration < 5 || duration > 120) {
            alert('Vui lòng nhập thời gian hợp lệ (5-120 phút)');
            return;
        }
        
        // Tắt tất cả các trang web sau khoảng thời gian người dùng chọn
        toggleAllDomains(false);
        
        // Thiết lập hẹn giờ bật lại tự động
        const endTime = new Date();
        endTime.setMinutes(endTime.getMinutes() + duration);
        pauseEndTime = endTime.getTime();
        
        // Lưu thời gian kết thúc tạm dừng
        chrome.storage.local.set({ pauseEndTime: pauseEndTime });
        
        // Cập nhật giao diện
        updatePauseStatus();
        pauseDurationContainer.classList.add('hidden');
        
        // Thiết lập hẹn giờ
        setPauseTimer(duration);
    });
    
    // Hủy tạm dừng
    cancelPauseBtn.addEventListener('click', function() {
        pauseDurationContainer.classList.add('hidden');
        // Không thay đổi trạng thái các domain
    });
    
    // Kiểm tra và khôi phục trạng thái tạm dừng nếu có
    chrome.storage.local.get({ pauseEndTime: null }, function(result) {
        if (result.pauseEndTime) {
            const now = new Date().getTime();
            if (result.pauseEndTime > now) {
                // Tính toán thời gian còn lại
                const remainingMinutes = Math.ceil((result.pauseEndTime - now) / 60000);
                pauseEndTime = result.pauseEndTime;
                
                // Cập nhật giao diện
                updatePauseStatus();
                
                // Thiết lập hẹn giờ
                setPauseTimer(remainingMinutes);
            } else {
                // Đã hết thời gian tạm dừng, xóa
                chrome.storage.local.remove('pauseEndTime');
            }
        }
    });
}

// Bật/tắt tất cả các trang web
function toggleAllDomains(enable) {
    chrome.storage.local.get({ blockedDomains: {} }, function(result) {
        let blockedDomains = result.blockedDomains;
        let updated = false;
        
        for (let domain in blockedDomains) {
            if (blockedDomains[domain].enabled !== enable) {
                blockedDomains[domain].enabled = enable;
                updated = true;
            }
        }
        
        if (updated) {
            chrome.storage.local.set({ blockedDomains: blockedDomains }, function() {
                loadBlockedDomains(); // Tải lại danh sách để cập nhật UI
                updateBatchToggleButtonStatus();
            });
        }
    });
}

// Thiết lập hẹn giờ tạm dừng
function setPauseTimer(minutes) {
    // Xóa hẹn giờ cũ nếu có
    if (pauseTimer) {
        clearTimeout(pauseTimer);
    }
    
    // Thiết lập hẹn giờ mới
    pauseTimer = setTimeout(function() {
        toggleAllDomains(true); // Bật lại tất cả khi hết thời gian
        chrome.storage.local.remove('pauseEndTime');
        pauseEndTime = null;
        updatePauseStatus();
    }, minutes * 60 * 1000);
}

// Cập nhật trạng thái nút bật/tắt tất cả
function updateBatchToggleButtonStatus() {
    chrome.storage.local.get({ blockedDomains: {} }, function(result) {
        const blockedDomains = result.blockedDomains;
        const activeCount = getActiveDomainsCount(blockedDomains);
        const totalCount = Object.keys(blockedDomains).length;
        
        const batchToggleBtn = document.getElementById('batchToggleBtn');
        if (activeCount === 0) {
            batchToggleBtn.textContent = 'Bật tất cả';
            batchToggleBtn.classList.remove('all-active');
        } else if (activeCount === totalCount) {
            batchToggleBtn.textContent = 'Tắt tất cả';
            batchToggleBtn.classList.add('all-active');
        } else {
            batchToggleBtn.textContent = `Bật tất cả (${activeCount}/${totalCount})`;
            batchToggleBtn.classList.remove('all-active');
        }
    });
}

// Đếm số lượng trang web đang được kích hoạt
function getActiveDomainsCount(blockedDomains) {
    let count = 0;
    for (let domain in blockedDomains) {
        if (blockedDomains[domain].enabled) {
            count++;
        }
    }
    return count;
}

// Cập nhật hiển thị trạng thái tạm dừng
function updatePauseStatus() {
    if (!pauseEndTime) {
        return;
    }
    
    const now = new Date().getTime();
    if (pauseEndTime > now) {
        const remainingMinutes = Math.ceil((pauseEndTime - now) / 60000);
        const batchToggleBtn = document.getElementById('batchToggleBtn');
        batchToggleBtn.textContent = `Tạm dừng (còn ${remainingMinutes} phút)`;
        batchToggleBtn.classList.add('paused');
    } else {
        const batchToggleBtn = document.getElementById('batchToggleBtn');
        batchToggleBtn.classList.remove('paused');
        updateBatchToggleButtonStatus();
    }
}

// ----- THỐNG KÊ SỬ DỤNG -----

// Hàm tải thống kê
function loadStatistics() {
    chrome.storage.local.get({ statistics: { blockCount: 0, savedTime: 0, blockHistory: {} } }, function(result) {
        const stats = result.statistics;
        
        // Hiển thị số lần bị chặn
        document.getElementById('blockCount').textContent = stats.blockCount.toLocaleString();
        
        // Hiển thị thời gian tiết kiệm (chuyển từ phút sang giờ nếu lớn)
        const savedTime = stats.savedTime;
        if (savedTime >= 60) {
            const hours = Math.floor(savedTime / 60);
            const minutes = savedTime % 60;
            document.getElementById('savedTime').textContent = `${hours} giờ ${minutes} phút`;
        } else {
            document.getElementById('savedTime').textContent = `${savedTime} phút`;
        }
        
        // Tìm trang web bị chặn nhiều nhất
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
        }
    });
}

// Hàm đặt lại thống kê
function resetStatistics() {
    const emptyStats = {
        blockCount: 0,
        savedTime: 0,
        blockHistory: {}
    };
    
    chrome.storage.local.set({ statistics: emptyStats }, function() {
        loadStatistics(); // Tải lại thống kê sau khi đặt lại
    });
}

// ----- IMPORT/EXPORT CÀI ĐẶT -----

// Hàm xuất cài đặt
function exportSettings() {
    chrome.storage.local.get(null, function(data) {
        // Tạo đối tượng cài đặt để xuất
        const exportData = {
            blockedDomains: data.blockedDomains || {},
            statistics: data.statistics || { blockCount: 0, savedTime: 0, blockHistory: {} },
            exportDate: new Date().toISOString()
        };
        
        // Chuyển đổi thành chuỗi JSON
        const jsonString = JSON.stringify(exportData, null, 2);
        
        // Tạo Blob và tạo URL tải xuống
        const blob = new Blob([jsonString], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        // Tạo liên kết tải xuống và kích hoạt
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `working-time-backup-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Dọn dẹp
        setTimeout(() => {
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
        }, 100);
    });
}

// Hàm nhập cài đặt
function importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Kiểm tra dữ liệu hợp lệ
            if (!data.blockedDomains) {
                throw new Error('Dữ liệu không hợp lệ: thiếu thông tin blockedDomains');
            }
            
            // Xác nhận nhập
            if (confirm(`Bạn có chắc muốn nhập dữ liệu này? Tất cả cài đặt hiện tại sẽ bị ghi đè.`)) {
                // Lưu vào storage
                chrome.storage.local.set({
                    blockedDomains: data.blockedDomains,
                    statistics: data.statistics || { blockCount: 0, savedTime: 0, blockHistory: {} }
                }, function() {
                    alert('Nhập dữ liệu thành công!');
                    // Tải lại giao diện
                    loadBlockedDomains();
                });
            }
        } catch (error) {
            alert(`Lỗi khi nhập dữ liệu: ${error.message}`);
        }
    };
    reader.readAsText(file);
}

// ----- HÀM TIỆN ÍCH -----

// Hàm tạo văn bản hiển thị ngày trong tuần
function getWeekdayDisplayText(weekdays) {
    if (!weekdays || weekdays.length === 0) {
        return "Tất cả các ngày";
    }
    const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return weekdays.map(day => dayNames[day]).join(', ');
}

// Hàm tạo văn bản ngắn hiển thị ngày trong tuần
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

// Thiết lập interval để kiểm tra định kỳ
setInterval(updateBlockStatus, 30000); // Kiểm tra mỗi 30 giây
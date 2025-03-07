const blockForm = document.querySelector('.block-form');
const domainList = document.querySelector('.domain-list');
const domainInput = document.querySelector('.domain-input');
const startTimeInput = document.querySelector('#startTime');
const endTimeInput = document.querySelector('#endTime');

let canSubmit = false;

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

	if (startTime >= endTime) {
		alert('Thời gian kết thúc phải sau thời gian bắt đầu');
		return;
	}

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

// Local storage domain functions

function addBlockedDomain(domain) {
	if (!domain) return;
	
	chrome.storage.local.get({ blockedDomains: {} }, function (result) {
		let blockedDomains = result.blockedDomains;
		blockedDomains[domain] = {
			enabled: true,
			startTime: startTimeInput.value,
			endTime: endTimeInput.value
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
			// Kiểm tra xem domain có đang trong thời gian chặn không
			const isCurrentlyBlocked = isBlockedTime(domainData);
			
			let domainElement = document.createElement('div');
			domainElement.className = 'domain';
			domainElement.innerHTML = `
				<label class="toggle">
					<input type="checkbox" ${isCurrentlyBlocked && domainData.enabled ? 'checked' : ''}>
					<span class="slider"></span>
				</label>
				<li>${domain}</li>
				<div class="time-display" data-domain="${domain}">
					<input type="time" class="edit-start-time" value="${domainData.startTime}">
					-
					<input type="time" class="edit-end-time" value="${domainData.endTime}">
				</div>
				<button class="delete-btn">&#10006;</button>`;
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
	if (!domainData) {
		return false;
	}

	const now = new Date();
	const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
					   now.getMinutes().toString().padStart(2, '0');
	
	const currentMinutes = timeToMinutes(currentTime);
	const startMinutes = timeToMinutes(domainData.startTime);
	const endMinutes = timeToMinutes(domainData.endTime);

	if (startMinutes <= endMinutes) {
		return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
	} else {
		return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
	}
}

// Kiểm tra và cập nhật trạng thái chặn
function updateBlockStatus() {
	chrome.storage.local.get({ blockedDomains: {} }, function(result) {
		const blockedDomains = result.blockedDomains;
		let updated = false;

		for (let domain in blockedDomains) {
			const domainData = blockedDomains[domain];
			const currentlyBlocked = isBlockedTime(domainData);

			// Nếu đang trong thời gian chặn nhưng chưa bật, hãy bật
			if (currentlyBlocked && !domainData.enabled) {
				blockedDomains[domain].enabled = true;
				updated = true;
			}
			// Nếu không còn trong thời gian chặn nhưng đang bật, hãy tắt
			else if (!currentlyBlocked && domainData.enabled) {
				blockedDomains[domain].enabled = false;
				updated = true;
			}
		}

		if (updated) {
			chrome.storage.local.set({ blockedDomains: blockedDomains }, function() {
				loadBlockedDomains(); // Reload danh sách để cập nhật UI
			});
		}
	});
}

// Thiết lập interval để kiểm tra định kỳ
setInterval(updateBlockStatus, 30000); // Kiểm tra mỗi 30 giây

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
}

// Đảm bảo gọi loadBlockedDomains khi trang được load
document.addEventListener('DOMContentLoaded', function() {
	startTimeInput.value = DEFAULT_START_TIME;
	endTimeInput.value = DEFAULT_END_TIME;
	loadBlockedDomains();
	updateBlockStatus();
});

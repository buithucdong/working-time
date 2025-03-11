document.addEventListener("DOMContentLoaded", fireContentLoadedEvent, false);

function fireContentLoadedEvent() {
	// Replace the page content with a message
	chrome.storage.local.get({ blockedDomains: {} }, function (result) {
	  let blockedDomains = result.blockedDomains;
  
	  const hostname = window.location.hostname;
	  const hostnameWithoutSubdomain = hostname.replace(/^www\./, ""); // remove 'www' subdomain, if present
	  const blocked =
		blockedDomains[hostname]?.enabled ||
		blockedDomains[hostnameWithoutSubdomain]?.enabled;
	  
	  if (blocked) {
		// Cập nhật thống kê khi trang bị chặn
		updateBlockStatistics(hostname);
		
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
  
		const randomMessage =
		  messages[Math.floor(Math.random() * messages.length)];
  
		document.documentElement.innerHTML = `<!DOCTYPE html>
			  <html lang="en">
  
			  <head>
				  <meta charset="UTF-8">
				  <meta name="viewport" content="width=device-width, initial-scale=1.0">
				  <title>Working Time!</title>
				  <style>
					  @import url('https://fonts.googleapis.com/css2?family=Baloo+Bhai+2:wght@700&display=swap');
  
					  * {
						  padding: 0;
						  margin: 0;
						  font-family: 'Baloo Bhai 2', cursive;
					  }
  
					  h1 {
						  font-size: 52px;
						  color: #000;
  
						  animation: 1s ease-in-out 0s 1 fadeIntoView;
					  }
  
					  .container {
						  display: flex;
						  flex-wrap: wrap;
						  width: 100%;
						  height: 100vh;
						  background-color: #ffd300;
						  justify-content: center;
						  align-items: center;
						  flex-direction: column;
					  }
  
					  @keyframes fadeIntoView {
						  0% {
							  opacity: 0;
						  }
						  100% {
							  opacity: 1;
						  }
					  }
  
					  .buy-me-a-coffee {
						  position: absolute;
						  bottom: 40px;
					  }
				  </style>
  
			  </head>
			  <body>
				  <div class="container">
				  <h1 class="message">${randomMessage}</h1>
				  <a class="buy-me-a-coffee" href="https://www.buymeacoffee.com/buithucdong" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy me a coffee" style="height: 60px !important;width: 217px !important;" ></a>
				  </div>
			  </body>
			  </html>`;
	  }
	});
  }
  
  // Hàm cập nhật thống kê
  function updateBlockStatistics(domain) {
	chrome.storage.local.get({ statistics: { blockCount: 0, savedTime: 0, blockHistory: {} } }, function(result) {
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
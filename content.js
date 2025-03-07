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
      const messages = [
        "LÀM VIỆC THÔI NÀO!!!",
        "Hãy kỉ luật một chút!",
        "Tuyệt vời!! Bạn đã bị chặn!",
        "Bạn đã hoàn thành mọi công việc của mình chưa?",
        "Oi oi oi! Không sao nhãng trong giờ làm việc!",
        "Làm hết sức, chơi hết mình!",
        "Bạn bị chặn! Hãy tập trung làm việc chứ không phải buông thả bản thân.",
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

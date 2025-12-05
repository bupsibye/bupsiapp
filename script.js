const tg = window.Telegram.WebApp;
tg.ready();

const user = tg.initDataUnsafe.user;
const startExchangeBtn = document.getElementById("start-exchange-by-username");

if (startExchangeBtn) {
  startExchangeBtn.addEventListener("click", async () => {
    const targetUsername = prompt("Введите username пользователя:", "").trim();
    if (!targetUsername) return alert("Введите username");

    const fromUsername = user.username || `user${user.id}`;

    const response = await fetch('https://bupsiserver.onrender.com/api/start-exchange-by-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromId: user.id, fromUsername, targetUsername })
    });

    const result = await response.json();
    alert(result.success ? `Запрос отправлен @${targetUsername}` : "Ошибка: " + result.error);
  });
}

// === Инициализация сессии обмена ===
async function initExchangeSession() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get("startapp");
  if (!sessionId?.startsWith("ex_")) return;

  const res = await fetch(`https://bupsiserver.onrender.com/api/session/${sessionId}`);
  const session = await res.json();
  if (session.error) return;

  const exchangeContainer = document.getElementById("exchange");
  if (!exchangeContainer) return;

  exchangeContainer.innerHTML = `
    <h3>🔄 Обмен с @${session.fromId === user.id ? session.toId : session.fromUsername}</h3>
    <input type="text" id="gift-input" placeholder="Ваш подарок">
    <button id="send-gift-btn" class="btn">Отправить</button>
    <div id="status">Ожидаем подарок...</div>
  `;

  document.getElementById("send-gift-btn").addEventListener("click", async () => {
    const gift = document.getElementById("gift-input").value.trim();
    if (!gift) return alert("Введите подарок");

    await fetch('https://bupsiserver.onrender.com/api/exchange/add-gift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userId: user.id, giftName: gift })
    });

    document.getElementById("status").textContent = "Подарок отправлен!";
    document.getElementById("send-gift-btn").disabled = true;
  });
}

initExchangeSession();

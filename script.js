const tg = window.Telegram.WebApp;
tg.ready();

// === ЭЛЕМЕНТЫ ===
const tabs = document.querySelectorAll(".tab");
const mainContents = document.querySelectorAll(".main-content > .tab-content");
const userTab = document.getElementById("user-tab");
const inventory = document.getElementById("inventory");
const userAvatar = document.getElementById("user-avatar");
const buyStarsBtn = document.getElementById("buy-stars-btn");
const generateLinkBtn = document.getElementById("generate-exchange-link");
const exchangeLinkOutput = document.getElementById("exchange-link-output");
const userGiftsGrid = document.getElementById("user-gifts-grid");
const exchangeGiftsGrid = document.getElementById("exchange-gifts-grid");
const withdrawGiftBtn = document.getElementById("withdraw-gift-btn");
const starsCount = document.getElementById("stars-count");

let user = null;
let myGifts = JSON.parse(localStorage.getItem("myGifts") || "[]");
let stars = parseInt(localStorage.getItem("stars") || "100");

// === БАЗОВЫЙ URL БЭКА ===
const API_BASE = 'https://bupsiserver.onrender.com'; // ← ВАЖНО: Render

// === ПРИМЕНЕНИЕ ТЕМЫ ===
function applyTheme() {
  const theme = tg.themeParams;
  const dark = tg.colorScheme === 'dark';
  document.documentElement.style.setProperty('--tg-bg', theme.bg_color || (dark ? '#1a1a1a' : '#fff'));
  document.documentElement.style.setProperty('--tg-text', theme.text_color || (dark ? '#fff' : '#000'));
  document.documentElement.style.setProperty('--tg-hint', theme.hint_color || (dark ? '#999' : '#888'));
  document.documentElement.style.setProperty('--tg-accent', theme.accent_text_color || '#0088cc');
  document.documentElement.style.setProperty('--tg-secondary-bg', dark ? '#2c2c2c' : '#f0f0f0');
  document.documentElement.style.setProperty('--tg-border', dark ? '#444' : '#ddd');
}

// === ИНИЦИАЛИЗАЦИЯ ===
async function init() {
  applyTheme();

  user = tg.initDataUnsafe.user;
  if (user && user.photo_url) {
    userAvatar.src = user.photo_url;
  }

  starsCount.textContent = stars;
  renderGiftGrids();

  // === ПРОВЕРКА start_param — если Mini App запущен через ссылку ===
  const startParam = tg.initDataUnsafe.start_param;
  if (startParam) {
    if (startParam.startsWith('exchange_')) {
      // Это приглашение от друга
      const partnerId = startParam.replace('exchange_', '');
      showExchangeRequest(partnerId);
    } else {
      // Это sessionId обмена
      showExchangeSession(startParam);
    }
    return;
  }

  setupEventListeners();
}

// === ПОКАЗ ЗАПРОСА ОБМЕНА (вы получили предложение) ===
async function showExchangeRequest(partnerId) {
  document.querySelector('.main-content').innerHTML = `
    <div class="exchange-request">
      <h2>🤝 Обмен с другом</h2>
      <p>Пользователь хочет обменяться подарками с вами!</p>
      <div id="partner-gifts-grid" class="gifts-grid"></div>
      <button id="accept-exchange-btn" class="btn">Начать обмен</button>
    </div>
  `;

  renderUserGifts('partner-gifts-grid');

  document.getElementById('accept-exchange-btn').onclick = async () => {
    const selected = document.querySelector('.gift-item.selected');
    if (!selected) {
      tg.showAlert('Выберите подарок для обмена!');
      return;
    }
    const giftId = selected.dataset.giftId;

    const res = await fetch(`${API_BASE}/api/start-exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromId: user.id,
        toId: partnerId,
        myGiftId: giftId
      })
    });

    const data = await res.json();
    if (data.success) {
      tg.showAlert('Запрос отправлен! Дождитесь подтверждения.');
      tg.close();
    } else {
      tg.showAlert('Ошибка: ' + (data.error || 'Не удалось отправить запрос'));
    }
  };
}

// === ПОКАЗ СЕССИИ ОБМЕНА (выбираем свой подарок) ===
async function showExchangeSession(sessionId) {
  document.querySelector('.main-content').innerHTML = `
    <div class="exchange-session">
      <h2>🎁 Выберите свой подарок</h2>
      <div id="session-gifts-grid" class="gifts-grid"></div>
      <button id="submit-exchange-gift" class="btn">Отправить</button>
    </div>
  `;

  renderUserGifts('session-gifts-grid', 'select');

  document.getElementById('submit-exchange-gift').onclick = async () => {
    const selected = document.querySelector('.gift-item.selected');
    if (!selected) {
      tg.showAlert('Сначала выберите подарок!');
      return;
    }
    const giftId = selected.dataset.giftId;

    const res = await fetch(`${API_BASE}/api/exchange/select-gift`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userId: user.id, giftId })
    });

    const data = await res.json();
    if (data.success) {
      tg.showAlert('Подарок выбран! Ожидайте подтверждения…');
      waitForExchangeConfirmation(sessionId);
    } else {
      tg.showAlert('Ошибка: ' + data.error);
    }
  };
}

// === ОЖИДАНИЕ ПОДТВЕРЖДЕНИЯ ОТ ПАРТНЁРА ===
async function waitForExchangeConfirmation(sessionId) {
  const poll = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/session/${sessionId}`);
      const session = await res.json();
      if (session.error) return;

      if (session.partnerGiftId && session.fromConfirmed && session.toConfirmed) {
        tg.showAlert('🎉 Обмен завершён! Подарки переданы.');
        tg.close();
        return;
      }

      // Оповещение, если отклонили
      if (session.status === 'declined') {
        tg.showAlert('❌ Обмен отклонён.');
        tg.close();
        return;
      }

      setTimeout(poll, 2000);
    } catch (err) {
      setTimeout(poll, 3000);
    }
  };
  poll();
}

// === ОТРИСОВКА СЕТИ ПОДАРКОВ (с выбором) ===
function renderUserGifts(gridId, mode = 'normal') {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '';

  if (myGifts.length === 0) {
    grid.innerHTML = '<div class="gift-item empty"><span>Нет подарков</span></div>';
    return;
  }

  myGifts.forEach(gift => {
    const item = document.createElement('div');
    item.className = 'gift-item';
    item.dataset.giftId = gift.id;
    item.innerHTML = `
      <img src="https://via.placeholder.com/60/CCCCCC/999999?text=🎁" alt="Gift">
      <span>${gift.name.length > 6 ? gift.name.slice(0, 6) + "..." : gift.name}</span>
    `;

    item.onclick = () => {
      document.querySelectorAll(`#${gridId} .gift-item`).forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
    };

    grid.appendChild(item);
  });
}

// === ОТРИСОВКА ИНВЕНТАРЯ (без выбора) ===
function renderGiftGrids() {
  [userGiftsGrid, exchangeGiftsGrid].forEach(grid => {
    if (!grid) return;
    grid.innerHTML = "";

    if (myGifts.length === 0) {
      const empty = document.createElement("div");
      empty.className = "gift-item empty";
      grid.appendChild(empty);
    } else {
      myGifts.forEach(gift => {
        const item = document.createElement("div");
        item.className = "gift-item";
        item.innerHTML = `
          <img src="https://via.placeholder.com/60/CCCCCC/999999?text=🎁" alt="Gift">
          <span>${gift.name.length > 6 ? gift.name.slice(0, 6) + "..." : gift.name}</span>
        `;
        grid.appendChild(item);
      });
    }
  });
}

// === СЛУШАТЕЛИ ===
function setupEventListeners() {
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const tabId = tab.getAttribute("data-tab");

      if (tabId === "stars") {
        tg.openLink("https://spend.tg/telegram-stars", { try_instant_view: false });
        return;
      }

      tabs.forEach(t => t.classList.remove("active"));
      mainContents.forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(tabId)?.classList.add("active");
    });
  });

  userTab.addEventListener("click", () => {
    inventory.classList.toggle("active");
    if (inventory.classList.contains("active")) {
      renderGiftGrids();
    }
  });

  generateLinkBtn.addEventListener("click", () => {
    const link = `https://t.me/GiftSwapBot?startapp=exchange_${user?.id}`;
    exchangeLinkOutput.innerHTML = `
      <p>Отправьте ссылку другу:</p>
      <a href="${link}" target="_blank">${link.slice(-10)}...</a>
    `;
  });

  withdrawGiftBtn.addEventListener("click", async () => {
    if (myGifts.length === 0) {
      tg.showAlert("Нет подарков для вывода");
      return;
    }

    if (stars < 25) {
      tg.showAlert("⚠️ Недостаточно звёзд: нужно 25");
      return;
    }

    tg.showConfirm("Оплатить 25 ⭐ за вывод подарка?", async (ok) => {
      if (ok) {
        stars -= 25;
        localStorage.setItem("stars", stars);
        starsCount.textContent = stars;

        const gift = myGifts.pop();
        localStorage.setItem("myGifts", JSON.stringify(myGifts));

        renderGiftGrids();
        tg.showAlert(`🎁 "${gift.name}" отправлен в ваш чат с ботом!`);
      }
    });
  });
}

// === ЗАПУСК ===
init();

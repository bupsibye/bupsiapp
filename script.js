// Ждём полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  const tg = window.Telegram?.WebApp;
  if (!tg) {
    console.error('Telegram WebApp SDK не загружен');
    return;
  }
  tg.ready();

  // === ЭЛЕМЕНТЫ (должны быть в index.html с этими id!) ===
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

  // === ПРОВЕРКА: все ли элементы найдены ===
  console.log('✅ Элементы найдены:', {
    tabs: !!tabs.length,
    userTab: !!userTab,
    buyStarsBtn: !!buyStarsBtn,
    generateLinkBtn: !!generateLinkBtn,
    withdrawGiftBtn: !!withdrawGiftBtn,
    userGiftsGrid: !!userGiftsGrid,
    exchangeGiftsGrid: !!exchangeGiftsGrid,
    starsCount: !!starsCount,
  });

  // Если кнопки не найдены — ошибка
  if (!generateLinkBtn || !buyStarsBtn || !withdrawGiftBtn) {
    console.error('❌ Ошибка: не найдены кнопки. Проверь id в index.html');
    tg.showAlert?.('Ошибка: кнопки не загружены. Проверь console.');
    return;
  }

  // === ДАННЫЕ ===
  let user = tg.initDataUnsafe.user;
  let myGifts = JSON.parse(localStorage.getItem("myGifts") || "[]");
  let stars = parseInt(localStorage.getItem("stars") || "100");

  // === БАЗОВЫЙ URL БЭКА ===
  const API_BASE = 'https://bupsiserver.onrender.com';

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

  // === ОТРИСОВКА ПОДАРКОВ ===
  function renderGiftGrids() {
    [userGiftsGrid, exchangeGiftsGrid].forEach(grid => {
      if (!grid) return;
      grid.innerHTML = "";
      if (myGifts.length === 0) {
        grid.innerHTML = '<div class="gift-item empty"><span>Нет подарков</span></div>';
      } else {
        myGifts.forEach(gift => {
          const item = document.createElement("div");
          item.className = "gift-item";
          item.innerHTML = `<img src="https://via.placeholder.com/60/CCCCCC/999999?text=🎁"><span>${gift.name.slice(0, 6)}${gift.name.length > 6 ? '...' : ''}</span>`;
          grid.appendChild(item);
        });
      }
    });
  }

  // === СЛУШАТЕЛИ ===
  function setupEventListeners() {
    // --- Табы ---
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

    // --- Инвентарь ---
    userTab?.addEventListener("click", () => {
      inventory.classList.toggle("active");
      if (inventory.classList.contains("active")) {
        renderGiftGrids();
      }
    });

    // --- Создать ссылку ---
    generateLinkBtn.addEventListener("click", () => {
      const link = `https://t.me/GiftSwapBot?startapp=exchange_${user?.id}`;
      exchangeLinkOutput.innerHTML = `
        <p>Отправьте ссылку другу:</p>
        <a href="${link}" target="_blank">${link.slice(-10)}...</a>
      `;
    });

    // --- Вывести подарок ---
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

    // --- Купить звёзды ---
    buyStarsBtn.addEventListener("click", () => {
      tg.openLink("https://spend.tg/telegram-stars", { try_instant_view: false });
    });
  }

  // === ИНИЦИАЛИЗАЦИЯ ===
  function init() {
    applyTheme();

    if (user && user.photo_url) {
      userAvatar.src = user.photo_url;
    }

    starsCount.textContent = stars;
    renderGiftGrids();
    setupEventListeners();

    // === Обработка start_param (обмен) ===
    const startParam = tg.initDataUnsafe.start_param;
    if (startParam) {
      if (startParam.startsWith('exchange_')) {
        showExchangeRequest(startParam.replace('exchange_', ''));
      } else {
        showExchangeSession(startParam);
      }
    }
  }

  // === Функции обмена (заглушки, пока что) ===
  async function showExchangeRequest(partnerId) {
    document.querySelector('.main-content').innerHTML = `
      <div class="exchange-request">
        <h2>🤝 Обмен с другом</h2>
        <p>Пользователь хочет обменяться подарками с вами!</p>
        <div id="partner-gifts-grid" class="gifts-grid"></div>
        <button id="accept-exchange-btn" class="btn">Начать обмен</button>
      </div>
    `;
    // Здесь будет логика выбора подарка
  }

  async function showExchangeSession(sessionId) {
    document.querySelector('.main-content').innerHTML = `
      <div class="exchange-session">
        <h2>🎁 Выберите свой подарок</h2>
        <div id="session-gifts-grid" class="gifts-grid"></div>
        <button id="submit-exchange-gift" class="btn">Отправить</button>
      </div>
    `;
    // Здесь будет выбор подарка
  }

  // === ЗАПУСК ===
  init();
});

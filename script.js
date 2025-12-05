const tg = window.Telegram.WebApp;
tg.ready();

// Элементы
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
let stars = parseInt(localStorage.getItem("stars") || "100"); // тестовый баланс

// === Применение темы ===
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

// === Инициализация ===
function init() {
  applyTheme();

  user = tg.initDataUnsafe.user;
  if (user && user.photo_url) {
    userAvatar.src = user.photo_url;
  }

  // Показываем баланс звёзд
  starsCount.textContent = stars;

  renderGiftGrids();
  setupEventListeners();
}

// === Отрисовка сетки подарков ===
function renderGiftGrids() {
  [userGiftsGrid, exchangeGiftsGrid].forEach(grid => {
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

// === Слушатели ===
function setupEventListeners() {
  // Переключение вкладок
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

  // Клик по аватару — инвентарь
  userTab.addEventListener("click", () => {
    inventory.classList.toggle("active");
    if (inventory.classList.contains("active")) {
      renderGiftGrids();
    }
  });

  // Генерация ссылки
  generateLinkBtn.addEventListener("click", () => {
    const link = `https://t.me/YourBotNameBot?startapp=exchange_${user?.id}`;
    exchangeLinkOutput.innerHTML = `
      <p>Отправьте ссылку другу:</p>
      <a href="${link}" target="_blank">${link.slice(-10)}...</a>
    `;
  });

  // Вывод подарка
  withdrawGiftBtn.addEventListener("click", () => {
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

init();

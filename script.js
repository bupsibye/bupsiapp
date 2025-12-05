// === Инициализация Telegram WebApp ===
const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  console.log("Telegram WebApp готов");
} else {
  console.error("Telegram WebApp не доступен. Открой в Telegram.");
}

// === Применение темы ===
function applyTheme() {
  if (!tg) return;

  const theme = tg.themeParams;
  const dark = tg.colorScheme === 'dark';
  document.documentElement.style.setProperty('--tg-bg', theme.bg_color || (dark ? '#1a1a1a' : '#fff'));
  document.documentElement.style.setProperty('--tg-text', theme.text_color || (dark ? '#fff' : '#000'));
  document.documentElement.style.setProperty('--tg-hint', theme.hint_color || (dark ? '#999' : '#888'));
  document.documentElement.style.setProperty('--tg-accent', theme.accent_text_color || '#0088cc');
  document.documentElement.style.setProperty('--tg-secondary-bg', dark ? '#2c2c2c' : '#f0f0f0');
  document.documentElement.style.setProperty('--tg-border', dark ? '#444' : '#ddd');
}
applyTheme();

// === Элементы ===
const user = tg?.initDataUnsafe?.user || { id: 123456789, username: "demo_user", photo_url: "https://via.placeholder.com/50" };
const starsCount = document.getElementById("stars-count");

// === Отображение пользователя в профиле ===
document.getElementById("user-id").textContent = user.id;
document.getElementById("user-username").textContent = user.username || "не задан";

const avatar = document.getElementById("user-avatar");
if (user.photo_url) {
  avatar.src = user.photo_url;
} else {
  avatar.src = `https://ui-avatars.com/api/?name=${user.first_name || 'User'}&background=random`;
}

// === Переключение вкладок сверху ===
document.querySelectorAll(".tab-btn").forEach(button => {
  if (!button) return;

  button.addEventListener("click", () => {
    console.log("Кнопка нажата:", button.id);

    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    button.classList.add("active");

    if (button.id === "buy-stars-top") {
      window.open('https://spend.tg/telegram-stars', '_blank');
      return;
    }

    const tabId = button.id.replace("tab-", "");
    const tabContent = document.getElementById(tabId);
    if (tabContent) tabContent.classList.add("active");
  });
});

// === Загрузка баланса звёзд ===
async function loadStars() {
  if (!starsCount) return;

  try {
    const res = await fetch('https://bupsiserver.onrender.com/api/stars/' + user.id);
    const data = await res.json();
    starsCount.textContent = data.stars || 0;
  } catch (err) {
    console.error("Ошибка загрузки баланса", err);
    starsCount.textContent = "—";
  }
}
loadStars();

// === Покупка в магазине ===
document.querySelectorAll(".shop-item-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    const item = {
      name: btn.dataset.name,
      price: parseInt(btn.dataset.price)
    };

    try {
      const res = await fetch('https://bupsiserver.onrender.com/api/buy-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, item })
      });

      const result = await res.json();
      if (result.success) {
        tg?.showAlert?.(`Куплено: ${item.name}!`);
        loadStars();
      } else {
        tg?.showAlert?.("Ошибка: " + result.error);
      }
    } catch (err) {
      tg?.showAlert?.("Не удалось соединиться с сервером");
    }
  });
});

// === Начать обмен ===
const startExchangeBtn = document.getElementById("start-exchange-by-username");
if (startExchangeBtn) {
  startExchangeBtn.addEventListener("click", async () => {
    const targetUsername = prompt("Введите username:", "").trim();
    if (!targetUsername) return tg?.showAlert?.("Введите username");

    try {
      const res = await fetch('https://bupsiserver.onrender.com/api/start-exchange-by-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromId: user.id,
          fromUsername: user.username || `user${user.id}`,
          targetUsername
        })
      });

      const result = await res.json();
      tg?.showAlert?.(result.success ? `Запрос отправлен @${targetUsername}` : "Ошибка: " + result.error);
    } catch (err) {
      tg?.showAlert?.("Ошибка соединения с сервером");
    }
  });
}

// === Вторичные вкладки (в профиле) ===
document.querySelectorAll(".tabs-secondary button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tabs-secondary button").forEach(b => b.classList.remove("tab-active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    btn.classList.add("tab-active");
    document.getElementById(btn.getAttribute("data-tab")).classList.add("active");
  });
});

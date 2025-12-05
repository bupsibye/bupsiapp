// === Инициализация Telegram WebApp ===
const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  tg.MainButton.setText("Открыть профиль");
} else {
  console.warn("⚠️ Telegram WebApp SDK не загружен. Добавьте <script src='https://telegram.org/js/telegram-web-app.js'></script>");
}

// === Применение темы ===
function applyTheme() {
  const theme = tg?.themeParams || {};
  const dark = tg?.colorScheme === 'dark';
  document.documentElement.style.setProperty('--tg-bg', theme.bg_color || (dark ? '#1a1a1a' : '#fff'));
  document.documentElement.style.setProperty('--tg-text', theme.text_color || (dark ? '#fff' : '#000'));
  document.documentElement.style.setProperty('--tg-hint', theme.hint_color || (dark ? '#999' : '#888'));
  document.documentElement.style.setProperty('--tg-accent', theme.accent_text_color || '#0088cc');
  document.documentElement.style.setProperty('--tg-secondary-bg', dark ? '#2c2c2c' : '#f0f0f0');
  document.documentElement.style.setProperty('--tg-border', dark ? '#444' : '#ddd');
}
applyTheme();

// === Получение пользователя ===
let user = null;

try {
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    user = tg.initDataUnsafe.user;
    console.log("✅ Пользователь получен:", user);
  } else {
    console.warn("❌ initData не содержит user. Откройте через кнопку бота.");
  }
} catch (err) {
  console.error("❌ Ошибка при получении пользователя:", err);
}

// === Элементы DOM ===
const starsCount = document.getElementById("stars-count");
const userIdEl = document.getElementById("user-id");
const usernameEl = document.getElementById("user-username");
const avatarEl = document.getElementById("user-avatar");
const startExchangeBtn = document.getElementById("start-exchange-by-username");

// === Отображение пользователя ===
if (user && userIdEl && usernameEl && avatarEl) {
  userIdEl.textContent = user.id;
  usernameEl.textContent = user.username ? `@${user.username}` : "не задан";

  const photoUrl = user.photo_url 
    ? `${user.photo_url}&s=150` 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name || 'User')}&background=random&size=100`;

  avatarEl.src = photoUrl;
  avatarEl.onerror = () => {
    avatarEl.src = "https://via.placeholder.com/50/CCCCCC/000?text=👤";
  };
} else {
  console.log("❌ Пользователь не доступен — откройте через Telegram");
  if (userIdEl) userIdEl.textContent = "—";
  if (usernameEl) usernameEl.textContent = "не задан";
  if (avatarEl) avatarEl.src = "https://via.placeholder.com/50/CCCCCC/000?text=👤";
}

// === Переключение вкладок ===
document.querySelectorAll(".tab-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    button.classList.add("active");

    if (button.id === "buy-stars-top") {
      window.open('https://spend.tg/telegram-stars', '_blank');
      return;
    }

    const tabId = button.id.replace("tab-", "");
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.add("active");
  });
});

// === Загрузка баланса ===
async function loadStars() {
  if (!starsCount || !user) return;

  try {
    const res = await fetch(`https://bupsiserver.onrender.com/api/stars/${user.id}`);
    if (!res.ok) throw new Error("Сервер не ответил");
    const data = await res.json();
    starsCount.textContent = data.stars || 0;
  } catch (err) {
    console.error("❌ Ошибка загрузки баланса", err);
    starsCount.textContent = "—";
  }
}
loadStars();

// === Кнопка обмена ===
if (startExchangeBtn && user) {
  startExchangeBtn.disabled = false;
  startExchangeBtn.style.opacity = "1";
  startExchangeBtn.addEventListener("click", async () => {
    const targetUsername = prompt("Введите username пользователя:", "").trim();
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
      tg?.showAlert?.(result.success ? `✅ Запрос отправлен @${targetUsername}` : `❌ Ошибка: ${result.error}`);
    } catch (err) {
      tg?.showAlert?.("❌ Ошибка сети. Проверьте подключение.");
    }
  });
} else if (startExchangeBtn) {
  startExchangeBtn.disabled = true;
  startExchangeBtn.style.opacity = "0.5";
  startExchangeBtn.textContent = "Обмен: недоступен (откройте через бота)";
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

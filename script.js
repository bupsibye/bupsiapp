// === Инициализация Telegram WebApp ===
const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
} else {
  console.warn("Telegram WebApp недоступен — Mini App должна открываться через Telegram");
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
const user = tg?.initDataUnsafe?.user || null;

// === Элементы профиля ===
const starsCount = document.getElementById("stars-count");
const userIdEl = document.getElementById("user-id");
const usernameEl = document.getElementById("user-username");
const avatarEl = document.getElementById("user-avatar");

// === Показ информации о пользователе ===
if (user) {
  if (userIdEl) userIdEl.textContent = user.id;
  if (usernameEl) {
    usernameEl.textContent = user.username ? `@${user.username}` : "не задан";
  }
  if (avatarEl) {
    if (user.photo_url) {
      avatarEl.src = `${user.photo_url}&s=150`;
    } else {
      avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name || 'User')}&background=random&size=100`;
    }
  }
} else {
  console.log("Пользователь не определён — открыт не через Telegram");
  // Можно скрыть блок или оставить демо-режим
  if (userIdEl) userIdEl.textContent = "—";
  if (usernameEl) usernameEl.textContent = "не задан";
  if (avatarEl) avatarEl.src = "https://via.placeholder.com/50/CCCCCC/000?text=👤";
}

// === Переключение вкладок сверху ===
document.querySelectorAll(".tab-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    button.classList.add("active");

    // Кнопка "Звёзды" — открывает сайт
    if (button.id === "buy-stars-top") {
      window.open('https://spend.tg/telegram-stars', '_blank');
      return;
    }

    const tabId = button.id.replace("tab-", "");
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.add("active");
  });
});

// === Загрузка баланса звёзд ===
async function loadStars() {
  if (!starsCount || !user) return;

  try {
    const res = await fetch(`https://bupsiserver.onrender.com/api/stars/${user.id}`);
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
    if (!user) return tg?.showAlert?.("Ошибка: откройте через Telegram");

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
      tg?.showAlert?.(result.success ? `Куплено: ${item.name}!` : "Ошибка: " + result.error);
      if (result.success) loadStars();
    } catch (err) {
      tg?.showAlert?.("Не удалось подключиться к серверу");
    }
  });
});

// === Начать обмен по username ===
document.getElementById("start-exchange-by-username")?.addEventListener("click", async () => {
  if (!user) return tg?.showAlert?.("Только в Telegram");

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
    tg?.showAlert?.("Ошибка сети");
  }
});

// === Вторичные вкладки (в профиле) ===
document.querySelectorAll(".tabs-secondary button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tabs-secondary button").forEach(b => b.classList.remove("tab-active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    btn.classList.add("tab-active");
    document.getElementById(btn.getAttribute("data-tab")).classList.add("active");
  });
});

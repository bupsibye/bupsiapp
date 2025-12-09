// === 1. Инициализация Telegram WebApp ===
const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  console.log("✅ WebApp: готов");
} else {
  console.error("❌ Telegram SDK не загружен. Добавьте <script src='https://telegram.org/js/telegram-web-app.js'>");
}

// === 2. Получаем пользователя ===
const user = tg?.initDataUnsafe?.user || null;

// === 3. DOMContentLoaded — старт логики ===
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOMContentLoaded: запуск");

  // --- Убираем блокировку с кнопок ---
  document.querySelectorAll('button, .tab-btn').forEach(btn => {
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
    btn.disabled = false;
  });

  // === 4. Переключение вкладок: Магазин / Обмен / Профиль / Покупка звёзд ===
  document.querySelectorAll(".tab-btn").forEach(button => {
    button.addEventListener("click", () => {
      // Сброс всех вкладок
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

      // Активируем нужную
      button.classList.add("active");

      // Если это "Купить звёзды" — открываем ссылку
      if (button.id === "buy-stars-top") {
        window.open('https://spend.tg/telegram-stars', '_blank');
        return;
      }

      // Определяем, какую вкладку открыть
      const tabId = button.id.replace("tab-", "");
      const tab = document.getElementById(tabId);
      if (tab) tab.classList.add("active");
    });
  });

  // === 5. Отображение профиля (вкладка "Профиль") ===
  if (user) {
    const userIdEl = document.getElementById("user-id");
    const usernameEl = document.getElementById("user-username");
    const avatarEl = document.getElementById("user-avatar");

    if (userIdEl) userIdEl.textContent = user.id;
    if (usernameEl) usernameEl.textContent = user.username ? `@${user.username}` : "не задан";
    if (avatarEl) {
      avatarEl.src = user.photo_url 
        ? `${user.photo_url}&s=150` 
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name || 'User')}&size=100&background=random`;
      avatarEl.onerror = () => avatarEl.src = "https://via.placeholder.com/50/CCCCCC/000?text=👤";
    }
  }

  // === 6. Кнопка "Начать обмен по username" — отправка запроса ===
  const startExchangeBtn = document.getElementById("start-exchange-by-username");
  if (startExchangeBtn && user) {
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
    targetUsername: targetUsername
  })
});


        const result = await res.json();
        tg?.showAlert?.(
          result.success 
            ? `✅ Запрос отправлен @${targetUsername}` 
            : `❌ Ошибка: ${result.error}`
        );
      } catch (err) {
        console.error("❌ Ошибка сети:", err);
        tg?.showAlert?.("❌ Ошибка соединения с сервером.");
      }
    });
  }

  // === 7. Загрузка баланса звёзд ===
  const starsCount = document.getElementById("stars-count");
  if (starsCount && user) {
    fetch(`https://bupsiserver.onrender.com/api/stars/${user.id}`)
      .then(res => res.json())
      .then(data => {
        starsCount.textContent = data.stars || 0;
        console.log("⭐ Баланс загружен:", data.stars);
      })
      .catch(err => {
        console.error("❌ Ошибка загрузки баланса:", err);
        starsCount.textContent = "—";
      });
  }

  // === 8. Вторичные вкладки в профиле (Инвентарь / История) ===
  document.querySelectorAll(".tabs-secondary button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tabs-secondary button").forEach(b => b.classList.remove("tab-active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      btn.classList.add("tab-active");
      document.getElementById(btn.getAttribute("data-tab")).classList.add("active");
    });
  });
});

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
} else {
  console.error("❌ SDK не загружен");
}

const user = tg?.initDataUnsafe?.user || null;

document.addEventListener('DOMContentLoaded', () => {
  // Включаем кнопки
  document.querySelectorAll('button, .tab-btn').forEach(btn => {
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
    btn.disabled = false;
  });

  // === Проверка на exchange_id ===
  const urlParams = new URLSearchParams(window.location.search);
  const exchangeId = urlParams.get('exchange_id');
  const mainContent = document.querySelector('.main-content');

  if (exchangeId) {
    // Показываем экран обмена
    mainContent.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>🔄 Обмен</h2>
        <p id="exchange-info">Загрузка информации...</p>
        <div style="margin-top: 20px;">
          <button id="accept-exchange" style="padding: 10px 20px; font-size: 16px;">✅ Принять</button>
          <button id="decline-exchange" style="padding: 10px 20px; font-size: 16px; margin-left: 10px;">❌ Отклонить</button>
        </div>
      </div>
    `;

    // Здесь можно загрузить данные сессии
    document.getElementById('exchange-info').textContent = "Обмен с @user1 (заглушка)";

    // Кнопка "Принять"
    document.getElementById('accept-exchange').onclick = () => {
      tg.showAlert("Вы приняли обмен!");
      // Здесь может быть логика обмена
    };

    // Кнопка "Отклонить"
    document.getElementById('decline-exchange').onclick = () => {
      tg.showAlert("Вы отклонили обмен");
      window.history.back();
    };

    tg.BackButton.show();
    tg.BackButton.onClick(() => window.history.back());

    return;
  }

  // === Если не обмен — стандартный интерфейс ===

  // Отображение профиля
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

  // Переключение вкладок
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

  // Кнопка обмена
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
            targetUsername
          })
        });

        const result = await res.json();
        tg?.showAlert?.(result.success 
          ? `✅ Запрос отправлен @${targetUsername}` 
          : `❌ Ошибка: ${result.error}`
        );
      } catch (err) {
        tg?.showAlert?.("❌ Ошибка соединения с сервером.");
      }
    });
  }

  // Загрузка баланса
  const starsCount = document.getElementById("stars-count");
  if (starsCount && user) {
    fetch(`https://bupsiserver.onrender.com/api/stars/${user.id}`)
      .then(res => res.json())
      .then(data => starsCount.textContent = data.stars || 0)
      .catch(() => starsCount.textContent = "—");
  }

  // Вторичные вкладки
  document.querySelectorAll(".tabs-secondary button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tabs-secondary button").forEach(b => b.classList.remove("tab-active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      btn.classList.add("tab-active");
      document.getElementById(btn.getAttribute("data-tab")).classList.add("active");
    });
  });
});

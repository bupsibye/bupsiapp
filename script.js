// === Логи для отладки ===
console.log("🚀 Mini App: запуск");

// Инициализация Telegram WebApp
const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  console.log("✅ Telegram WebApp: готов");
} else {
  console.error("❌ Telegram WebApp: не загружен");
  alert("Ошибка: откройте Mini App через @bupsibot");
}

// Пользователь из Telegram
const user = tg?.initDataUnsafe?.user || null;
console.log("👤 Пользователь:", user);

// Функция: обновить баланс ⭐
function updateStars() {
  if (!user) return;

  fetch(`https://bupsiserver.onrender.com/api/stars/${user.id}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      const el = document.getElementById("stars-count");
      if (el) el.textContent = data.stars || 0;
    })
    .catch(err => {
      console.error("❌ Ошибка загрузки баланса:", err);
      const el = document.getElementById("stars-count");
      if (el) el.textContent = "—";
    });
}

// При загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOMContentLoaded: старт");

  // === Обновить баланс при старте ===
  updateStars();

  // === Проверка: пришли по startparam (принять обмен) ===
  const initData = tg?.initData || '';
  const urlParams = new URLSearchParams(initData);
  const startParam = urlParams.get('start_param');

  if (startParam?.startsWith('exchange_')) {
    const sessionId = startParam.replace('exchange_', '');
    tg.showConfirm('Принять обмен?', async (ok) => {
      if (ok) {
        try {
          const res = await fetch(`https://bupsiserver.onrender.com/api/accept-exchange/${sessionId}`);
          const result = await res.json();

          if (result.success) {
            tg.showAlert(`✅ Обмен принят! Получено ${result.stars} ⭐`);
            updateStars();
          } else {
            tg.showAlert(`❌ Ошибка: ${result.error}`);
          }
        } catch (err) {
          tg.showAlert('❌ Не удалось подключиться к серверу');
          console.error("Ошибка принятия обмена:", err);
        }
      }
      tg.close();
    });
  }

  // === Проверка: открыли с exchange_id (внутри Mini App) ===
  const urlSearch = new URLSearchParams(window.location.search);
  const exchangeId = urlSearch.get('exchange_id');
  const mainContent = document.querySelector('.main-content');

  if (exchangeId && mainContent) {
    mainContent.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <div style="width: 60px; height: 60px; border-radius: 50%; background: #0088cc; margin: 0 auto 16px; color: white; font-size: 28px; display: flex; align-items; justify-content: center;">
          🔄
        </div>
        <h2>Обмен</h2>
        <p style="color: var(--tg-hint); font-size: 14px;">Ожидание подтверждения</p>
        <div style="background: var(--tg-secondary-bg); border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p><strong>От:</strong> <span id="exchange-from">@user</span></p>
          <p><strong>Сумма:</strong> <span id="exchange-stars">50 ⭐</span></p>
        </div>
        <div style="margin-top: 20px;">
          <button id="accept-exchange" style="padding: 12px 24px; font-size: 16px; background: #00C853; color: white; border: none; border-radius: 8px;">✅ Принять</button>
          <button id="decline-exchange" style="padding: 12px 24px; font-size: 16px; background: #f44336; color: white; border: none; border-radius: 8px; margin-left: 10px;">❌ Отклонить</button>
        </div>
      </div>
    `;

    const acceptBtn = document.getElementById('accept-exchange');
    const declineBtn = document.getElementById('decline-exchange');

    if (acceptBtn) {
      acceptBtn.onclick = async () => {
        try {
          const res = await fetch(`https://bupsiserver.onrender.com/api/accept-exchange/${exchangeId}`);
          const result = await res.json();

          if (result.success) {
            tg.showAlert(`✅ Вы приняли обмен! Получено ${result.stars} ⭐`);
            updateStars();
          } else {
            tg.showAlert(`❌ Ошибка: ${result.error}`);
          }
        } catch (err) {
          tg.showAlert('❌ Ошибка соединения с сервером');
          console.error("Ошибка принятия обмена:", err);
        }
        window.history.back();
      };
    }

    if (declineBtn) {
      declineBtn.onclick = () => {
        tg.showAlert('Вы отклонили обмен');
        window.history.back();
      };
    }

    tg.BackButton.show();
    tg.BackButton.onClick(() => {
      window.history.back();
    });

    window.addEventListener('popstate', () => {
      tg.BackButton.hide();
    });

    return;
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

  // === Кнопка "Начать обмен" ===
  const startExchangeBtn = document.getElementById("start-exchange-by-username");
  if (startExchangeBtn && user) {
    startExchangeBtn.addEventListener("click", async () => {
      const targetUsername = prompt("Введите username пользователя:", "").trim();
      if (!targetUsername) {
        return tg?.showAlert?.("Введите username");
      }

      try {
        console.log("📤 Отправка запроса на обмен:", { fromId: user.id, targetUsername });
        const res = await fetch('https://bupsiserver.onrender.com/api/start-exchange-by-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromId: user.id,
            fromUsername: user.username || `user${user.id}`,
            targetUsername
          })
        });

        console.log("📡 Статус ответа:", res.status);
        if (!res.ok) throw new Error(`Сервер вернул ${res.status}`);

        const result = await res.json();
        console.log("📦 Результат:", result);

        tg?.showAlert?.(result.success 
          ? `✅ Запрос отправлен @${targetUsername}` 
          : `❌ Ошибка: ${result.error}`
        );
      } catch (err) {
        console.error("💥 Ошибка fetch:", err);
        tg?.showAlert?.("❌ Ошибка соединения с сервером. Проверьте интернет и попробуйте снова.");
      }
    });
  }

  // Обновить баланс
  updateStars();

  // === Загрузка истории ===
  async function loadHistory() {
    const list = document.getElementById('history-list');
    if (!list || !user) return;
    list.innerHTML = '<p>Загрузка...</p>';

    try {
      const res = await fetch(`https://bupsiserver.onrender.com/api/history/${user.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const history = await res.json();

      if (!history.length) {
        list.innerHTML = '<p>Нет операций</p>';
        return;
      }

      list.innerHTML = history.map(item => `
        <div class="history-item type-${item.type}">
          ${item.description}
          <div class="date">${new Date(item.date).toLocaleString('ru')}</div>
        </div>
      `).join('');
    } catch (err) {
      console.error("❌ Ошибка загрузки истории:", err);
      list.innerHTML = '<p>Ошибка загрузки</p>';
    }
  }

  const historyTabBtn = document.querySelector('[data-tab="history"]');
  if (historyTabBtn) {
    historyTabBtn.addEventListener('click', loadHistory);
  }

  // === Вторичные вкладки (в профиле) ===
  document.querySelectorAll(".tabs-secondary button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tabs-secondary button").forEach(b => b.classList.remove("tab-active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      btn.classList.add("tab-active");
      const pane = document.getElementById(btn.getAttribute("data-tab"));
      if (pane) pane.classList.add("active");
    });
  });

  // === Показываем данные пользователя ===
  if (user) {
    const userIdEl = document.getElementById('user-id');
    const usernameEl = document.getElementById('user-username');
    const avatarEl = document.getElementById('user-avatar');

    if (userIdEl) userIdEl.textContent = user.id;
    if (usernameEl) usernameEl.textContent = user.username || 'не указан';
    if (avatarEl && user.photo_url) {
      avatarEl.src = user.photo_url;
    }
  }
});

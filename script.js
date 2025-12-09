const tg = window.Telegram?.WebApp;

// Инициализация Telegram Mini App
if (tg) {
  tg.ready();
  tg.expand();
  tg.BackButton.hide(); // Скроем, если не в обмене
} else {
  console.error("❌ SDK не загружен");
}

// Пользователь из Telegram
const user = tg?.initDataUnsafe?.user || null;

// Автообновление баланса
function updateStars() {
  if (!user) return;
  fetch(`https://bupsiserver.onrender.com/api/stars/${user.id}`)
    .then(res => res.json())
    .then(data => {
      const el = document.getElementById("stars-count");
      if (el) el.textContent = data.stars || 0;
    })
    .catch(() => {
      const el = document.getElementById("stars-count");
      if (el) el.textContent = "—";
    });
}

// При загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  // Включаем кнопки
  document.querySelectorAll('button, .tab-btn').forEach(btn => {
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
    btn.disabled = false;
  });

  // === Проверка: пришли по ссылке с startapp (например, /startapp=exchange_abc123)
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
            updateStars(); // Обновим баланс
          } else {
            tg.showAlert(`❌ Ошибка: ${result.error}`);
          }
        } catch (err) {
          tg.showAlert('❌ Не удалось подключиться к серверу');
        }
      }
      tg.close(); // Закрываем WebApp
    });
  }

  // === Проверка: открыли с exchange_id (например, ?exchange_id=abc123)
  const urlSearch = new URLSearchParams(window.location.search);
  const exchangeId = urlSearch.get('exchange_id');
  const mainContent = document.querySelector('.main-content');

  if (exchangeId) {
    mainContent.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <div style="width: 60px; height: 60px; border-radius: 50%; background: #0088cc; margin: 0 auto 16px; color: white; font-size: 28px; display: flex; align-items: center; justify-content: center;">
          🔄
        </div>
        <h2>Обмен</h2>
        <p style="color: var(--tg-hint); font-size: 14px;">Ожидание подтверждения</p>
        <div style="background: var(--tg-secondary-bg); border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p><strong>От:</strong> <span id="exchange-from">@user1</span></p>
          <p><strong>Сумма:</strong> <span id="exchange-stars">50 ⭐</span></p>
        </div>
        <div style="margin-top: 20px;">
          <button id="accept-exchange" style="padding: 12px 24px; font-size: 16px; background: #00C853; color: white; border: none; border-radius: 8px;">✅ Принять</button>
          <button id="decline-exchange" style="padding: 12px 24px; font-size: 16px; background: #f44336; color: white; border: none; border-radius: 8px; margin-left: 10px;">❌ Отклонить</button>
        </div>
      </div>
    `;

    // Здесь можно загрузить данные сессии
    document.getElementById('exchange-from').textContent = '@user1 (заглушка)';

    // Принять обмен
    document.getElementById('accept-exchange').onclick = async () => {
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
        tg.showAlert('❌ Ошибка соединения');
      }
      window.history.back();
    };

    // Отклонить
    document.getElementById('decline-exchange').onclick = () => {
      tg.showAlert('Вы отклонили обмен');
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

    // Загружаем баланс
    updateStars();
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

  // Кнопка "Начать обмен"
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

  // === Вторичные вкладки (в профиле) ===
  document.querySelectorAll(".tabs-secondary button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tabs-secondary button").forEach(b => b.classList.remove("tab-active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      btn.classList.add("tab-active");
      document.getElementById(btn.getAttribute("data-tab")).classList.add("active");
    });
  });

  // === Загрузка истории ===
  async function loadHistory() {
    const list = document.getElementById('history-list');
    if (!list || !user) return;
    list.innerHTML = '<p>Загрузка...</p>';

    try {
      const res = await fetch(`https://bupsiserver.onrender.com/api/history/${user.id}`);
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
      list.innerHTML = '<p>Ошибка загрузки</p>';
    }
  }

  document.querySelector('[data-tab="history"]').addEventListener('click', loadHistory);

  // === Покупка в магазине ===
  document.querySelectorAll('.shop-item-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const name = btn.dataset.name;
      const price = parseInt(btn.dataset.price);

      tg.showConfirm(`Купить "${name}" за ${price} ⭐?`, async (ok) => {
        if (!ok) return;

        try {
          // Проверим баланс
          const res = await fetch(`https://bupsiserver.onrender.com/api/stars/${user.id}`);
          const data = await res.json();

          if (data.stars < price) {
            tg.showAlert('❌ Недостаточно звёзд!');
            return;
          }

          // Здесь будет запрос к /api/buy (в будущем)
          tg.showAlert(`✅ Вы купили "${name}"!`);
          updateStars(); // обновим баланс (условно)

        } catch (err) {
          tg.showAlert('❌ Ошибка покупки');
        }
      });
    });
  });

  // === Отображение инвентаря (пример) ===
  const userGifts = [
    { name: "Плюшевый кот", img: "https://via.placeholder.com/40/FFD700/000?text=🐱" },
    { name: "Золотая звезда", img: "https://via.placeholder.com/40/87CEEB/000?text=⭐" }
  ];

  function renderInventory() {
    const grid = document.getElementById('user-gifts-grid');
    if (!grid) return;
    grid.innerHTML = userGifts.map(gift => `
      <div class="gift-item">
        <img src="${gift.img}" alt="${gift.name}">
        <div>${gift.name}</div>
      </div>
    `).join('');
  }

  document.querySelector('[data-tab="inventory-items"]').addEventListener('click', renderInventory);
});

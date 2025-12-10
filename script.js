document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ DOMContentLoaded: старт");

  // === Проверка Telegram WebApp ===
  const tg = window.Telegram?.WebApp;
  if (!tg) {
    document.body.innerHTML = `
      <div style="text-align: center; padding: 40px; font-family: sans-serif; color: #fff;">
        <h2>⚠️ Ошибка</h2>
        <p>Откройте Mini App через<br><strong>@knoxway_bot</strong></p>
      </div>
    `;
    console.error("❌ Telegram.WebApp не загружен");
    return;
  }

  tg.ready();
  tg.expand();
  console.log("✅ WebApp: готов");

  // === Пользователь ===
  const user = tg.initDataUnsafe?.user || null;
  if (!user) {
    tg.showAlert?.("❌ Не удалось получить данные пользователя");
    console.error("❌ Пользователь не определён");
    return;
  }

  console.log("👤 Пользователь:", user);

  // === Показываем данные пользователя ===
  const userIdEl = document.getElementById('user-id');
  const usernameEl = document.getElementById('user-username');
  const avatarEl = document.getElementById('user-avatar');

  if (userIdEl) userIdEl.textContent = user.id;
  if (usernameEl) usernameEl.textContent = user.username || 'не указан';
  if (avatarEl && user.photo_url) avatarEl.src = user.photo_url;

  // === Переключение вкладок (магазин, обмен, профиль) ===
  const tabButtons = document.querySelectorAll('.app-header .tab-btn');
  const tabContents = document.querySelectorAll('.main-content .tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Убираем активный класс у всех
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Добавляем активный класс нажатой кнопке
      button.classList.add('active');

      // Находим ID вкладки
      const tabId = button.id.replace('tab-', '');
      const tab = document.getElementById(tabId);

      if (tab) tab.classList.add('active');

      console.log(`🔄 Переключено на вкладку: ${tabId}`);
    });
  });

  // === Кнопка "Купить ⭐" ===
  const buyStarsBtn = document.getElementById('buy-stars-top');
  if (buyStarsBtn) {
    buyStarsBtn.addEventListener('click', () => {
      tg.showAlert?.("Открываем покупку звёзд...");
      window.open('https://spend.tg/telegram-stars', '_blank');
    });
    console.log("✅ Кнопка 'Купить ⭐' активирована");
  }

 // === Кнопка "Начать обмен" (через username) ===
const startExchangeBtn = document.getElementById('start-exchange-by-username');
if (startExchangeBtn) {
  startExchangeBtn.addEventListener('click', async () => {
    const raw = prompt("Введите username получателя:", "");
    const target = raw ? raw.trim().replace('@', '') : "";

    if (!target) {
      return tg.showAlert?.("Введите корректный username");
    }

    console.log("📤 Запрос обмена с пользователем:", target);

    try {
      const res = await fetch('https://bupsiserver.onrender.com/api/start-exchange-by-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromId: user.id,
          fromUsername: user.username,
          targetUsername: target
        })
      });

      const data = await res.json();
      console.log("📥 Ответ от /api/start-exchange-by-username:", data);

      if (!data.success) {
        tg.showAlert?.(`❌ ${data.error || 'Не удалось отправить запрос'}`);
        return;
      }

      tg.showAlert?.(`✅ Запрос на обмен отправлен @${target}`);
    } catch (e) {
      // 🔴 ВАЖНО: подробный вывод ошибки
      const msg = e?.message || String(e);
      console.error("❌ Ошибка запроса обмена:", e);
      tg.showAlert?.("❌ Техническая ошибка: " + msg);
    }
  });
  console.log("✅ Кнопка 'Начать обмен' активирована");
} else {
  console.error("❌ Кнопка #start-exchange-by-username не найдена");
}


  // === Кнопки в магазине ===
  document.querySelectorAll('.shop-item-btn').forEach(btn => {
    const name = btn.dataset.name;
    const price = btn.dataset.price;

    btn.addEventListener('click', () => {
      tg.showAlert?.(`✅ Вы купили "${name}" за ${price} ⭐`);
      console.log("🛒 Куплено:", name, price);
    });
  });

  // === Кнопка "Вывести подарок" ===
  const withdrawBtn = document.getElementById('withdraw-gift-btn');
  if (withdrawBtn) {
    withdrawBtn.addEventListener('click', () => {
      tg.showAlert?.("🎁 Подарок будет отправлен в бота");
    });
  }

  // === Инициализация баланса ===
  function updateStars() {
    // Здесь позже будет fetch
    const starsEl = document.getElementById('stars-count');
    if (starsEl) starsEl.textContent = '—';
  }
  updateStars();

  console.log("✅ Все кнопки инициализированы");
});


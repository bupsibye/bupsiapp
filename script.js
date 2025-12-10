// === Логи ===
console.log("🚀 Mini App: старт");

// Инициализация Telegram WebApp
const tg = window.Telegram?.WebApp;

if (!tg) {
  console.error("❌ Telegram WebApp SDK не загружен");
  document.body.innerHTML = `
    <div style="text-align: center; padding: 40px; font-family: sans-serif;">
      <h2>⚠️ Ошибка загрузки</h2>
      <p>Откройте Mini App через бота <strong>@knoxway_bot</strong></p>
      <p><small>Не в браузере и не по прямой ссылке</small></p>
    </div>
  `;
  throw new Error("Telegram WebApp not available");
}

// Готовим WebApp
tg.ready();
tg.expand();
tg.MainButton.setText("Готово");
console.log("✅ Telegram WebApp: готов");

// Получаем пользователя
const user = tg.initDataUnsafe?.user || null;
if (!user) {
  tg.showAlert?.("❌ Не удалось получить данные пользователя. Перезапустите Mini App.");
  throw new Error("User data not available");
}
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

  // Обновить баланс
  updateStars();

  // === Проверка: пришли по start_param (принять обмен) ===
  const initData = tg.initData || '';
  const urlParams = new URLSearchParams(initData);
  const startParam = urlParams.get('start_param');

  if (startParam?.startsWith('exchange_')) {
    const sessionId = startParam.replace('exchange_', '');

    tg.showConfirm?.(
      `🔄 Запрос на обмен!\n\nОт: ${user.username || 'Пользователь'}\nПредлагает начать обмен подарками\n\nПринять?`,
      async (ok) => {
        if (ok) {
          try {
            const res = await fetch(`https://bupsiserver.onrender.com/api/accept-exchange/${sessionId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id })
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const result = await res.json();

            if (result.success) {
              tg.showAlert?.(`✅ Обмен принят! Получено ${result.stars} ⭐`);
              updateStars();
            } else {
              tg.showAlert?.(`❌ Ошибка: ${result.error}`);
            }
          } catch (err) {
            console.error("❌ Ошибка принятия обмена:", err);
            // Fallback: showPopup вместо showAlert
            tg.showPopup?.({
              title: "Ошибка",
              message: "Не удалось подключиться к серверу",
              buttons: [{ type: "ok" }]
            });
          }
        }
        tg.close?.();
      }
    );
    return;
  }

  // === Кнопка: начать обмен по username ===
  const startExchangeBtn = document.getElementById("start-exchange-by-username");
  if (startExchangeBtn && user) {
    startExchangeBtn.addEventListener("click", async () => {
      const targetUsername = prompt("Введите username получателя:", "").trim().replace('@', '');
      if (!targetUsername) {
        return tg.showAlert?.("Введите username пользователя");
      }

      try {
        console.log("📤 Отправка запроса:", {
          fromId: user.id,
          fromUsername: user.username,
          targetUsername
        });

        const res = await fetch('https://bupsiserver.onrender.com/api/start-exchange-by-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromId: user.id,
            fromUsername: user.username || `user${user.id}`,
            targetUsername: targetUsername
          })
        });

        console.log("📡 Статус ответа:", res.status);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();

        console.log("✅ Ответ сервера:", result);

        if (result.success) {
          tg.showAlert?.(`✅ Запрос отправлен @${targetUsername}`);
        } else {
          tg.showAlert?.(`❌ Ошибка: ${result.error}`);
        }
      } catch (err) {
        console.error("💥 Ошибка fetch:", err);
        tg.showPopup?.({
          title: "Ошибка соединения",
          message: "Не удалось подключиться к серверу.\n• Проверьте интернет\n• Убедитесь, что открыли через @knoxway_bot",
          buttons: [{ type: "ok" }]
        });
      }
    });
  }

  // === Обновить баланс при старте ===
  updateStars();

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

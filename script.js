// === Логи ===
console.log("🚀 Mini App: старт");

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  console.log("✅ WebApp: готов");
} else {
  console.error("❌ WebApp не загружен");
  alert("Ошибка: откройте через @bupsibot");
  throw new Error("Telegram WebApp not available");
}

const user = tg.initDataUnsafe?.user || null;
console.log("👤 Пользователь:", user);

// === Обновить баланс ===
function updateStars() {
  if (!user) return;
  fetch(`https://bupsiserver.onrender.com/api/stars/${user.id}`)
    .then(r => r.json())
    .then(data => (document.getElementById("stars-count").textContent = data.stars || 0))
    .catch(err => {
      console.error("❌ Баланс: ошибка", err);
      document.getElementById("stars-count").textContent = "—";
    });
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log("DOMContentLoaded: старт");
  updateStars();

  // === Обработка start_param ===
  const urlParams = new URLSearchParams(tg.initData);
  const startParam = urlParams.get('start_param');
  if (startParam?.startsWith('exchange_')) {
    tg.showConfirm("Принять обмен?", (ok) => {
      if (ok) {
        fetch(`https://bupsiserver.onrender.com/api/accept-exchange/${startParam.replace('exchange_', '')}`, { method: 'POST' })
          .then(r => r.json())
          .then(res => {
            if (res.success) {
              tg.showAlert(`✅ Получено ${res.stars} ⭐`);
              updateStars();
            } else {
              tg.showAlert(`❌ ${res.error}`);
            }
          })
          .catch(err => {
            tg.showAlert("❌ Ошибка сервера");
            console.error("❌ fetch error:", err);
          });
      }
      tg.close();
    });
  }

  // === Кнопка обмена ===
  const btn = document.getElementById("start-exchange-by-username");
  if (btn && user) {
    btn.addEventListener("click", async () => {
      const target = prompt("Введите username:", "").trim().replace('@', '');
      if (!target) return tg.showAlert("Введите username");

      // Логируем тело запроса
      console.log("📤 Тело запроса:", { fromId: user.id, fromUsername: user.username, targetUsername: target });

      try {
        const res = await fetch('https://bupsiserver.onrender.com/api/start-exchange-by-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromId: user.id,
            fromUsername: user.username || `user${user.id}`,
            targetUsername: target
          })
        });

        console.log("📡 Статус ответа:", res.status);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const result = await res.json();
        console.log("✅ Ответ сервера:", result);

        tg.showAlert(result.success
          ? `✅ Запрос отправлен @${target}`
          : `❌ ${result.error}`
        );
      } catch (err) {
        console.error("💥 Ошибка fetch:", err);
        tg.showAlert("❌ Ошибка соединения. Проверьте:\n• Интернет\n• Запуск через @bupsibot");
      }
    });
  }

  updateStars();
});

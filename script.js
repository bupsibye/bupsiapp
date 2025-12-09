// === 1. Инициализация Telegram WebApp ===
const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();    // Это КРИТИЧЕСКИ важно
  tg.expand();   // Раскрыть на весь экран
} else {
  console.error("❌ Telegram SDK не загружен. Добавьте <script src='https://telegram.org/js/telegram-web-app.js'>");
}

// === 2. Получаем пользователя ===
const user = tg?.initDataUnsafe?.user || null;

// === 3. Включаем все кнопки (убираем блокировку Telegram) ===
document.addEventListener('DOMContentLoaded', () => {
  // Убираем CSS-блокировку
  const buttons = document.querySelectorAll('button, .tab-btn');
  buttons.forEach(btn => {
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
    btn.disabled = false;
  });

  // === 4. Показываем профиль, если есть пользователь ===
  if (user) {
    const userIdEl = document.getElementById("user-id");
    const usernameEl = document.getElementById("user-username");
    const avatarEl = document.getElementById("user-avatar");

    if (userIdEl) userIdEl.textContent = user.id;
    if (usernameEl) usernameEl.textContent = user.username ? `@${user.username}` : "не задан";
    if (avatarEl) {
      avatarEl.src = user.photo_url 
        ? `${user.photo_url}&s=150` 
        : `https://ui-avatars.com/api/?name=${user.first_name}&size=100&background=random`;
      avatarEl.onerror = () => avatarEl.src = "https://via.placeholder.com/50/ccc/000?text=👤";
    }
  }

  // === 5. Кнопка "Купить звёзды" — открывает ссылку ===
  const buyStarsBtn = document.getElementById("buy-stars-top");
  if (buyStarsBtn) {
    buyStarsBtn.onclick = () => {
      window.open('https://spend.tg/telegram-stars', '_blank');
    };
  }

  // === 6. Кнопка "Профиль" — переключает вкладку ===
  const profileTabBtn = document.getElementById("tab-profile");
  const profileTab = document.getElementById("profile");

  if (profileTabBtn && profileTab) {
    profileTabBtn.onclick = () => {
      // Сброс всех вкладок
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      
      // Активируем профиль
      profileTabBtn.classList.add("active");
      profileTab.classList.add("active");
    };
  }

  // === 7. Кнопка "Обмен" — отправка запроса ===
  const exchangeBtn = document.getElementById("start-exchange-by-username");
  if (exchangeBtn && user) {
    exchangeBtn.onclick = async () => {
      const username = prompt("Введите username:", "").trim();
      if (!username) return alert("Введите username");

      try {
        const res = await fetch('https://bupsiserver.onrender.com/api/start-exchange-by-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromId: user.id,
            fromUsername: user.username || `user${user.id}`,
            targetUsername: username
          })
        });

        const data = await res.json();
        alert(data.success 
          ? `✅ Запрос отправлен @${username}` 
          : `❌ Ошибка: ${data.error}`
        );
      } catch (err) {
        alert("❌ Ошибка сети");
      }
    };
  }

  // === 8. Загрузка баланса ===
  const starsCount = document.getElementById("stars-count");
  if (starsCount && user) {
    fetch(`https://bupsiserver.onrender.com/api/stars/${user.id}`)
      .then(res => res.json())
      .then(data => starsCount.textContent = data.stars || 0)
      .catch(() => starsCount.textContent = "—");
  }
});

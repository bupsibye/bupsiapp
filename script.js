const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  console.log("✅ WebApp: готов");
} else {
  console.error("❌ SDK не загружен");
}

const user = tg?.initDataUnsafe?.user || null;
console.log("👤 Пользователь:", user);

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOMContentLoaded: запуск");

  // Включаем все кнопки
  document.querySelectorAll('button, .tab-btn').forEach(btn => {
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
    btn.disabled = false;
    console.log("✅ Кнопка активирована:", btn.id || btn.textContent.slice(0, 20));
  });

  // === Кнопка "Профиль" ===
  const profileTabBtn = document.getElementById("tab-profile");
  const profileTab = document.getElementById("profile");

  if (profileTabBtn) {
    console.log("✅ Кнопка 'Профиль' найдена");
    profileTabBtn.onclick = () => {
      console.log("👉 Кнопка 'Профиль' нажата");
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      profileTabBtn.classList.add("active");
      if (profileTab) profileTab.classList.add("active");
    };
  } else {
    console.error("❌ Кнопка 'tab-profile' НЕ найдена");
  }

  // === Кнопка "Обмен" ===
  const exchangeBtn = document.getElementById("start-exchange-by-username");
  if (exchangeBtn) {
    console.log("✅ Кнопка 'Обмен' найдена");
    exchangeBtn.onclick = async () => {
      console.log("👉 Кнопка 'Обмен' нажата");
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
        console.error("❌ Ошибка обмена:", err);
        alert("❌ Ошибка сети");
      }
    };
  } else {
    console.error("❌ Кнопка 'start-exchange-by-username' НЕ найдена");
  }

  // === Кнопка "Купить звёзды" ===
  const buyStarsBtn = document.getElementById("buy-stars-top");
  if (buyStarsBtn) {
    buyStarsBtn.onclick = () => {
      console.log("👉 Кнопка 'Купить звёзды' нажата");
      window.open('https://spend.tg/telegram-stars', '_blank');
    };
  }

  // === Баланс ===
  const starsCount = document.getElementById("stars-count");
  if (starsCount && user) {
    fetch(`https://bupsiserver.onrender.com/api/stars/${user.id}`)
      .then(res => res.json())
      .then(data => {
        starsCount.textContent = data.stars || 0;
        console.log("⭐ Баланс:", data.stars);
      })
      .catch(err => {
        console.error("❌ Ошибка баланса:", err);
        starsCount.textContent = "—";
      });
  }

  // === Профиль ===
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
});

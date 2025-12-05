const tg = window.Telegram.WebApp;
tg.ready();

// === Элементы ===
const user = tg.initDataUnsafe.user;
const starsCount = document.getElementById("stars-count");

// === Переключение вкладок сверху ===
document.querySelectorAll(".tab-btn").forEach(button => {
  button.addEventListener("click", () => {
    // Убираем актив у всех
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    // Добавляем текущему
    button.classList.add("active");
    const tabId = button.id.replace("tab-", "");
    document.getElementById(tabId).classList.add("active");
  });
});

// === Применение темы ===
function applyTheme() {
  const theme = tg.themeParams;
  const dark = tg.colorScheme === 'dark';
  document.documentElement.style.setProperty('--tg-bg', theme.bg_color || (dark ? '#1a1a1a' : '#fff'));
  document.documentElement.style.setProperty('--tg-text', theme.text_color || (dark ? '#fff' : '#000'));
  document.documentElement.style.setProperty('--tg-hint', theme.hint_color || (dark ? '#999' : '#888'));
  document.documentElement.style.setProperty('--tg-accent', theme.accent_text_color || '#0088cc');
  document.documentElement.style.setProperty('--tg-secondary-bg', dark ? '#2c2c2c' : '#f0f0f0');
  document.documentElement.style.setProperty('--tg-border', dark ? '#444' : '#ddd');
}
applyTheme();

// === Загрузка баланса ===
async function loadStars() {
  try {
    const res = await fetch('https://bupsiserver.onrender.com/api/stars/' + user.id);
    const data = await res.json();
    starsCount.textContent = data.stars || 0;
  } catch (err) {
    starsCount.textContent = "—";
  }
}
loadStars();

// === Кнопка "Пополнить звёзды" ===
document.getElementById("buy-stars-btn").addEventListener("click", () => {
  tg.showInvoice('stars_package_basic');
});

// === Покупка в магазине ===
document.querySelectorAll(".shop-item-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    const item = {
      name: btn.dataset.name,
      price: parseInt(btn.dataset.price)
    };

    const res = await fetch('https://bupsiserver.onrender.com/api/buy-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, item })
    });

    const result = await res.json();
    if (result.success) {
      tg.showAlert(`Куплено: ${item.name}!`);
      loadStars();
    } else {
      tg.showAlert("Ошибка: " + result.error);
    }
  });
});

// === Начать обмен ===
document.getElementById("start-exchange-by-username").addEventListener("click", async () => {
  const targetUsername = prompt("Введите username:", "").trim();
  if (!targetUsername) return alert("Введите username");

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
  alert(result.success ? `Запрос отправлен @${targetUsername}` : "Ошибка: " + result.error);
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

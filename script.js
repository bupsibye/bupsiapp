const tg = window.Telegram.WebApp;
tg.ready();

const user = tg.initDataUnsafe.user;
const starsCount = document.getElementById("stars-count");
const historyList = document.getElementById("history-list");

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

// === Загрузка баланса звёзд ===
async function loadStars() {
  try {
    const res = await fetch(`https://bupsiserver.onrender.com/api/stars/${user.id}`);
    const data = await res.json();
    starsCount.textContent = data.stars || 0;
  } catch (err) {
    starsCount.textContent = "—";
  }
}
loadStars();

// === Кнопка "Купить звёзды" ===
document.getElementById("buy-stars-btn").addEventListener("click", () => {
  tg.showInvoice('stars_package_basic');
});

// === Переключение вкладок в инвентаре ===
document.querySelectorAll(".tabs-secondary button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tabs-secondary button").forEach(b => b.classList.remove("tab-active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

    btn.classList.add("tab-active");
    document.getElementById(btn.getAttribute("data-tab")).classList.add("active");

    if (btn.getAttribute("data-tab") === "history") {
      loadHistory();
    }
  });
});

// === Загрузка истории ===
async function loadHistory() {
  try {
    const res = await fetch(`https://bupsiserver.onrender.com/api/history/${user.id}`);
    const history = await res.json();

    historyList.innerHTML = history.reverse().map(item => `
      <div class="history-item type-${item.type}">
        <div>${item.text}</div>
        <div class="date">${item.date}</div>
      </div>
    `).join('');
  } catch (err) {
    historyList.innerHTML = '<div>Не удалось загрузить историю</div>';
  }
}

// === Магазин: покупка ===
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
      loadHistory();
    } else {
      tg.showAlert("Ошибка: " + result.error);
    }
  });
});

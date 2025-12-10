document.addEventListener('DOMContentLoaded', () => {
  const tg = window.Telegram?.WebApp;
  if (!tg) {
    console.error('❌ Telegram WebApp не загружен');
    return;
  }
  tg.ready();

  // === ЭЛЕМЕНТЫ ===
  const tabShop = document.getElementById('tab-shop');
  const tabExchange = document.getElementById('tab-exchange');
  const tabInventory = document.getElementById('tab-inventory');
  const mainContents = document.querySelectorAll('.main-content > .tab-content');
  const buyStarsTop = document.getElementById('buy-stars-top');
  const userAvatar = document.getElementById('user-avatar');
  const userId = document.getElementById('user-id');
  const userUsername = document.getElementById('user-username');
  const userGiftsGrid = document.getElementById('user-gifts-grid');
  const withdrawGiftBtn = document.getElementById('withdraw-gift-btn');
  const starsCount = document.getElementById('stars-count');
  const startExchangeBtn = document.getElementById('start-exchange-by-username');
  const exchangeArea = document.getElementById('exchange-area');

  // === ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ===
  const user = tg.initDataUnsafe.user;
  if (!user) {
    tg.showAlert?.('Ошибка: не удалось загрузить данные пользователя');
    console.error('❌ tg.initDataUnsafe.user is null');
    return;
  }

  let myGifts = JSON.parse(localStorage.getItem('myGifts') || '[]');
  let stars = parseInt(localStorage.getItem('stars') || '100');

  const API_BASE = 'https://bupsiserver.onrender.com';

  // === ПРИМЕНЕНИЕ ТЕМЫ ===
  function applyTheme() {
    const theme = tg.themeParams;
    const dark = tg.colorScheme === 'dark';
    document.documentElement.style.setProperty('--tg-bg', theme.bg_color || (dark ? '#1a1a1a' : '#fff'));
    document.documentElement.style.setProperty('--tg-text', theme.text_color || (dark ? '#fff' : '#000'));
    document.documentElement.style.setProperty('--tg-accent', theme.accent_text_color || '#0088cc');
    document.documentElement.style.setProperty('--tg-secondary-bg', dark ? '#2c2c2c' : '#f0f0f0');
    document.documentElement.style.setProperty('--tg-border', dark ? '#444' : '#ddd');
  }

  // === ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ===
  [tabShop, tabExchange, tabInventory].forEach((tab, index) => {
    tab.addEventListener('click', () => {
      mainContents.forEach(c => c.classList.remove('active'));
      ['shop', 'exchange', 'inventory'].forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('active', i === index);
      });
    });
  });

  // === КУПИТЬ ЗВЁЗДЫ ===
  buyStarsTop?.addEventListener('click', () => {
    tg.openLink('https://spend.tg/telegram-stars', { try_instant_view: false });
  });

  // === ВЫВОД ПОДАРКА ===
  withdrawGiftBtn?.addEventListener('click', () => {
    if (myGifts.length === 0) return tg.showAlert('Нет подарков для вывода');
    if (stars < 25) return tg.showAlert('Нужно 25 ⭐');

    tg.showConfirm('Оплатить 25 ⭐ за вывод подарка?', (ok) => {
      if (ok) {
        stars -= 25;
        localStorage.setItem('stars', stars);
        starsCount.textContent = stars;

        const gift = myGifts.pop();
        localStorage.setItem('myGifts', JSON.stringify(myGifts));
        renderUserGifts();
        tg.showAlert(`🎁 "${gift.name}" отправлен в чат с ботом!`);
      }
    });
  });

  // === ОТРИСОВКА ПОДАРКОВ ===
  function renderUserGifts() {
    userGiftsGrid.innerHTML = '';
    if (myGifts.length === 0) {
      userGiftsGrid.innerHTML = '<div class="gift-item empty"><span>Нет подарков</span></div>';
    } else {
      myGifts.forEach(gift => {
        const item = document.createElement('div');
        item.className = 'gift-item';
        item.innerHTML = `<img src="https://via.placeholder.com/60/CCCCCC/999?text=🎁"><span>${gift.name}</span>`;
        userGiftsGrid.appendChild(item);
      });
    }
  }

  // === ОБМЕН ПО USERNAME ===
  startExchangeBtn?.addEventListener('click', async () => {
    const username = prompt('Введите username друга (без @):', '').trim();
    if (!username) return;

    exchangeArea.innerHTML = `<p>🕐 Ждём ответа от <strong>@${username}</strong>...</p>`;

    try {
      const res = await fetch(`${API_BASE}/api/start-exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromId: user.id,
          toUsername: username,
          fromUsername: user.username || 'друг'
        })
      });

      const data = await res.json();
      if (!data.success) {
        exchangeArea.innerHTML = `<p>❌ Ошибка: ${data.error}</p>`;
      }
    } catch (err) {
      exchangeArea.innerHTML = `<p>❌ Сеть: ${err.message}</p>`;
      console.error('Fetch error:', err);
    }
  });

  // === ВКЛАДКИ В ПРОФИЛЕ ===
  document.querySelectorAll('.tabs-secondary button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabs-secondary button').forEach(b => b.classList.remove('tab-active'));
      btn.classList.add('tab-active');
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      document.getElementById(btn.dataset.tab)?.classList.add('active');
    });
  });

  // === ЗАПОЛНЕНИЕ ПРОФИЛЯ ===
  userId.textContent = user.id;
  userUsername.textContent = user.username || 'не задан';
  userAvatar.src = user.photo_url || `https://via.placeholder.com/60/999/fff?text=${user.first_name?.[0] || '?'}`;

  // === ИНИЦИАЛИЗАЦИЯ ===
  applyTheme();
  starsCount.textContent = stars;
  renderUserGifts();
});

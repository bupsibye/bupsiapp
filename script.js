document.addEventListener('DOMContentLoaded', () => {
  const tg = window.Telegram?.WebApp;
  if (!tg) {
    console.error('Telegram WebApp SDK не загружен');
    return;
  }
  tg.ready();

  // === ЭЛЕМЕНТЫ (под твой index.html) ===
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

  let user = tg.initDataUnsafe.user;
  let myGifts = JSON.parse(localStorage.getItem('myGifts') || '[]');
  let stars = parseInt(localStorage.getItem('stars') || '100');

  const API_BASE = 'https://bupsiserver.onrender.com';

  // === ПРИМЕНЕНИЕ ТЕМЫ ===
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

  // === ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ===
  function showTab(tabId) {
    mainContents.forEach(content => content.classList.remove('active'));
    document.getElementById(tabId)?.classList.add('active');
  }

  tabShop.addEventListener('click', () => showTab('shop'));
  tabExchange.addEventListener('click', () => showTab('exchange'));
  tabInventory.addEventListener('click', () => showTab('inventory'));

  // === КУПИТЬ ЗВЁЗДЫ ===
  buyStarsTop.addEventListener('click', () => {
    tg.openLink('https://spend.tg/telegram-stars', { try_instant_view: false });
  });

  // === ВЫВОД ПОДАРКА ===
  withdrawGiftBtn.addEventListener('click', () => {
    if (myGifts.length === 0) {
      tg.showAlert('Нет подарков для вывода');
      return;
    }
    if (stars < 25) {
      tg.showAlert('⚠️ Недостаточно звёзд: нужно 25');
      return;
    }

    tg.showConfirm('Оплатить 25 ⭐ за вывод подарка?', (ok) => {
      if (ok) {
        stars -= 25;
        localStorage.setItem('stars', stars);
        starsCount.textContent = stars;

        const gift = myGifts.pop();
        localStorage.setItem('myGifts', JSON.stringify(myGifts));
        renderUserGifts();
        tg.showAlert(`🎁 "${gift.name}" отправлен в ваш чат с ботом!`);
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
        item.innerHTML = `
          <img src="https://via.placeholder.com/60/CCCCCC/999999?text=🎁" alt="Gift">
          <span>${gift.name.length > 8 ? gift.name.slice(0, 8) + '...' : gift.name}</span>
        `;
        userGiftsGrid.appendChild(item);
      });
    }
  }

  // === НАЧАТЬ ОБМЕН ПО USERNAME ===
  startExchangeBtn.addEventListener('click', async () => {
    const usernameInput = prompt('Введите username друга (без @):', '');
    if (!usernameInput) return;

    // Показываем: ждём ответа
    exchangeArea.innerHTML = `<p>🕐 Ждём ответа от <strong>@${usernameInput}</strong>...</p>`;

    // Отправляем запрос на сервер
    const res = await fetch(`${API_BASE}/api/start-exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromId: user.id,
        toUsername: usernameInput.trim(),
        fromUsername: user.username || 'друг'
      })
    });

    const data = await res.json();

    if (data.success) {
      // Уже не меняем — пусть висит "ждём ответа"
      // (бот сам пришлёт ответ: либо пришлёт "принял", либо "отклонил")
    } else {
      exchangeArea.innerHTML = `<p>❌ Ошибка: ${data.error}</p>`;
    }
  });

  // === ВКЛАДКИ В ПРОФИЛЕ ===
  document.querySelectorAll('.tabs-secondary button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabs-secondary button').forEach(b => b.classList.remove('tab-active'));
      btn.classList.add('tab-active');
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      document.getElementById(btn.getAttribute('data-tab'))?.classList.add('active');
    });
  });

  // === ЗАПОЛНЕНИЕ ПРОФИЛЯ ===
  function fillUserInfo() {
    if (user) {
      userId.textContent = user.id;
      userUsername.textContent = user.username || 'не задан';
      userAvatar.src = user.photo_url || `https://via.placeholder.com/60/999/fff?text=${user.first_name?.[0] || '?'}`;
    }
  }

  // === ОБРАБОТКА start_param — если пришли по приглашению ===
  const startParam = tg.initDataUnsafe.start_param;
  if (startParam && startParam.startsWith('exchange_')) {
    const partnerId = startParam.replace('exchange_', '');
    exchangeArea.innerHTML = `
      <h3>🎁 Обмен с пользователем</h3>
      <p>Выберите подарок, который хотите обменять:</p>
      <div id="select-gift-grid" class="gifts-grid"></div>
      <button id="send-gift-exchange" class="btn">Отправить подарок</button>
    `;

    const selectGiftGrid = document.getElementById('select-gift-grid');
    selectGiftGrid.innerHTML = '';

    if (myGifts.length === 0) {
      selectGiftGrid.innerHTML = '<div class="gift-item empty"><span>Нет подарков</span></div>';
    } else {
      myGifts.forEach(gift => {
        const item = document.createElement('div');
        item.className = 'gift-item';
        item.dataset.giftId = gift.id;
        item.innerHTML = `<img src="https://via.placeholder.com/60/CCCCCC/999999?text=🎁"><span>${gift.name}</span>`;
        item.onclick = () => {
          document.querySelectorAll('.gift-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
        };
        selectGiftGrid.appendChild(item);
      });
    }

    document.getElementById('send-gift-exchange').onclick = () => {
      const selected = document.querySelector('#select-gift-grid .gift-item.selected');
      if (!selected) {
        tg.showAlert('Выберите подарок!');
        return;
      }
      tg.showAlert('Подарок выбран! Обмен начат.');
      tg.close();
    };
  }

  // === ИНИЦИАЛИЗАЦИЯ ===
  function init() {
    applyTheme();
    starsCount.textContent = stars;
    renderUserGifts();
    fillUserInfo();
  }

  init();
});

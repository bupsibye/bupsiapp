// Ждём загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  const tg = window.Telegram?.WebApp;
  if (!tg) {
    console.error('Telegram WebApp SDK не загружен');
    return;
  }
  tg.ready();

  // === ЭЛЕМЕНТЫ — теперь ПРАВИЛЬНЫЕ ID и классы ===
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

  // === ПРОВЕРКА НАЛИЧИЯ ЭЛЕМЕНТОВ ===
  console.log('✅ Элементы найдены:', {
    tabShop: !!tabShop,
    tabExchange: !!tabExchange,
    tabInventory: !!tabInventory,
    buyStarsTop: !!buyStarsTop,
    withdrawGiftBtn: !!withdrawGiftBtn,
    userGiftsGrid: !!userGiftsGrid,
    starsCount: !!starsCount,
    startExchangeBtn: !!startExchangeBtn,
  });

  if (!tabShop || !tabInventory || !withdrawGiftBtn) {
    console.error('❌ Критические элементы не найдены. Проверь index.html');
    tg.showAlert?.('Ошибка: интерфейс не загружен');
    return;
  }

  // === ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ===
  let user = tg.initDataUnsafe.user;
  let myGifts = JSON.parse(localStorage.getItem('myGifts') || '[]');
  let stars = parseInt(localStorage.getItem('stars') || '100');

  // === БАЗОВЫЙ URL БЭКА ===
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
    mainContents.forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(tabId)?.classList.add('active');
  }

  tabShop.addEventListener('click', () => showTab('shop'));
  tabExchange.addEventListener('click', () => showTab('exchange'));
  tabInventory.addEventListener('click', () => showTab('inventory'));

  // === КНОПКА "КУПИТЬ ЗВЁЗДЫ" (в хедере) ===
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

    tg.showConfirm('Оплатить 25 ⭐ за вывод подарка?', async (ok) => {
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

  // === ВКЛАДКИ В ПРОФИЛЕ (Инвентарь / История) ===
  document.querySelectorAll('.tabs-secondary button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabs-secondary button').forEach(b => b.classList.remove('tab-active'));
      btn.classList.add('tab-active');

      const tabId = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
      document.getElementById(tabId)?.classList.add('active');
    });
  });

  // === НАЧАТЬ ОБМЕН ПО USERNAME (заглушка) ===
  startExchangeBtn.addEventListener('click', () => {
    const username = prompt('Введите username друга (без @):');
    if (!username) return;
    tg.showAlert('Сейчас нужно будет выбрать подарок для обмена');
    // Здесь будет логика: отправить запрос бэкенду
  });

  // === ЗАПОЛНЕНИЕ ПРОФИЛЯ ===
  function fillUserInfo() {
    if (user) {
      userId.textContent = user.id;
      userUsername.textContent = user.username || 'не задан';
      if (user.photo_url) {
        userAvatar.src = user.photo_url;
      } else {
        userAvatar.src = 'https://via.placeholder.com/60/999/fff?text=' + (user.first_name?.[0] || '?');
      }
    }
  }

  // === ИНИЦИАЛИЗАЦИЯ ===
  function init() {
    applyTheme();
    starsCount.textContent = stars;
    renderUserGifts();
    fillUserInfo();

    // === Обработка start_param (если пришли через ссылку) ===
    const startParam = tg.initDataUnsafe.start_param;
    if (startParam) {
      if (startParam.startsWith('exchange_')) {
        const partnerId = startParam.replace('exchange_', '');
        tg.showAlert(`Приглашение от пользователя ID: ${partnerId}`);
        // Логика обмена — будет позже
      } else {
        tg.showAlert(`Сессия обмена: ${startParam}`);
        // Логика выбора подарка
      }
    }
  }

  // === ЗАПУСК ===
  init();
});

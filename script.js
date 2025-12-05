<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Gift Exchange</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="container">
    <!-- Верхняя шапка: вкладки + баланс + аватар -->
    <div class="header">
      <div class="tabs">
        <button class="tab active" data-tab="shop">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9Z"/>
          </svg>
          <span>Магазин</span>
        </button>
        <button class="tab" data-tab="exchange">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.5 2 5.74 4.25 5 7.5C3.5 7.75 2.25 9.05 2.25 10.5C2.25 12.05 3.5 13.3 5 13.5C5.7 16.7 8.4 19 12 19C15.5 19 18.3 16.75 19 13.5C20.5 13.25 21.75 11.95 21.75 10.5C21.75 9 20.5 7.7 19 7.5C18.26 4.25 15.5 2 12 2ZM12 4.5C14.75 4.5 17 6.75 17 9.5C17 10.6 16.5 11.6 15.75 12.3C16.6 13.5 17 14.9 17 16.5C17 16.9 16.9 17.3 16.8 17.6C15.8 17.1 14 17 12 17C9.3 17 7 14.75 7 12C7 11.5 7 11 7.1 10.6C7.7 11.1 8.5 11.5 9.5 11.5C10.5 11.5 11.5 10.5 11.5 9.5C11.5 8.5 10.5 7.5 9.5 7.5C9 7.5 8.5 7.7 8.1 8H7V9.5H8.5V8.1C8.9 7.8 9.4 7.5 10 7.5C11.1 7.5 12 6.6 12 5.5V4.5Z"/>
          </svg>
          <span>Обмен</span>
        </button>
        <button class="tab" data-tab="stars">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          <span>Звёзды</span>
        </button>
      </div>

      <!-- Баланс звёзд -->
      <div class="stars-balance">
        <span>⭐</span>
        <span id="stars-count">100</span>
      </div>

      <!-- Аватар пользователя -->
      <div class="user-tab" id="user-tab">
        <img src="https://via.placeholder.com/40" alt="User" id="user-avatar" />
      </div>
    </div>

    <!-- Основное содержимое -->
    <div class="main-content">
      <!-- Магазин -->
      <div id="shop" class="tab-content active">
        <h2>🎁 Магазин подарков</h2>
        <p>Покупайте подарки за Telegram Stars.</p>
        <div class="shop-items">
          <div class="item">
            <img src="https://via.placeholder.com/60/FFD700/000?text=⭐" alt="Golden Star" />
            <p>Золотая звезда</p>
            <button class="btn">Купить за 50 ⭐</button>
          </div>
          <div class="item">
            <img src="https://via.placeholder.com/60/FF6347/FFF?text=🐱" alt="Cat" />
            <p>Плюшевый кот</p>
            <button class="btn">Купить за 75 ⭐</button>
          </div>
        </div>
      </div>

      <!-- Обмен -->
      <div id="exchange" class="tab-content">
        <h2>🔄 Обмен с другом</h2>
        <button id="generate-exchange-link" class="btn">Создать ссылку для обмена</button>
        <div id="exchange-link-output"></div>

        <h3>Ваш инвентарь</h3>
        <div id="exchange-gifts-grid" class="gifts-grid"></div>
      </div>

      <!-- Покупка звёзд -->
      <div id="stars" class="tab-content">
        <h2>⭐ Покупка звёзд</h2>
        <p>Приобретайте звёзды прямо в Telegram.</p>
        <button id="buy-stars-btn" class="btn">Купить звёзды</button>
      </div>
    </div>

    <!-- Инвентарь (открывается по клику на аватар) -->
    <div id="inventory" class="tab-content">
      <h2>📦 Ваш инвентарь</h2>
      <div id="user-gifts-grid" class="gifts-grid"></div>
      <button id="withdraw-gift-btn" class="btn">Вывести подарок</button>
    </div>
  </div>

    <!-- Внутри #inventory -->
<div id="inventory" class="tab-content">
  <h2>📦 Ваш инвентарь</h2>
  <div class="tabs-secondary">
    <button class="tab-active" data-tab="inventory-items">Инвентарь</button>
    <button data-tab="history">История</button>
  </div>

  <div id="inventory-items" class="tab-pane active">
    <div id="user-gifts-grid" class="gifts-grid"></div>
    <button id="withdraw-gift-btn" class="btn">Вывести подарок</button>
  </div>

  <div id="history" class="tab-pane">
    <div id="history-list"></div>
  </div>
</div>

  <!-- Telegram WebApp SDK -->
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <script src="script.js"></script>
</body>
</html>

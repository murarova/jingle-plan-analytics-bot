# Jingle Plan analytics bot

Telegram-бот надсилає короткий звіт Google Analytics за вчора о 9:30 (Europe/Kyiv) і звіт за вибрані дати. Доступ мають лише Telegram id зі списку.

## Railway

1. New Project → Deploy from GitHub, гілка `daily-telegram-report`.
2. У Variables додайте значення з `.env.example`. `PORT` Railway задає сам.
3. Start command уже в `railway.toml`: `npm start`. Збірка відбувається під час деплою.
4. Сервіс має лишатися увімкненим. Це не Cron Job: бот слухає команди весь день і сам шле ранковий звіт.

Обидві людини мають відкрити бота і натиснути Start, інакше ранкове повідомлення не дійде.

## Команди

- `/yesterday` — вчора
- `/period 16.11.2026 20.11.2026` — період до 92 днів

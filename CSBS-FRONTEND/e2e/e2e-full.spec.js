/**
 * Настоящие E2E тесты — без моков бэкенда.
 * Требования перед запуском:
 *   docker compose up -d   (в корне проекта)
 *   npm run dev             (или reuseExistingServer: true в playwright.config.js)
 *
 * Запуск только этих тестов:
 *   npx playwright test e2e/e2e-full.spec.js
 */

import { test, expect } from '@playwright/test';

// Уникальный email на каждый запуск, чтобы не конфликтовать в БД
const timestamp = Date.now();
const TEST_USER = {
  name: `E2E Тест ${timestamp}`,
  email: `e2e_${timestamp}@test.com`,
  phone: `+7999${String(timestamp).slice(-7)}`,
  password: `E2ePass${timestamp % 1000}`,
};

// ─────────────────────────────────────────────────────────────────────────────
// E2E тест 1: Регистрация → вход → выход через реальный API
// ─────────────────────────────────────────────────────────────────────────────
test('E2E: регистрация нового пользователя и выход из системы', async ({ page }) => {
  await page.goto('/');

  // Открываем модальное окно
  await page.click('button.btn-primary:has-text("Вход")');
  await page.click('.slider-option:has-text("Регистрация")');

  // Заполняем реальные данные
  await page.fill('#input_f1', TEST_USER.name);
  await page.fill('#input_f2', TEST_USER.email);
  await page.fill('#input_f3', TEST_USER.phone);
  await page.fill('#input_f4', TEST_USER.password);
  await page.fill('#input_f5', TEST_USER.password);

  // Ждём реального ответа от Go-бэкенда (не мок)
  const [registerResponse] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/users/register') && resp.status() === 200),
    page.click('button[type="submit"]:has-text("Зарегистрироваться")'),
  ]);

  expect(registerResponse.status()).toBe(200);

  // Модальное окно закрывается, пользователь вошёл в систему
  await expect(page.locator('.auth-modal-overlay')).not.toHaveClass(/open/);
  await expect(page.locator('button:has-text("Выйти")')).toBeVisible({ timeout: 8000 });

  // Выходим из системы
  await page.click('button:has-text("Выйти")');
  await expect(page.locator('button.btn-primary:has-text("Вход")')).toBeVisible({ timeout: 5000 });

  // Флаг сессии удалён из localStorage
  const isAuth = await page.evaluate(() => localStorage.getItem('isAuthenticated'));
  expect(isAuth).toBeNull();
});

// ─────────────────────────────────────────────────────────────────────────────
// E2E тест 2: Вход → бронирование → проверка в профиле
// ─────────────────────────────────────────────────────────────────────────────
test('E2E: вход, создание брони и её отображение в профиле', async ({ page }) => {
  // Сначала регистрируем пользователя через API напрямую
  const registerRes = await page.request.post('/api/users/register', {
    data: TEST_USER,
  });
  expect(registerRes.ok()).toBeTruthy();

  // Логинимся через UI
  await page.goto('/');
  await page.click('button.btn-primary:has-text("Вход")');
  await page.fill('#input_f2', TEST_USER.email);
  await page.fill('#input_f4', TEST_USER.password);

  const [loginResponse] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/users/login') && resp.status() === 200),
    page.click('button[type="submit"]:has-text("Войти")'),
  ]);
  expect(loginResponse.status()).toBe(200);

  await expect(page.locator('button:has-text("Выйти")')).toBeVisible({ timeout: 8000 });

  // Переходим на страницу бронирования
  await page.goto('/booking');
  await expect(page.locator('.booking-form-card')).toBeVisible({ timeout: 10000 });

  // Выбираем завтрашнюю дату
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const dateInput = page.locator('input[type="date"]').first();
  await dateInput.fill(dateStr);

  // Выбираем первое доступное рабочее место на карте
  const deskButton = page.locator('.seat-btn:not(.unavailable), .desk-btn:not(.unavailable)').first();
  if (await deskButton.isVisible()) {
    await deskButton.click();
  }

  // Отправляем форму бронирования
  const submitBtn = page.locator('button[type="submit"]:has-text("Забронировать")');
  if (await submitBtn.isVisible()) {
    const [reservationResponse] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/reservations') && resp.request().method() === 'POST', { timeout: 10000 }),
      submitBtn.click(),
    ]);
    expect(reservationResponse.status()).toBe(201);

    // Проверяем в профиле что бронь появилась
    await page.goto('/profile');
    await expect(page).toHaveURL('/profile', { timeout: 8000 });
    await page.click('button:has-text("Мои бронирования"), a:has-text("Мои бронирования")');
    await expect(page.locator('.booking-item, .reservation-card, tr').first()).toBeVisible({ timeout: 8000 });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// E2E тест 3: ИИ-ассистент — реальный запрос к Gemini
// ─────────────────────────────────────────────────────────────────────────────
test('E2E: ИИ-ассистент принимает сообщение и возвращает ответ от Gemini', async ({ page }) => {
  // Регистрация + логин через API
  await page.request.post('/api/users/register', { data: TEST_USER }).catch(() => {});
  const loginRes = await page.request.post('/api/users/login', {
    data: { email: TEST_USER.email, password: TEST_USER.password },
  });
  expect(loginRes.ok()).toBeTruthy();

  // Устанавливаем сессию в браузере
  await page.goto('/');
  const userData = await loginRes.json().catch(() => ({}));
  await page.evaluate((user) => {
    localStorage.setItem('isAuthenticated', 'true');
    if (user && user.id) localStorage.setItem('user', JSON.stringify(user));
  }, userData);

  await page.goto('/ai-assistant');

  // Поле ввода должно быть активно (пользователь авторизован)
  const chatInput = page.locator('input.chat-input');
  await expect(chatInput).toBeEnabled({ timeout: 10000 });

  // Отправляем реальное сообщение — Go-бэкенд передаёт его в Gemini API
  await chatInput.fill('Какие рабочие места доступны?');

  const [chatResponse] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/chat') && resp.status() === 200, { timeout: 20000 }),
    page.click('button.btn-send'),
  ]);

  expect(chatResponse.status()).toBe(200);
  const body = await chatResponse.json();
  expect(body).toHaveProperty('reply');
  expect(typeof body.reply).toBe('string');
  expect(body.reply.length).toBeGreaterThan(0);

  // Ответ ИИ появляется в интерфейсе
  await expect(page.locator('.message-wrapper.ai').last()).toBeVisible({ timeout: 20000 });
});

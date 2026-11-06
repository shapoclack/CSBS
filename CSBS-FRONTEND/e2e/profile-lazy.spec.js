import { test, expect } from '@playwright/test';

const deferredNames = [
  'AnalyticsDashboard', 'BookingsManagement', 'WorkspacesManagement',
  'TariffsManagement', 'ClientsList', 'AdminsManagement',
  'GlobalSettings', 'SystemAuditLogs', 'ReservationQrModal',
];
const isChunk = (url, name) => new RegExp(`/assets/${name}-[^/]+\\.js$`).test(url);

async function openProfile(page, role = 'sysadmin') {
  const user = { id: 3, name: 'Тест загрузки', email: 'lazy@example.com', role, phone: '' };
  await page.addInitScript(user => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(user));
  }, user);
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    let data = [];
    if (path === '/api/users/me') data = user;
    if (path === '/api/reservations') data = [{
      ID: 101, Workspace: { NameOrNumber: 'A1' }, Tariff: { Name: 'Час' },
      StartTime: new Date(Date.now() + 3600000).toISOString(),
      EndTime: new Date(Date.now() + 7200000).toISOString(), Status: 'подтверждено',
    }];
    if (path === '/api/reservations/101/pass') data = {
      token: 'test-pass', workspace: 'A1',
      start_time: new Date().toISOString(), end_time: new Date(Date.now() + 7200000).toISOString(),
    };
    if (path === '/api/analytics/dashboard') data = {
      today: { load_percent: 0, bookings_count: 0, workspaces_total: 10, workspaces_active: 0 },
      ml_week: [], actual_last_14: [], by_category: [], by_location: [],
    };
    return route.fulfill({ json: data });
  });
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Личные данные' })).toBeVisible();
}

test('BUILD: вкладки загружаются по требованию и не скачиваются повторно', async ({ page }) => {
  const requested = [];
  page.on('request', request => requested.push(request.url()));
  await openProfile(page);
  await page.waitForLoadState('networkidle');
  expect(requested.filter(url => deferredNames.some(name => isChunk(url, name)))).toEqual([]);

  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/assets/AnalyticsDashboard-*.js', async route => {
    await gate;
    await route.continue();
  });
  await page.getByRole('button', { name: 'Аналитика и прогноз', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Загружаем раздел...');
  await expect(page.getByRole('button', { name: 'Профиль', exact: true })).toBeVisible();
  release();
  await expect(page.getByRole('heading', { name: 'Аналитика и прогноз', exact: true })).toBeVisible();
  expect(requested.filter(url => isChunk(url, 'AnalyticsDashboard'))).toHaveLength(1);
  expect(requested.filter(url => isChunk(url, 'ReservationQrModal'))).toHaveLength(0);

  await page.getByRole('button', { name: 'Профиль', exact: true }).click();
  await page.getByRole('button', { name: 'Аналитика и прогноз', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Аналитика и прогноз', exact: true })).toBeVisible();
  expect(requested.filter(url => isChunk(url, 'AnalyticsDashboard'))).toHaveLength(1);

  for (const [label, chunk] of [
    ['Управление бронированиями', 'BookingsManagement'], ['Рабочие места', 'WorkspacesManagement'],
    ['Тарифы и услуги', 'TariffsManagement'], ['Клиенты', 'ClientsList'],
    ['Управление персоналом', 'AdminsManagement'], ['Глобальные настройки', 'GlobalSettings'],
    ['Системные логи', 'SystemAuditLogs'],
  ]) {
    expect(requested.filter(url => isChunk(url, chunk))).toHaveLength(0);
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect.poll(() => requested.filter(url => isChunk(url, chunk)).length).toBe(1);
    await expect(page.locator('.profile-main h2')).toBeVisible();
  }
});

test('BUILD: QR загружается по клику и закрывается без потери кабинета', async ({ page }) => {
  const requested = [];
  page.on('request', request => requested.push(request.url()));
  await openProfile(page, 'client');
  await page.getByRole('button', { name: 'Мои бронирования', exact: true }).click();
  await expect(page.getByRole('button', { name: 'QR-код' })).toBeVisible();
  expect(requested.filter(url => isChunk(url, 'ReservationQrModal'))).toHaveLength(0);
  await page.getByRole('button', { name: 'QR-код' }).click();
  await expect(page.locator('.qr-modal-code svg')).toBeVisible();
  expect(requested.filter(url => isChunk(url, 'ReservationQrModal'))).toHaveLength(1);
  await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(page.locator('.qr-modal')).toHaveCount(0);
  await page.getByRole('button', { name: 'QR-код' }).click();
  await expect(page.locator('.qr-modal-code svg')).toBeVisible();
  expect(requested.filter(url => isChunk(url, 'ReservationQrModal'))).toHaveLength(1);
  expect(requested.filter(url => isChunk(url, 'AnalyticsDashboard'))).toHaveLength(0);
});

test('BUILD: ошибка загрузки модуля не блокирует меню кабинета', async ({ page }) => {
  await page.route('**/assets/AnalyticsDashboard-*.js', route => route.abort());
  await openProfile(page);
  await page.getByRole('button', { name: 'Аналитика и прогноз', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Не удалось открыть раздел');
  await expect(page.getByRole('button', { name: 'Обновить страницу' })).toBeVisible();
  await page.getByRole('button', { name: 'Профиль', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Личные данные' })).toBeVisible();
});

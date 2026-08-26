import { execSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

// Requiere `php artisan serve --port=8010` y `npm run dev` corriendo, y la semilla de
// la Fase 1 aplicada (`php artisan migrate:fresh --seed`): admin / password / PIN 1234.

function limpiarIntentosDeLogin() {
    execSync('php artisan tinker --execute="DB::table(\'login_attempts\')->truncate();"', {
        cwd: process.cwd(),
    });
}

test.beforeEach(() => {
    limpiarIntentosDeLogin();
});

test('entra con usuario y contraseña; la contraseña incorrecta no revela si el usuario existe', async ({
    page,
}) => {
    await page.goto('/login');

    await page.getByLabel('Usuario').fill('admin');
    await page.getByLabel('Contraseña').fill('password-mala');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('alert')).toHaveText('Usuario o contraseña incorrectos.');
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel('Usuario').fill('admin');
    await page.getByLabel('Contraseña').fill('password');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Sesión iniciada.')).toBeVisible();
});

test('entra con PIN, tecleando con clic y con el teclado físico', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'PIN' }).click();

    // Clic en el teclado numérico en pantalla.
    for (const digito of ['1', '2', '3', '4']) {
        await page.getByRole('button', { name: digito, exact: true }).click();
    }
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/login/);

    // Teclado físico.
    await page.getByRole('button', { name: 'PIN' }).click();
    await page.keyboard.type('1234');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/dashboard/);
});

test('al sexto intento fallido de PIN responde con el mensaje de bloqueo', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'PIN' }).click();

    for (let intento = 0; intento < 5; intento++) {
        await page.keyboard.type('9999');
        await page.keyboard.press('Enter');
        await expect(page.getByRole('alert')).toHaveText('PIN incorrecto.');
    }

    await page.keyboard.type('1234');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('alert')).toHaveText('Demasiados intentos, espera unos minutos.');
    await expect(page).toHaveURL(/\/login/);
});

test('visitar /dashboard sin sesión redirige a /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
});

test('la cookie de sesión es httpOnly', async ({ page, context }) => {
    await page.goto('/login');

    const cookies = await context.cookies();
    const sesion = cookies.find((c) => c.name.includes('session'));

    expect(sesion).toBeDefined();
    expect(sesion?.httpOnly).toBe(true);
});

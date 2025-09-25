import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';

test.describe('Admin ABM Tournaments - creación', () => {
    test('crea torneo con type individual', async ({ page }: { page: Page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg: ConsoleMessage) => {
            if (msg.type() !== 'error') return;
            const text = msg.text();
            if (text.includes('Content Security Policy') || text.includes('va.vercel-scripts.com')) return;
            consoleErrors.push(text);
        });

        await page.goto('/admin/abm/tournaments');
        await expect(page.getByRole('heading', { name: 'Torneos', level: 1 })).toBeVisible();
        // cerrar posibles tooltips/tours que bloquean clicks
        await page.keyboard.press('Escape');
        await page.evaluate(() => {
            document.querySelectorAll('[data-tour], .shepherd-element, .react-joyride__tooltip').forEach(
                el => (el as HTMLElement).style.display = 'none'
            );
        });

        await page.getByRole('button', { name: 'Agregar' }).click();


        // Completar campos mínimos
        await page.getByLabel(/Nombre/i).fill('Torneo Playwright INDIV');

        // Selects (Shadcn): click por label -> hermano botón "Seleccionar"
        await page.keyboard.press('Escape');
        await page.getByTestId('select-type').click().catch(async () => {
            await page.getByRole('combobox').first().click();
        });
        await page.getByRole('option').first().click();

        // Fechas
        await page.getByLabel(/Fecha Inicio/i).fill('2025-09-27');
        await page.getByLabel(/Fecha Fin/i).fill('2025-09-28');

        // Temporada (puede requerir abrir dropdown)
        await page.keyboard.press('Escape');
        await page.getByTestId('select-locationId').click().catch(async () => {
            await page.getByRole('combobox').nth(1).click();
        });
        await page.getByRole('option').first().click();

        await page.keyboard.press('Escape');
        await page.getByTestId('select-seasonId').click().catch(async () => {
            await page.getByRole('combobox').nth(2).click();
        });
        await page.getByRole('option').first().click();

        // Guardar
        await page.getByRole('button', { name: /guardar|save/i }).click();

        // Validar que no hay errores relevantes
        expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);

        // Esperar que aparezca en el grid
        await expect(page.getByText('Torneo Playwright INDIV')).toBeVisible();
    });
});



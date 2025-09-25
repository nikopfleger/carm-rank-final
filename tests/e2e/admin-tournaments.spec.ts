import { expect, test, type ConsoleMessage, type Page, type Request } from '@playwright/test';

test.describe('Admin ABM Tournaments - estabilidad', () => {
    test('no entra en loop de requests ni refresh inesperado', async ({ page }: { page: Page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg: ConsoleMessage) => {
            if (msg.type() !== 'error') return;
            const text = msg.text();
            if (text.includes('Content Security Policy') || text.includes('va.vercel-scripts.com')) return;
            consoleErrors.push(text);
        });

        // Contador de requests a /api/abm/tournaments
        let tournamentsRequests = 0;
        page.on('request', (req: Request) => {
            const url = req.url();
            if (url.includes('/api/abm/tournaments')) tournamentsRequests += 1;
        });

        await page.goto('/admin/abm/tournaments');

        // Heading principal
        await expect(page.getByRole('heading', { name: 'Torneos', level: 1 })).toBeVisible();

        // Muestreo de estabilidad
        const snapshots: number[] = [];
        for (let i = 0; i < 3; i++) {
            await page.waitForTimeout(1000);
            snapshots.push(tournamentsRequests);
        }

        const first = snapshots[0] ?? 0;
        const last = snapshots[snapshots.length - 1] ?? 0;
        const delta = last - first;
        expect(delta).toBeLessThanOrEqual(2);

        expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);

        // Verificar que el buscador del grid está visible (placeholder conocido)
        await expect(page.getByPlaceholder('Buscar torneos...')).toBeVisible();
    });
});



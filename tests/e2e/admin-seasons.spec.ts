import { expect, test, type ConsoleMessage, type Page, type Request } from '@playwright/test';

test.describe('Admin ABM Seasons - estabilidad', () => {
    test('no entra en loop de requests ni refresh inesperado', async ({ page }: { page: Page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg: ConsoleMessage) => {
            if (msg.type() !== 'error') return;
            const text = msg.text();
            // Ignorar errores de CSP/vercel scripts que no afectan la lógica de la página
            if (text.includes('Content Security Policy') || text.includes('va.vercel-scripts.com')) return;
            consoleErrors.push(text);
        });

        // Contador de requests a /api/abm/seasons
        let seasonsRequests = 0;
        page.on('request', (req: Request) => {
            const url = req.url();
            if (url.includes('/api/abm/seasons')) seasonsRequests += 1;
        });

        // Navegar directo a la página con bypass de auth
        await page.goto('/admin/abm/seasons');

        // Esperar a que renderice el heading principal
        await expect(page.getByRole('heading', { name: 'Administración de Temporadas', level: 1 })).toBeVisible();

        // Esperar estabilización: si hay loop, requests crecerán sin parar
        // Muestreamos 3 ventanas de 1s y validamos que no crece > umbral
        const snapshots: number[] = [];
        for (let i = 0; i < 3; i++) {
            await page.waitForTimeout(1000);
            snapshots.push(seasonsRequests);
        }

        // Si hay loop, el último será mucho mayor que el primero
        const first = snapshots[0] ?? 0;
        const last = snapshots[snapshots.length - 1] ?? 0;
        const delta = last - first;

        // Permite hasta 2 solicitudes adicionales (algún refresh manual)
        expect(delta).toBeLessThanOrEqual(2);

        // Verificar que no hay errores de consola
        expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0);

        // Además, aseguramos que hay datos o estado vacío visible
        await expect(
            page.getByText(/Temporada guardada correctamente|No hay temporadas registradas|Nombre/i)
        ).toBeVisible();
    });
});



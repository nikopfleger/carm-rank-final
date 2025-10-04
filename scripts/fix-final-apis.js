const fs = require('fs');
const path = require('path');

// Lista de archivos que aún necesitan serialización
const filesToProcess = [
    'app/api/abm/validate-unique/route.ts',
    'app/api/admin/email-accounts/route.ts',
    'app/api/admin/warmup/route.ts',
    'app/api/auth/assign-role/route.ts',
    'app/api/auth/check-user/route.ts',
    'app/api/auth/validate-session/route.ts',
    'app/api/common/route.ts',
    'app/api/config/dan-configs/route.ts',
    'app/api/config/status/route.ts',
    'app/api/debug/cache/route.ts',
    'app/api/games/add/route.ts',
    'app/api/games/add-single/route.ts',
    'app/api/games/calculate/route.ts',
    'app/api/games/date-range/route.ts',
    'app/api/games/history/route.ts',
    'app/api/games/next-game-number/route.ts',
    'app/api/games/pending/route.ts',
    'app/api/games/submit-pending/route.ts',
    'app/api/games/validation-stats/route.ts',
    'app/api/health/route.ts',
    'app/api/health/redis/route.ts',
    'app/api/internal/health/route.ts',
    'app/api/internal/init/route.ts',
    'app/api/internal/test-pooling/route.ts',
    'app/api/link-requests/route.ts',
    'app/api/link-requests/unlink/route.ts',
    'app/api/players/create/route.ts'
];

function processFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`⏭️  ${filePath} - No existe`);
            return false;
        }

        let content = fs.readFileSync(filePath, 'utf8');

        // Verificar si ya tiene la importación
        if (content.includes('serializeBigInt')) {
            console.log(`✅ ${filePath} - Ya procesado`);
            return false;
        }

        // Verificar si usa NextResponse.json
        if (!content.includes('NextResponse.json')) {
            console.log(`⏭️  ${filePath} - No usa NextResponse.json`);
            return false;
        }

        let modified = false;

        // Agregar importación después de la primera importación
        const firstImport = content.match(/import.*from.*['"].*['"];?\s*\n/);
        if (firstImport) {
            const newImport = `${firstImport[0]}import { serializeBigInt } from '@/lib/serialize-bigint';\n`;
            content = content.replace(firstImport[0], newImport);
            modified = true;
        }

        // Aplicar serialización a NextResponse.json calls simples
        const simpleJsonRegex = /NextResponse\.json\(([^,)]+)\)(?!\s*,)/g;
        if (simpleJsonRegex.test(content)) {
            content = content.replace(simpleJsonRegex, 'NextResponse.json(serializeBigInt($1))');
            modified = true;
        }

        // Aplicar serialización a NextResponse.json calls con opciones
        const jsonWithOptionsRegex = /NextResponse\.json\(([^,)]+),\s*\{[^}]*\}\)/g;
        if (jsonWithOptionsRegex.test(content)) {
            content = content.replace(jsonWithOptionsRegex, 'NextResponse.json(serializeBigInt($1), $2)');
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ ${filePath} - Procesado`);
            return true;
        } else {
            console.log(`⚠️  ${filePath} - No se pudo procesar automáticamente`);
            return false;
        }

    } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
        return false;
    }
}

// Ejecutar
console.log('🔧 Procesando archivos de API finales...\n');

let processedCount = 0;
let skippedCount = 0;

for (const file of filesToProcess) {
    if (processFile(file)) {
        processedCount++;
    } else {
        skippedCount++;
    }
}

console.log(`\n🎉 Proceso completado:`);
console.log(`   ✅ Archivos procesados: ${processedCount}`);
console.log(`   ⏭️  Archivos omitidos: ${skippedCount}`);
console.log(`   📁 Total de archivos: ${filesToProcess.length}`);

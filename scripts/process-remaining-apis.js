const fs = require('fs');
const path = require('path');

// Lista de archivos específicos que sabemos que necesitan serialización
const filesToProcess = [
    'app/api/abm/season-results/[id]/restore/route.ts',
    'app/api/abm/tournament-results/[id]/route.ts',
    'app/api/abm/tournament-results/[id]/finalize/route.ts',
    'app/api/abm/tournament-results/[id]/restore/route.ts',
    'app/api/abm/tournaments/[id]/close/route.ts',
    'app/api/abm/tournaments/[id]/finalize/route.ts',
    'app/api/admin/users/[id]/route.ts',
    'app/api/admin/link-requests/[id]/route.ts',
    'app/api/admin/link-requests/[id]/approve/route.ts',
    'app/api/admin/link-requests/[id]/reject/route.ts',
    'app/api/admin/statistics/route.ts',
    'app/api/players/[legajo]/route.ts',
    'app/api/players/[legajo]/update/route.ts',
    'app/api/players/search/route.ts',
    'app/api/players/count-games/route.ts',
    'app/api/players/check-legajo/route.ts',
    'app/api/players/check-nickname/route.ts',
    'app/api/players/link-status/route.ts',
    'app/api/players/my-link-requests/route.ts',
    'app/api/seasons/[id]/route.ts',
    'app/api/seasons/[id]/close/route.ts',
    'app/api/tournaments/[id]/route.ts',
    'app/api/tournaments/[id]/finalize/route.ts'
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
console.log('🔧 Procesando archivos de API restantes...\n');

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

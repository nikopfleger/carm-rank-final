const fs = require('fs');
const path = require('path');

// Lista de archivos que ya tienen serialización aplicada
const alreadyFixed = new Set([
    'app/api/players/route.ts',
    'app/api/admin/dashboard-stats/route.ts',
    'app/api/tournaments/route.ts',
    'app/api/players/debug/route.ts',
    'app/api/players/[legajo]/profile/route.ts',
    'app/api/seasons/route.ts',
    'app/api/config/cache/route.ts',
    'app/api/rulesets/route.ts',
    'app/api/tournaments/active/route.ts',
    'app/api/abm/[resource]/route.ts',
    'app/api/abm/[resource]/[id]/route.ts',
    'app/api/abm/[resource]/[id]/restore/route.ts',
    'app/api/config/dan/route.ts',
    'app/api/config/rate/route.ts',
    'app/api/config/season/route.ts',
    'app/api/abm/tournament-results/route.ts'
]);

// Función para aplicar serialización a un archivo
function fixFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Verificar si ya tiene la importación
        if (content.includes('serializeBigInt')) {
            console.log(`✅ ${filePath} ya tiene serialización aplicada`);
            return false;
        }

        // Verificar si usa NextResponse.json
        if (!content.includes('NextResponse.json')) {
            console.log(`⏭️  ${filePath} no usa NextResponse.json`);
            return false;
        }

        let modified = false;

        // Agregar importación
        const importRegex = /import.*from.*['"]next\/server['"];?\s*\n/;
        const nextServerImport = content.match(importRegex);

        if (nextServerImport) {
            // Reemplazar la importación existente
            const newImport = `import { serializeBigInt } from '@/lib/serialize-bigint';\n${nextServerImport[0]}`;
            content = content.replace(nextServerImport[0], newImport);
            modified = true;
        } else {
            // Buscar la primera importación y agregar después
            const firstImport = content.match(/import.*from.*['"].*['"];?\s*\n/);
            if (firstImport) {
                const newImport = `${firstImport[0]}import { serializeBigInt } from '@/lib/serialize-bigint';\n`;
                content = content.replace(firstImport[0], newImport);
                modified = true;
            }
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
            console.log(`✅ ${filePath} - Serialización aplicada`);
            return true;
        } else {
            console.log(`⚠️  ${filePath} - No se pudo aplicar serialización automáticamente`);
            return false;
        }

    } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
        return false;
    }
}

// Función para buscar TODOS los archivos de API
function findAllApiFiles(dir) {
    const files = [];

    function traverse(currentDir) {
        try {
            const items = fs.readdirSync(currentDir);

            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    traverse(fullPath);
                } else if (item === 'route.ts' && currentDir.includes('app/api')) {
                    const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
                    files.push(relativePath);
                }
            }
        } catch (error) {
            console.warn(`⚠️  No se pudo acceder a ${currentDir}: ${error.message}`);
        }
    }

    traverse(dir);
    return files;
}

// Ejecutar el script
console.log('🔧 Aplicando serialización BigInt a TODOS los archivos de API...\n');

const apiFiles = findAllApiFiles('app/api');
let fixedCount = 0;
let skippedCount = 0;

console.log(`📁 Encontrados ${apiFiles.length} archivos de API\n`);

for (const file of apiFiles) {
    if (alreadyFixed.has(file)) {
        console.log(`✅ ${file} - Ya procesado anteriormente`);
        skippedCount++;
        continue;
    }

    if (fixFile(file)) {
        fixedCount++;
    } else {
        skippedCount++;
    }
}

console.log(`\n🎉 Proceso completado:`);
console.log(`   ✅ Archivos procesados: ${fixedCount}`);
console.log(`   ⏭️  Archivos omitidos: ${skippedCount}`);
console.log(`   📁 Total de archivos: ${apiFiles.length}`);

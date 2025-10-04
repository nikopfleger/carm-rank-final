const fs = require('fs');
const path = require('path');

// Lista de archivos de API que ya tienen serialización aplicada
const alreadyFixed = [
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
];

// Función para aplicar serialización a un archivo
function fixFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Verificar si ya tiene la importación
        if (content.includes('serializeBigInt')) {
            console.log(`✅ ${filePath} ya tiene serialización aplicada`);
            return;
        }

        // Verificar si usa NextResponse.json
        if (!content.includes('NextResponse.json')) {
            console.log(`⏭️  ${filePath} no usa NextResponse.json`);
            return;
        }

        // Agregar importación
        const importRegex = /import.*from.*['"]next\/server['"];?\s*\n/;
        const nextServerImport = content.match(importRegex);

        if (nextServerImport) {
            // Reemplazar la importación existente
            content = content.replace(
                nextServerImport[0],
                `import { serializeBigInt } from '@/lib/serialize-bigint';\n${nextServerImport[0]}`
            );
        } else {
            // Agregar importación al principio
            const firstImport = content.match(/import.*from.*['"].*['"];?\s*\n/);
            if (firstImport) {
                content = content.replace(
                    firstImport[0],
                    `${firstImport[0]}import { serializeBigInt } from '@/lib/serialize-bigint';\n`
                );
            }
        }

        // Aplicar serialización a NextResponse.json calls
        content = content.replace(
            /NextResponse\.json\(([^,)]+)\)/g,
            'NextResponse.json(serializeBigInt($1))'
        );

        // Aplicar serialización a NextResponse.json calls con opciones
        content = content.replace(
            /NextResponse\.json\(([^,)]+),\s*\{[^}]*\}\)/g,
            'NextResponse.json(serializeBigInt($1), $2)'
        );

        fs.writeFileSync(filePath, content);
        console.log(`✅ ${filePath} - Serialización aplicada`);

    } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
    }
}

// Función para buscar archivos de API
function findApiFiles(dir) {
    const files = [];

    function traverse(currentDir) {
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
    }

    traverse(dir);
    return files;
}

// Ejecutar el script
console.log('🔧 Aplicando serialización BigInt a archivos de API...\n');

const apiFiles = findApiFiles('app/api');
let fixedCount = 0;

for (const file of apiFiles) {
    if (!alreadyFixed.includes(file)) {
        fixFile(file);
        fixedCount++;
    }
}

console.log(`\n🎉 Proceso completado. ${fixedCount} archivos procesados.`);

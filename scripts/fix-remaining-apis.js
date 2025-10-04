const fs = require('fs');
const path = require('path');

// Función para aplicar serialización a un archivo
function fixFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Verificar si ya tiene la importación
        if (content.includes('serializeBigInt')) {
            return false; // Ya procesado
        }

        // Verificar si usa NextResponse.json
        if (!content.includes('NextResponse.json')) {
            return false; // No usa NextResponse.json
        }

        let modified = false;

        // Agregar importación después de la primera importación
        const firstImport = content.match(/import.*from.*['"].*['"];?\s*\n/);
        if (firstImport) {
            const newImport = `${firstImport[0]}import { serializeBigInt } from '@/lib/serialize-bigint';\n`;
            content = content.replace(firstImport[0], newImport);
            modified = true;
        }

        // Aplicar serialización a NextResponse.json calls
        const jsonRegex = /NextResponse\.json\(([^,)]+)\)(?!\s*,)/g;
        if (jsonRegex.test(content)) {
            content = content.replace(jsonRegex, 'NextResponse.json(serializeBigInt($1))');
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
            return true;
        }

        return false;

    } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
        return false;
    }
}

// Función para buscar archivos de API
function findApiFiles() {
    const files = [];

    function traverse(dir) {
        try {
            const items = fs.readdirSync(dir);

            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    traverse(fullPath);
                } else if (item === 'route.ts' && dir.includes('app/api')) {
                    const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
                    files.push(relativePath);
                }
            }
        } catch (error) {
            // Ignorar errores de acceso
        }
    }

    traverse('app/api');
    return files;
}

// Ejecutar
console.log('🔧 Procesando archivos de API restantes...\n');

const apiFiles = findApiFiles();
let fixedCount = 0;

for (const file of apiFiles) {
    if (fixFile(file)) {
        console.log(`✅ ${file} - Serialización aplicada`);
        fixedCount++;
    }
}

console.log(`\n🎉 Proceso completado. ${fixedCount} archivos procesados.`);

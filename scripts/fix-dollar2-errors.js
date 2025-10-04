const fs = require('fs');
const path = require('path');

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

function fixFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Verificar si tiene $2
        if (!content.includes('$2')) {
            return false;
        }

        let modified = false;

        // Reemplazar $2 con { status: 500 } en NextResponse.json calls
        const dollar2Regex = /NextResponse\.json\([^,)]+,\s*\$2\)/g;
        if (dollar2Regex.test(content)) {
            content = content.replace(dollar2Regex, (match) => {
                return match.replace(/\$2/, '{ status: 500 }');
            });
            modified = true;
        }

        // Reemplazar $2 con { status: 409 } en casos específicos de optimistic locking
        const optimisticLockingRegex = /NextResponse\.json\([^,)]+,\s*\$2\)/g;
        if (optimisticLockingRegex.test(content)) {
            content = content.replace(optimisticLockingRegex, (match) => {
                // Si contiene "optimistic locking" o "versión", usar 409, sino 500
                if (match.includes('optimistic') || match.includes('versión') || match.includes('version')) {
                    return match.replace(/\$2/, '{ status: 409 }');
                } else {
                    return match.replace(/\$2/, '{ status: 500 }');
                }
            });
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

// Ejecutar
console.log('🔧 Corrigiendo errores de $2...\n');

const apiFiles = findApiFiles();
let fixedCount = 0;

for (const file of apiFiles) {
    if (fixFile(file)) {
        console.log(`✅ ${file} - Corregido`);
        fixedCount++;
    }
}

console.log(`\n🎉 Proceso completado. ${fixedCount} archivos corregidos.`);

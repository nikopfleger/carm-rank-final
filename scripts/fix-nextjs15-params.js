const fs = require('fs');
const path = require('path');

// Lista de archivos que necesitan ser actualizados
const files = [
    'app/api/games/images/[filename]/route.ts',
    'app/api/players/[legajo]/profile/route.ts',
    'app/api/players/[legajo]/history/route.ts',
    'app/api/players/[legajo]/update/route.ts',
    'app/api/players/[legajo]/route.ts',
    'app/api/players/by-legajo/[legajo]/route.ts',
    'app/api/i18n/[language]/route.ts',
    'app/api/images/[...path]/route.ts'
];

function fixFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Archivo no encontrado: ${filePath}`);
            return false;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Patrón general para cualquier tipo de parámetro
        const paramPattern = /\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{([^}]+)\}\s*\}/g;
        const matches = [...content.matchAll(paramPattern)];

        if (matches.length > 0) {
            for (const match of matches) {
                const paramTypes = match[1];
                const newSignature = `{ params }: { params: Promise<{${paramTypes}}> }`;
                content = content.replace(match[0], newSignature);
                modified = true;
            }
        }

        // Buscar destructuring de params y agregar await
        const destructurePattern = /const\s*\{\s*([^}]+)\s*\}\s*=\s*params;/g;
        const destructureMatches = [...content.matchAll(destructurePattern)];

        if (destructureMatches.length > 0 && !content.includes('await params')) {
            for (const match of destructureMatches) {
                const destructuredVars = match[1];
                const newDestructure = `const { ${destructuredVars} } = await params;`;
                content = content.replace(match[0], newDestructure);
                modified = true;
            }
        }

        // Buscar acceso directo a params.property
        const directAccessPattern = /params\.(\w+)/g;
        const directMatches = [...content.matchAll(directAccessPattern)];

        if (directMatches.length > 0 && !content.includes('await params')) {
            // Encontrar todas las propiedades accedidas
            const properties = [...new Set(directMatches.map(m => m[1]))];
            const destructureVars = properties.join(', ');

            // Agregar destructuring al inicio de la función
            const functionBodyStart = content.indexOf('{', content.indexOf('async function')) + 1;
            const beforeTry = content.indexOf('try {');

            if (beforeTry > functionBodyStart) {
                const insertPoint = beforeTry;
                const destructureCode = `    const { ${destructureVars} } = await params;\n    `;
                content = content.slice(0, insertPoint) + destructureCode + content.slice(insertPoint);

                // Reemplazar accesos directos
                for (const prop of properties) {
                    content = content.replace(new RegExp(`params\\.${prop}`, 'g'), prop);
                }
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Actualizado: ${filePath}`);
            return true;
        } else {
            console.log(`ℹ️  Sin cambios: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
        return false;
    }
}

console.log('🔧 Iniciando corrección de parámetros para Next.js 15...\n');

let totalFixed = 0;
for (const file of files) {
    if (fixFile(file)) {
        totalFixed++;
    }
}

console.log(`\n🎉 Proceso completado. ${totalFixed} archivos actualizados.`);

const fs = require('fs');
const path = require('path');

// Lista de archivos que tienen $2
const filesWithDollar2 = [
    'app/api/admin/email-accounts/route.ts',
    'app/api/auth/assign-role/route.ts',
    'app/api/auth/check-user/route.ts',
    'app/api/config/dan-configs/route.ts',
    'app/api/link-requests/route.ts',
    'app/api/link-requests/unlink/route.ts',
    'app/api/players/check-legajo/route.ts',
    'app/api/players/check-nickname/route.ts',
    'app/api/players/link-status/route.ts',
    'app/api/players/my-link-requests/route.ts'
];

function fixFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`⏭️  ${filePath} - No existe`);
            return false;
        }

        let content = fs.readFileSync(filePath, 'utf8');

        // Verificar si tiene $2
        if (!content.includes('$2')) {
            console.log(`✅ ${filePath} - Ya corregido`);
            return false;
        }

        let modified = false;

        // Reemplazar $2 con el status code apropiado
        // Para errores de validación usar 400, para errores internos usar 500, para éxito usar 201
        const replacements = [
            // Errores de validación (400)
            {
                pattern: /NextResponse\.json\([^,)]+,\s*\$2\)/g, replacement: (match) => {
                    if (match.includes('requerido') || match.includes('faltante') || match.includes('inválido') || match.includes('invalid')) {
                        return match.replace(/\$2/, '{ status: 400 }');
                    } else if (match.includes('creado') || match.includes('created') || match.includes('success')) {
                        return match.replace(/\$2/, '{ status: 201 }');
                    } else {
                        return match.replace(/\$2/, '{ status: 500 }');
                    }
                }
            }
        ];

        for (const { pattern, replacement } of replacements) {
            if (pattern.test(content)) {
                content = content.replace(pattern, replacement);
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ ${filePath} - Corregido`);
            return true;
        }

        return false;

    } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
        return false;
    }
}

// Ejecutar
console.log('🔧 Corrigiendo todos los errores de $2...\n');

let fixedCount = 0;

for (const file of filesWithDollar2) {
    if (fixFile(file)) {
        fixedCount++;
    }
}

console.log(`\n🎉 Proceso completado. ${fixedCount} archivos corregidos.`);

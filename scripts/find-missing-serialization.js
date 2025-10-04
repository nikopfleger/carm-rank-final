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

function checkFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Verificar si usa NextResponse.json
        if (!content.includes('NextResponse.json')) {
            return { status: 'no-json', reason: 'No usa NextResponse.json' };
        }

        // Verificar si ya tiene serializeBigInt
        if (content.includes('serializeBigInt')) {
            return { status: 'already-fixed', reason: 'Ya tiene serializeBigInt' };
        }

        return { status: 'needs-fix', reason: 'Usa NextResponse.json pero no tiene serializeBigInt' };

    } catch (error) {
        return { status: 'error', reason: error.message };
    }
}

// Ejecutar
console.log('🔍 Buscando archivos que necesitan serialización...\n');

const apiFiles = findApiFiles();
const results = {
    'needs-fix': [],
    'already-fixed': [],
    'no-json': [],
    'error': []
};

for (const file of apiFiles) {
    const result = checkFile(file);
    results[result.status].push({ file, reason: result.reason });
}

console.log(`📊 Resumen:`);
console.log(`   🔧 Necesitan corrección: ${results['needs-fix'].length}`);
console.log(`   ✅ Ya corregidos: ${results['already-fixed'].length}`);
console.log(`   ⏭️  No usan JSON: ${results['no-json'].length}`);
console.log(`   ❌ Errores: ${results['error'].length}`);
console.log(`   📁 Total archivos: ${apiFiles.length}`);

if (results['needs-fix'].length > 0) {
    console.log(`\n🔧 Archivos que necesitan corrección:`);
    results['needs-fix'].forEach(({ file, reason }) => {
        console.log(`   - ${file} (${reason})`);
    });
}

if (results['error'].length > 0) {
    console.log(`\n❌ Archivos con errores:`);
    results['error'].forEach(({ file, reason }) => {
        console.log(`   - ${file} (${reason})`);
    });
}

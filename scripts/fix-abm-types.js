const fs = require('fs');
const path = require('path');

// Lista de archivos ABM que necesitan ser actualizados
const files = [
    'app/admin/abm/tournament-results/page.tsx',
    'app/admin/abm/countries/page.tsx',
    'app/admin/abm/online-users/page.tsx',
    'app/admin/abm/players/page.tsx',
    'app/admin/abm/season-results/page.tsx',
    'app/admin/abm/seasons/page.tsx',
    'app/admin/abm/tournaments/page.tsx',
    'app/admin/abm/uma/page.tsx'
];

function fixFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Archivo no encontrado: ${filePath}`);
            return false;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Patrón para arreglar columns con tipos
        const columnsPattern = /const columns = \[([\s\S]*?)\];/;
        const columnsMatch = content.match(columnsPattern);

        if (columnsMatch) {
            let columnsContent = columnsMatch[1];

            // Agregar 'as const' a los tipos que no lo tienen
            const typePattern = /type: "(\w+)"/g;
            const newColumnsContent = columnsContent.replace(typePattern, 'type: "$1" as const');

            // Agregar tipo por defecto a columnas sin tipo
            const noTypePattern = /\{\s*key:\s*"(\w+)",\s*label:\s*"([^"]+)",\s*sortable:\s*(true|false)\s*\}/g;
            const finalColumnsContent = newColumnsContent.replace(noTypePattern, (match, key, label, sortable) => {
                // Determinar tipo basado en el nombre de la columna
                let type = 'text';
                if (key === 'id' || key === 'version' || key.includes('Count') || key.includes('Amount')) {
                    type = 'number';
                } else if (key.includes('At') || key.includes('Date')) {
                    type = 'date';
                } else if (key.includes('Active') || key.includes('deleted') || key.includes('Deleted')) {
                    type = 'boolean';
                }

                return `{ key: "${key}", label: "${label}", sortable: ${sortable}, type: "${type}" as const }`;
            });

            if (finalColumnsContent !== columnsContent) {
                const newContent = content.replace(columnsPattern, `const columns = [${finalColumnsContent}];`);
                content = newContent;
                modified = true;
            }
        }

        // Patrón para arreglar formFields con tipos
        const formFieldsPattern = /const formFields = \[([\s\S]*?)\];/;
        const formFieldsMatch = content.match(formFieldsPattern);

        if (formFieldsMatch) {
            let formFieldsContent = formFieldsMatch[1];

            // Agregar 'as const' a los tipos
            const formTypePattern = /type: "(\w+)"/g;
            const newFormFieldsContent = formFieldsContent.replace(formTypePattern, 'type: "$1" as const');

            if (newFormFieldsContent !== formFieldsContent) {
                const newContent = content.replace(formFieldsPattern, `const formFields = [${newFormFieldsContent}];`);
                content = newContent;
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

console.log('🔧 Iniciando corrección de tipos ABM...\n');

let totalFixed = 0;
for (const file of files) {
    if (fixFile(file)) {
        totalFixed++;
    }
}

console.log(`\n🎉 Proceso completado. ${totalFixed} archivos actualizados.`);

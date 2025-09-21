#!/usr/bin/env node

/**
 * Script para ejecutar comandos de Prisma usando variables JDBC
 * Convierte JDBC_URL, JDBC_USER, JDBC_PASS a DATABASE_URL temporalmente
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Importar crypto helper (ya es una instancia)
const cryptoHelper = require('../lib/crypto-helper.js');

function generateDatabaseUrl() {
    // Cargar variables de entorno desde .env
    require('dotenv').config();

    const jdbcUrl = process.env.JDBC_URL;
    const jdbcUser = process.env.JDBC_USER;
    const jdbcPass = process.env.JDBC_PASS;

    if (!jdbcUrl || !jdbcUser || !jdbcPass) {
        console.error('❌ Error: JDBC_URL, JDBC_USER o JDBC_PASS no están configuradas en .env');
        process.exit(1);
    }

    try {
        // Usar la misma lógica que crypto-helper.js
        const databaseUrl = cryptoHelper.getDecryptedDatabaseUrl();
        return databaseUrl;
    } catch (error) {
        console.error('❌ Error generando DATABASE_URL:', error.message);
        process.exit(1);
    }
}

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Uso: node scripts/prisma-with-jdbc.js <comando-prisma>');
        console.log('Ejemplo: node scripts/prisma-with-jdbc.js migrate dev --name mi_migracion');
        process.exit(1);
    }

    // Generar DATABASE_URL
    const databaseUrl = generateDatabaseUrl();
    console.log('✅ DATABASE_URL generada exitosamente');

    // Ejecutar comando de Prisma con DATABASE_URL
    const prismaCommand = `npx prisma ${args.join(' ')}`;
    console.log(`🚀 Ejecutando: ${prismaCommand}`);

    try {
        execSync(prismaCommand, {
            stdio: 'inherit',
            env: {
                ...process.env,
                DATABASE_URL: databaseUrl
            }
        });
    } catch (error) {
        console.error('❌ Error ejecutando comando de Prisma');
        process.exit(1);
    }
}

main();

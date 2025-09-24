#!/usr/bin/env tsx

/**
 * Script para verificar la configuración de conexión dinámica
 * Basado en la solución de Digital Ocean para prepared statements
 */

import { getDatabaseUrl, getDirectUrl, getPrismaConfig, logConnectionInfo } from '../lib/database/connection-config';

function testConnectionConfig() {
    console.log('🔍 Verificando configuración de conexión dinámica...\n');

    // Mostrar información del stage actual
    const stage = process.env.STAGE || 'development';
    console.log(`📋 Stage actual: ${stage}`);

    // Mostrar URLs configuradas
    console.log('\n🔗 URLs de conexión:');
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Configurada' : '❌ No configurada'}`);
    console.log(`DATABASE_URL_MIGRATE: ${process.env.DATABASE_URL_MIGRATE ? '✅ Configurada' : '❌ No configurada'}`);
    console.log(`DATABASE_URL_POOL: ${process.env.DATABASE_URL_POOL ? '✅ Configurada' : '❌ No configurada'}`);
    console.log(`POSTGRES_URL_NON_POOLING: ${process.env.POSTGRES_URL_NON_POOLING ? '✅ Configurada' : '❌ No configurada'}`);

    // Mostrar URL seleccionada
    const selectedUrl = getDatabaseUrl();
    const directUrl = getDirectUrl();

    console.log('\n🎯 URL seleccionada:');
    console.log(`URL: ${selectedUrl.replace(/:[^:]*@/, ':***@')}`);
    if (directUrl && directUrl !== selectedUrl) {
        console.log(`Direct URL: ${directUrl.replace(/:[^:]*@/, ':***@')}`);
    }

    // Verificar configuración de Prisma
    console.log('\n⚙️  Configuración de Prisma:');
    const prismaConfig = getPrismaConfig();
    console.log(`URL: ${prismaConfig.url.replace(/:[^:]*@/, ':***@')}`);
    if (prismaConfig.directUrl) {
        console.log(`Direct URL: ${prismaConfig.directUrl.replace(/:[^:]*@/, ':***@')}`);
    }

    // Verificar flags importantes
    console.log('\n🚩 Flags de conexión:');
    if (selectedUrl.includes('pgbouncer=true')) {
        console.log('✅ Connection pooling habilitado (pgbouncer=true)');
    } else {
        console.log('⚠️  Connection pooling NO habilitado');
    }

    if (selectedUrl.includes('prepareThreshold=0')) {
        console.log('✅ Prepared statements deshabilitados (prepareThreshold=0)');
    } else {
        console.log('⚠️  Prepared statements habilitados (puede causar errores)');
    }

    if (selectedUrl.includes('connection_limit=')) {
        const match = selectedUrl.match(/connection_limit=(\d+)/);
        if (match) {
            console.log(`✅ Connection limit configurado: ${match[1]}`);
        }
    }

    if (selectedUrl.includes('connection_timeout=')) {
        const match = selectedUrl.match(/connection_timeout=(\d+)/);
        if (match) {
            console.log(`✅ Connection timeout configurado: ${match[1]}s`);
        }
    }

    // Mostrar información de logging
    console.log('\n📊 Información de logging:');
    logConnectionInfo();

    console.log('\n✅ Verificación completada');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    testConnectionConfig();
}

export { testConnectionConfig };


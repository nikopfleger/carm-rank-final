#!/usr/bin/env node

/**
 * Script para verificar la configuración de autenticación
 * Ejecutar con: node scripts/check-auth-config.js
 */

// Cargar variables de entorno desde .env
require('dotenv').config();

console.log('🔍 Verificando configuración de autenticación...\n');

// Verificar variables de entorno críticas
const requiredEnvVars = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
];

let hasErrors = false;

console.log('📋 Variables de entorno:');
requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '***' : value}`);
    } else {
        console.log(`❌ ${varName}: NO CONFIGURADA`);
        hasErrors = true;
    }
});

console.log('\n🌐 Configuración de red:');
console.log(`✅ NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

if (process.env.NEXTAUTH_URL) {
    try {
        const url = new URL(process.env.NEXTAUTH_URL);
        console.log(`✅ Protocolo: ${url.protocol}`);
        console.log(`✅ Host: ${url.host}`);
        console.log(`✅ Puerto: ${url.port || (url.protocol === 'https:' ? '443' : '80')}`);

        // Verificar que sea HTTPS en producción
        if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
            console.log('⚠️  ADVERTENCIA: Usando HTTP en producción');
        }
    } catch (error) {
        console.log(`❌ NEXTAUTH_URL inválida: ${error.message}`);
        hasErrors = true;
    }
}

console.log('\n🔐 Verificaciones de seguridad:');
if (process.env.NEXTAUTH_SECRET) {
    const secretLength = process.env.NEXTAUTH_SECRET.length;
    if (secretLength >= 32) {
        console.log(`✅ NEXTAUTH_SECRET: ${secretLength} caracteres (OK)`);
    } else {
        console.log(`⚠️  NEXTAUTH_SECRET: ${secretLength} caracteres (recomendado: 32+)`);
    }
} else {
    console.log('❌ NEXTAUTH_SECRET: NO CONFIGURADA');
}

console.log('\n📝 URLs importantes para verificar:');
if (process.env.NEXTAUTH_URL) {
    const baseUrl = process.env.NEXTAUTH_URL;
    console.log(`🔗 Providers: ${baseUrl}/api/auth/providers`);
    console.log(`🔗 Session: ${baseUrl}/api/auth/session`);
    console.log(`🔗 SignIn: ${baseUrl}/api/auth/signin`);
    console.log(`🔗 Callback: ${baseUrl}/api/auth/callback/google`);
}

console.log('\n📋 Configuración de Google OAuth:');
console.log('Verifica en Google Cloud Console que tengas configurado:');
console.log(`✅ Authorized redirect URIs: ${process.env.NEXTAUTH_URL}/api/auth/callback/google`);
console.log(`✅ Authorized JavaScript origins: ${process.env.NEXTAUTH_URL}`);

if (hasErrors) {
    console.log('\n❌ Se encontraron errores de configuración');
    console.log('📖 Lee el archivo scripts/fix-ddns-auth.md para más detalles');
    process.exit(1);
} else {
    console.log('\n✅ Configuración básica correcta');
    console.log('💡 Si sigues teniendo problemas, verifica Google OAuth Console');
}

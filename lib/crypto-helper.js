const crypto = require('crypto');

// Solo importar fs y path en el servidor
let fs, path;
if (typeof window === 'undefined') {
    fs = require('fs');
    path = require('path');
}

class CryptoHelper {
    constructor() {
        this.privateKeyPath = path ? path.join(process.cwd(), 'keys', 'private_PKCS#8.key') : null;
    }

    // Desencriptar contraseña de base de datos
    decryptDatabasePassword(encryptedPassword) {
        try {
            // Obtener clave privada desde variable de entorno o archivo
            let privateKey = process.env.PRIVATE_KEY;

            if (!privateKey) {
                // Fallback al archivo local (solo para desarrollo)
                if (fs && this.privateKeyPath && fs.existsSync(this.privateKeyPath)) {
                    privateKey = fs.readFileSync(this.privateKeyPath, 'utf8');
                    console.warn('⚠️ Usando clave privada del archivo local (solo desarrollo)');
                } else {
                    console.warn('⚠️ No se encontró clave privada en PRIVATE_KEY ni archivo local, usando contraseña sin encriptar');
                    return encryptedPassword;
                }
            }

            // Formatear la clave privada si no tiene headers
            privateKey = this.formatPrivateKey(privateKey);

            // Si la contraseña no parece estar encriptada (no es base64 válido), devolverla tal como está
            if (!this.isBase64(encryptedPassword)) {
                return encryptedPassword;
            }

            const buffer = Buffer.from(encryptedPassword, 'base64');
            const decrypted = crypto.privateDecrypt(privateKey, buffer);
            return decrypted.toString('utf8');
        } catch (error) {
            console.warn('⚠️ Error desencriptando contraseña, usando contraseña sin encriptar:', error.message);
            return encryptedPassword;
        }
    }

    // Formatear clave privada para que tenga el formato correcto
    formatPrivateKey(privateKey) {
        // Si ya tiene headers, devolverla tal como está
        if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
            return privateKey;
        }

        // Si no tiene headers, agregarlos
        const cleanKey = privateKey.replace(/\s/g, ''); // Remover espacios en blanco
        const formattedKey = `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;
        return formattedKey;
    }

    // Verificar si una cadena es base64 válido
    isBase64(str) {
        try {
            return btoa(atob(str)) === str;
        } catch (err) {
            return false;
        }
    }

    // Obtener DATABASE_URL desencriptada
    getDecryptedDatabaseUrl() {
        // Verificar si usamos formato JDBC
        const jdbcUrl = process.env.JDBC_URL;
        const jdbcUser = process.env.JDBC_USER;
        const jdbcPass = process.env.JDBC_PASS;

        if (jdbcUrl && jdbcUser && jdbcPass) {

            // Desencriptar contraseña si está encriptada
            let decryptedPass = this.decryptDatabasePassword(jdbcPass);

            // Convertir JDBC a PostgreSQL URL
            const jdbcMatch = jdbcUrl.match(/jdbc:postgresql:\/\/([^:]+):(\d+)\/([^?]+)/);
            if (jdbcMatch) {
                const [, host, port, database] = jdbcMatch;
                return `postgresql://${jdbcUser}:${decryptedPass}@${host}:${port}/${database}`;
            }
        }

        // Si no se encontraron variables JDBC, lanzar error
        throw new Error('JDBC_URL, JDBC_USER o JDBC_PASS no están configuradas. Usa el formato JDBC.');
    }
}

module.exports = new CryptoHelper();

import fs from 'fs';
import path from 'path';

// ============================================================================
// 🚀 SISTEMA DE LOGGING PROFESIONAL
// ============================================================================

interface LogLevel {
  name: string;
  priority: number;
  emoji: string;
}

const LOG_LEVELS: { [key: string]: LogLevel } = {
  DEBUG: { name: 'DEBUG', priority: 0, emoji: '🔍' },
  INFO: { name: 'INFO', priority: 1, emoji: 'ℹ️' },
  WARN: { name: 'WARN', priority: 2, emoji: '⚠️' },
  ERROR: { name: 'ERROR', priority: 3, emoji: '🚨' },
  CRITICAL: { name: 'CRITICAL', priority: 4, emoji: '💥' }
};

class Logger {
  private logDir: string;
  private currentLogFile: string;
  private minLevel: LogLevel;

  constructor() {
    // Obtener directorio de logs desde variable de entorno o usar default
    this.logDir = process.env.LOG_DIR || 'C:\\CARM\\Logs';
    this.minLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'INFO'];
    this.ensureLogDirectory();
    this.currentLogFile = this.getLogFileName();
  }

  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating log directory:', error);
    }
  }

  private getLogFileName(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logDir, `carm-rank-${dateStr}.log`);
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const now = new Date().toISOString();
    const timestamp = now.replace('T', ' ').replace('Z', '');
    const levelStr = level.name.padEnd(7);
    
    let formattedMessage = `[${timestamp}] ${level.emoji} ${levelStr} | ${message}`;
    
    if (data !== undefined) {
      if (typeof data === 'object') {
        formattedMessage += `\n${JSON.stringify(data, null, 2)}`;
      } else {
        formattedMessage += ` | ${data}`;
      }
    }
    
    return formattedMessage;
  }

  private writeToFile(message: string): void {
    try {
      // Verificar si necesitamos cambiar de archivo (nuevo día)
      const expectedFile = this.getLogFileName();
      if (expectedFile !== this.currentLogFile) {
        this.currentLogFile = expectedFile;
      }

      // Escribir al archivo
      fs.appendFileSync(this.currentLogFile, message + '\n', 'utf8');
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (level.priority >= this.minLevel.priority) {
      const formattedMessage = this.formatMessage(level, message, data);
      
      // Escribir a archivo
      this.writeToFile(formattedMessage);
      
      // También mostrar en consola para desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log(formattedMessage);
      }
    }
  }

  // Métodos públicos de logging
  debug(message: string, data?: any): void {
    this.log(LOG_LEVELS.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LOG_LEVELS.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LOG_LEVELS.WARN, message, data);
  }

  error(message: string, data?: any): void {
    this.log(LOG_LEVELS.ERROR, message, data);
  }

  critical(message: string, data?: any): void {
    this.log(LOG_LEVELS.CRITICAL, message, data);
  }

  // Método especial para logging de API
  api(operation: string, data?: any): void {
    this.info(`🚀 API: ${operation}`, data);
  }

  // Método especial para logging de cálculos
  calculation(operation: string, data?: any): void {
    this.info(`🎯 CALCULATION: ${operation}`, data);
  }

  // Método para logging de empates
  tiebreak(operation: string, data?: any): void {
    this.info(`🔄 TIEBREAK: ${operation}`, data);
  }
}

// Crear instancia singleton
const logger = new Logger();

export default logger;
export { Logger };

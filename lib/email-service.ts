import nodemailer from 'nodemailer';
import { prisma } from './database/client';

interface EmailConfig {
    server: string;
    port: number;
    username: string;
    password: string;
    connectionSecurity: string;
    fromAddress: string;
    replyAddress?: string;
}

interface EmailData {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

export class EmailService {
    private static instance: EmailService;
    private config: EmailConfig | null = null;

    private constructor() { }

    public static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    // Cargar configuración de email desde la base de datos
    private async loadConfig(): Promise<EmailConfig | null> {
        try {
            const account = await prisma.emailAccount.findFirst({
                where: {
                    isPrimary: true,
                    isActive: true,
                    deleted: false
                }
            });

            if (!account) {
                console.error('No hay cuenta de email principal configurada');
                return null;
            }

            return {
                server: account.server,
                port: account.port,
                username: account.username,
                password: account.password,
                connectionSecurity: account.connectionSecurity,
                fromAddress: account.fromAddress,
                replyAddress: account.replyAddress || undefined,
            };
        } catch (error) {
            console.error('Error cargando configuración de email:', error);
            return null;
        }
    }

    // Crear transporter de nodemailer
    private async createTransporter() {
        if (!this.config) {
            this.config = await this.loadConfig();
        }

        if (!this.config) {
            throw new Error('No hay configuración de email disponible');
        }

        const transporterConfig: any = {
            host: this.config.server,
            port: this.config.port,
            secure: this.config.connectionSecurity === 'SSL/TLS',
            auth: {
                user: this.config.username,
                pass: this.config.password,
            },
        };

        // Configurar STARTTLS si es necesario
        if (this.config.connectionSecurity === 'STARTTLS') {
            transporterConfig.secure = false;
            transporterConfig.requireTLS = true;
        }

        return nodemailer.createTransport(transporterConfig);
    }

    // Enviar email
    public async sendEmail(emailData: EmailData): Promise<boolean> {
        try {
            const transporter = await this.createTransporter();

            if (!this.config) {
                throw new Error('No hay configuración de email disponible');
            }

            const mailOptions = {
                from: {
                    name: this.config.fromAddress.split('@')[0],
                    address: this.config.fromAddress,
                },
                replyTo: this.config.replyAddress || this.config.fromAddress,
                to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
                subject: emailData.subject,
                html: emailData.html,
                text: emailData.text || emailData.html.replace(/<[^>]*>/g, ''), // Convertir HTML a texto plano
            };

            const result = await transporter.sendMail(mailOptions);
            console.log('Email enviado exitosamente:', result.messageId);
            return true;
        } catch (error) {
            console.error('Error enviando email:', error);
            return false;
        }
    }

    // Obtener lista de administradores con permisos ABM
    public async getAdminEmails(): Promise<string[]> {
        try {
            const admins = await prisma.user.findMany({
                where: {
                    authorities: {
                        has: 'ABM_MANAGE'
                    },
                    isActive: true,
                },
                select: {
                    email: true,
                }
            });

            return admins.map(admin => admin.email).filter(email => email);
        } catch (error) {
            console.error('Error obteniendo emails de administradores:', error);
            return [];
        }
    }

    // Enviar notificación de solicitud de vinculación
    public async sendLinkRequestNotification(requestData: {
        playerName: string;
        playerId: number;
        userName: string;
        userEmail: string;
        requestId: number;
    }): Promise<boolean> {
        try {
            const adminEmails = await this.getAdminEmails();

            if (adminEmails.length === 0) {
                console.warn('No hay administradores configurados para recibir notificaciones');
                return false;
            }

            const subject = `Nueva solicitud de vinculación - ${requestData.playerName}`;

            const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Nueva Solicitud de Vinculación</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #666; margin-top: 0;">Detalles de la Solicitud</h3>
            <p><strong>Jugador:</strong> ${requestData.playerName} (L${requestData.playerId})</p>
            <p><strong>Usuario:</strong> ${requestData.userName} (${requestData.userEmail})</p>
            <p><strong>ID de Solicitud:</strong> ${requestData.requestId}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;">
              <strong>Acción requerida:</strong> Por favor, revisa y aprueba o rechaza esta solicitud desde el panel de administración.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/admin/abm/link-requests" 
               style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Gestionar Solicitudes
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px; text-align: center;">
            Este es un email automático del sistema CARM Ranking.
          </p>
        </div>
      `;

            return await this.sendEmail({
                to: adminEmails,
                subject,
                html,
            });
        } catch (error) {
            console.error('Error enviando notificación de solicitud:', error);
            return false;
        }
    }
}

// Instancia singleton
export const emailService = EmailService.getInstance();

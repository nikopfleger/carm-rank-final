import { prisma } from "@/lib/database/client";
import { formatYmdForDisplay, toYmd } from '@/lib/format-utils';
import { UserRole } from "@prisma/client";
import nodemailer from 'nodemailer';

interface EmailTemplate {
    subject: string;
    html: string;
    text?: string;
}

interface NotificationRecipient {
    email: string;
    name: string;
    role: string;
}

export class EmailNotificationService {
    private static instance: EmailNotificationService;
    private transporter: nodemailer.Transporter | null = null;

    private constructor() { }

    static getInstance(): EmailNotificationService {
        if (!EmailNotificationService.instance) {
            EmailNotificationService.instance = new EmailNotificationService();
        }
        return EmailNotificationService.instance;
    }

    /**
     * Inicializar el transportador de email con la cuenta primaria
     */
    private async initializeTransporter(): Promise<void> {
        try {
            // Obtener la cuenta de email primaria y activa
            const primaryAccount = await prisma.emailAccount.findFirst({
                where: {
                    isPrimary: true,
                    isActive: true,
                    deleted: false
                }
            });

            if (!primaryAccount) {
                throw new Error('No se encontró una cuenta de email primaria activa');
            }

            // Configurar el transportador
            this.transporter = nodemailer.createTransport({
                host: primaryAccount.server,
                port: primaryAccount.port,
                secure: primaryAccount.connectionSecurity === 'SSL/TLS',
                auth: {
                    user: primaryAccount.username,
                    pass: primaryAccount.password,
                }
            });

            // Verificar la conexión
            await this.transporter.verify();
            console.log('✅ Servicio de email inicializado correctamente');

        } catch (error) {
            console.error('❌ Error inicializando servicio de email:', error);
            this.transporter = null;
            throw error;
        }
    }

    /**
     * Obtener usuarios con permisos específicos para notificaciones
     */
    private async getUsersWithPermission(permission: 'VALIDATE_GAMES' | 'LINK_PLAYERS'): Promise<NotificationRecipient[]> {
        try {
            const notificationField = permission === 'VALIDATE_GAMES'
                ? 'receiveGameNotifications'
                : 'receiveLinkNotifications';

            const users = await prisma.user.findMany({
                where: {
                    deleted: false,
                    isActive: true,
                    [notificationField]: true, // Solo usuarios que quieren recibir este tipo de notificación
                    OR: [
                        { role: UserRole.OWNER }, // Owners tienen todos los permisos
                        { role: UserRole.SUPER_ADMIN }, // Super admins también pueden recibir notificaciones
                        { role: UserRole.ADMIN }, // Admins siempre pueden recibir notificaciones
                        { role: UserRole.MODERATOR }, // Moderadores pueden validar juegos y vincular jugadores
                    ]
                },
                select: {
                    email: true,
                    name: true,
                    role: true
                }
            });

            return users.map(user => ({
                email: user.email,
                name: user.name || user.email,
                role: user.role
            }));
        } catch (error) {
            console.error('Error obteniendo usuarios con permisos:', error);
            return [];
        }
    }

    /**
     * Enviar email a múltiples destinatarios
     */
    private async sendEmail(
        recipients: NotificationRecipient[],
        template: EmailTemplate,
        context: Record<string, any> = {}
    ): Promise<boolean> {
        try {
            if (!this.transporter) {
                await this.initializeTransporter();
            }

            if (!this.transporter || recipients.length === 0) {
                console.warn('No se puede enviar email: transportador no disponible o sin destinatarios');
                return false;
            }

            // Reemplazar variables en el template
            const processedSubject = this.processTemplate(template.subject, context);
            const processedHtml = this.processTemplate(template.html, context);
            const processedText = template.text ? this.processTemplate(template.text, context) : undefined;

            // Obtener la cuenta primaria para el campo 'from'
            const primaryAccount = await prisma.emailAccount.findFirst({
                where: {
                    isPrimary: true,
                    isActive: true,
                    deleted: false
                }
            });

            const fromAddress = primaryAccount
                ? `${primaryAccount.organization || 'CARM'} <${primaryAccount.fromAddress}>`
                : 'CARM <noreply@carm.club>';

            // Enviar a cada destinatario
            const promises = recipients.map(recipient =>
                this.transporter!.sendMail({
                    from: fromAddress,
                    to: `${recipient.name} <${recipient.email}>`,
                    subject: processedSubject,
                    html: processedHtml,
                    text: processedText,
                })
            );

            await Promise.all(promises);
            console.log(`✅ Email enviado a ${recipients.length} destinatarios`);
            return true;

        } catch (error) {
            console.error('❌ Error enviando email:', error);
            return false;
        }
    }

    /**
     * Procesar template reemplazando variables
     */
    private processTemplate(template: string, context: Record<string, any>): string {
        let processed = template;

        Object.entries(context).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            processed = processed.replace(regex, String(value));
        });

        return processed;
    }

    /**
     * Notificar nuevo juego pendiente de validación
     */
    async notifyNewPendingGame(gameData: {
        id: bigint;
        playerNames: string[];
        submittedBy: string;
        date: Date;
        gameType: string;
    }): Promise<boolean> {
        try {
            const recipients = await this.getUsersWithPermission('VALIDATE_GAMES');

            const template: EmailTemplate = {
                subject: '🎯 Nuevo juego pendiente de validación - CARM',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <img src="{{logoUrl}}" alt="CARM Logo" style="height: 60px; margin-bottom: 10px;">
              <h1 style="color: white; margin: 0;">Nuevo Juego Pendiente</h1>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-top: 0;">¡Hay un nuevo juego esperando validación!</h2>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="margin-top: 0; color: #667eea;">Detalles del Juego</h3>
                <p><strong>ID:</strong> #{{gameId}}</p>
                <p><strong>Tipo:</strong> {{gameType}}</p>
                <p><strong>Fecha:</strong> {{gameDate}}</p>
                <p><strong>Jugadores:</strong> {{playerNames}}</p>
                <p><strong>Enviado por:</strong> {{submittedBy}}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{validationUrl}}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Revisar y Validar
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Este email se envía automáticamente cuando se registra un nuevo juego que requiere validación.
              </p>
            </div>
          </div>
        `,
                text: `
Nuevo juego pendiente de validación - CARM

Detalles del Juego:
- ID: #{{gameId}}
- Tipo: {{gameType}}
- Fecha: {{gameDate}}
- Jugadores: {{playerNames}}
- Enviado por: {{submittedBy}}

Ingresa al sistema para revisar y validar: {{validationUrl}}
        `
            };

            const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://carm-ranking.ddns.net';
            const context = {
                gameId: gameData.id,
                gameType: gameData.gameType,
                gameDate: formatYmdForDisplay(toYmd(gameData.date as any), 'es-AR'),
                playerNames: gameData.playerNames.join(', '),
                submittedBy: gameData.submittedBy,
                logoUrl: `${baseUrl}/carm-logo.png`,
                validationUrl: `${baseUrl}/admin/games/validate`
            };

            return await this.sendEmail(recipients, template, context);

        } catch (error) {
            console.error('Error notificando nuevo juego pendiente:', error);
            return false;
        }
    }

    /**
     * Notificar juego aceptado
     */
    async notifyGameAccepted(gameData: {
        id: number;
        playerNames: string[];
        acceptedBy: string;
        date: Date;
        gameType: string;
    }): Promise<boolean> {
        try {
            const recipients = await this.getUsersWithPermission('VALIDATE_GAMES');

            const template: EmailTemplate = {
                subject: '✅ Juego validado y aceptado - CARM',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 20px; text-align: center;">
              <img src="{{logoUrl}}" alt="CARM Logo" style="height: 60px; margin-bottom: 10px;">
              <h1 style="color: white; margin: 0;">Juego Validado</h1>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-top: 0;">El juego ha sido validado exitosamente</h2>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #48bb78;">
                <h3 style="margin-top: 0; color: #48bb78;">Detalles del Juego</h3>
                <p><strong>ID:</strong> #{{gameId}}</p>
                <p><strong>Tipo:</strong> {{gameType}}</p>
                <p><strong>Fecha:</strong> {{gameDate}}</p>
                <p><strong>Jugadores:</strong> {{playerNames}}</p>
                <p><strong>Validado por:</strong> {{acceptedBy}}</p>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                El juego ya está registrado en el sistema y los puntos han sido actualizados.
              </p>
            </div>
          </div>
        `,
                text: `
Juego validado y aceptado - CARM

Detalles del Juego:
- ID: #{{gameId}}
- Tipo: {{gameType}}
- Fecha: {{gameDate}}
- Jugadores: {{playerNames}}
- Validado por: {{acceptedBy}}

El juego ya está registrado en el sistema y los puntos han sido actualizados.
        `
            };

            const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://carm-ranking.ddns.net';
            const context = {
                gameId: gameData.id,
                gameType: gameData.gameType,
                gameDate: formatYmdForDisplay(toYmd(gameData.date as any), 'es-AR'),
                playerNames: gameData.playerNames.join(', '),
                acceptedBy: gameData.acceptedBy,
                logoUrl: `${baseUrl}/carm-logo.png`
            };

            return await this.sendEmail(recipients, template, context);

        } catch (error) {
            console.error('Error notificando juego aceptado:', error);
            return false;
        }
    }

    /**
     * Notificar nueva solicitud de vinculación de jugador
     */
    async notifyPlayerLinkRequest(requestData: {
        id: bigint;
        playerName: string;
        requestedBy: string;
        email: string;
        reason?: string;
    }): Promise<boolean> {
        try {
            const recipients = await this.getUsersWithPermission('LINK_PLAYERS');

            const template: EmailTemplate = {
                subject: '🔗 Nueva solicitud de vinculación de jugador - CARM',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); padding: 20px; text-align: center;">
              <img src="{{logoUrl}}" alt="CARM Logo" style="height: 60px; margin-bottom: 10px;">
              <h1 style="color: white; margin: 0;">Solicitud de Vinculación</h1>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-top: 0;">Nueva solicitud de vinculación de jugador</h2>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ed8936;">
                <h3 style="margin-top: 0; color: #ed8936;">Detalles de la Solicitud</h3>
                <p><strong>ID:</strong> #{{requestId}}</p>
                <p><strong>Jugador:</strong> {{playerName}}</p>
                <p><strong>Email:</strong> {{email}}</p>
                <p><strong>Solicitado por:</strong> {{requestedBy}}</p>
                {{reasonSection}}
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{linkUrl}}" style="background: #ed8936; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Revisar Solicitud
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Este email se envía automáticamente cuando se registra una nueva solicitud de vinculación.
              </p>
            </div>
          </div>
        `,
                text: `
Nueva solicitud de vinculación de jugador - CARM

Detalles de la Solicitud:
- ID: #{{requestId}}
- Jugador: {{playerName}}
- Email: {{email}}
- Solicitado por: {{requestedBy}}
{{reasonText}}

Ingresa al sistema para revisar: {{linkUrl}}
        `
            };

            const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://carm-ranking.ddns.net';
            const context = {
                requestId: requestData.id,
                playerName: requestData.playerName,
                email: requestData.email,
                requestedBy: requestData.requestedBy,
                reasonSection: requestData.reason ? `<p><strong>Motivo:</strong> ${requestData.reason}</p>` : '',
                reasonText: requestData.reason ? `- Motivo: ${requestData.reason}` : '',
                logoUrl: `${baseUrl}/carm-logo.png`,
                linkUrl: `${baseUrl}/admin/abm/link-requests`
            };

            return await this.sendEmail(recipients, template, context);

        } catch (error) {
            console.error('Error notificando solicitud de vinculación:', error);
            return false;
        }
    }
}

// Exportar instancia singleton
export const emailNotificationService = EmailNotificationService.getInstance();

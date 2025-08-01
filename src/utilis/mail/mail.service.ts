import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly mailerService: MailerService) { }

    async sendMail(
        email: string,
        data: any,
        subject: string = 'Welcome to Our Service',
        template: string = 'welcome'
    ): Promise<void> {
        try {
            this.logger.log(`Sending email to ${email} with template: ${template}`);

            // Convert Mongoose document to plain object if necessary
            const templateData = data && typeof data.toObject === 'function'
                ? data.toObject()
                : data;

            await this.mailerService.sendMail({
                to: email,
                subject,
                template,
                context: {
                    data: templateData,
                    // Add environment variables and app info to template context
                    appName: process.env.APP_NAME || 'Our Platform',
                    appHost: process.env.APP_HOST || 'localhost',
                    appPort: process.env.APP_PORT || '3000',
                    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
                    currentYear: new Date().getFullYear(),
                },
            });

            this.logger.log(`Email sent successfully to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${email}:`, error.message);
            throw new Error(`Email sending failed: ${error.message}`);
        }
    }
}


import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(
        private readonly mailerService: MailerService,
        @InjectQueue('email') private readonly emailQueue: Queue
    ) { }

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

    private payloadData(
        email: string,
        data: any,
        subject: string = 'Welcome to Our Service',
        template: string = 'welcome'
    ) {
        // Convert Mongoose document to plain object if necessary
        const templateData = data && typeof data.toObject === 'function'
            ? data.toObject()
            : data;

        return {
            to: email,
            subject,
            template,
            context: {
                data: templateData,
                appName: process.env.APP_NAME || 'Our Platform',
                appHost: process.env.APP_HOST || 'localhost',
                appPort: process.env.APP_PORT || '3000',
                frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
                currentYear: new Date().getFullYear(),
            },
        };
    }

    async sendEmailUsingQueue(
        email: string,
        data: any,
        subject: string = 'Welcome to Our Service',
        template: string = 'welcome',
        queueName: string = 'send-email'
    ) {
        const payload = this.payloadData(email, data, subject, template);
        this.logger.log(`Adding email job to queue ${queueName} for ${email}`);
        return this.emailQueue.add(queueName, payload, {
            attempts: 5, // retries
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false,
            priority: 3,       // (1 = highest)
        });
    }

    async sendEmailDelayed(
        email: string,
        data: any,
        subject: string = 'Welcome to Our Service',
        template: string = 'welcome',
        queueName: string = 'send-email',
        delayMs = 60_000
    ) {
        const payload = this.payloadData(email, data, subject, template);
        return this.emailQueue.add(queueName, payload, { delay: delayMs });
    }

    async sendEmailCron(
        email: string,
        data: any,
        subject: string = 'Welcome to Our Service',
        template: string = 'welcome',
        queueName: string = 'send-email',
    ) {
        const payload = this.payloadData(email, data, subject, template);
        return this.emailQueue.add(queueName, payload, {
            repeat: { pattern: '* * * * *' },
            jobId: 'send-email-every-minute', // ensures only one repeatable instance
        });
    }
}

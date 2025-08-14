import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job, QueueEvents } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import { logger } from 'handlebars';

@Processor('email', { concurrency: 10 }) // up to 10 jobs in parallel
export class MailProcessor extends WorkerHost {
    private readonly logger = new Logger(MailProcessor.name);

    constructor(private readonly mailerService: MailerService) {
        super();
    }

    async process(job: Job<{ to: string; subject: string; template: any, context: any }>): Promise<any> {
        const { to, subject, template, context } = job.data;
        switch (job.name) {
            case 'send-email': {
                try {
                    this.logger.log(`Sending email to ${to} with template: ${template}`);
                    await job.updateProgress(10);
                    await this.mailerService.sendMail({
                        to,
                        subject,
                        template,
                        context,
                    });
                    await job.updateProgress(100);
                    this.logger.log(`Email sent successfully to ${to}`);
                    return { ok: true, deliveredTo: to };

                } catch (error) {
                    this.logger.error(`Failed to send email to ${to}: ${error.message}`);
                    await job.updateProgress(100);
                    return { ok: false, error: error.message };
                }
            }
            case 'concatenate': {
                this.logger.log('concatenate case called');
                return { ok: true, deliveredTo: "concatenate@example.com" };
            }
        }
    }

    // @OnWorkerEvent('active')
    // onActive(job: Job) {
    //     this.logger.log(
    //         `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    //     );
    // }

}

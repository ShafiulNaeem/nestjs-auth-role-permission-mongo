// mail.module.ts

import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { BullModule } from '@nestjs/bullmq';
import { MailService } from './mail.service';
import { MailProcessor } from './mail.processor';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: process.env.MAIL_HOST,
          port: +process.env.MAIL_PORT,
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        },
        defaults: {
          from: `"${process.env.APP_NAME}" <${process.env.MAIL_FROM}>`,
        },
        template: {
          // dir: join(__dirname, 'templates'),
          dir: join(process.cwd(), 'src', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: false, // Disable strict mode to allow prototype access
          },
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'email', // queue name
      // optional per-queue defaults:
      defaultJobOptions: { removeOnComplete: true, attempts: 3 },
    }),
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService], // Export if you want to use MailService in other modules
})
export class MailModule { }

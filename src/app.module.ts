import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './admin/users/users.module';
import { AuthModule } from './admin/auth/auth.module';
import { RoleModule } from './admin/role/role.module';
import { ValidationModule } from './utilis/validation/validation.module';
import { MailModule } from './utilis/mail/mail.module';
import { RolePermissionGuard } from './utilis/guards/role-permission.guard';
import { JwtAuthGuard } from './admin/auth/jwt-auth.guard';
import { BullModule } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Module({
  imports: [
    // Load environment variables from .env file
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // connect mongo database
    MongooseModule.forRootAsync({
      useFactory: async () => {
        try {
          console.log('Connecting to MongoDB...');
          return {
            uri: process.env.DATABASE_URL,
            dbName: process.env.DATABASE_NAME,
            connectionFactory: (connection) => {
              console.log(':electric_plug: Mongoose connectionFactory running...');
              connection.on('connected', () => {
                console.log(':white_check_mark: MongoDB connected (connected event)');
              });
              connection.on('error', (err) => {
                console.error(':x: MongoDB connection error:', err);
              });
              connection.asPromise()
                .then(() => console.log(':white_check_mark: MongoDB connected (asPromise resolved)'))
                .catch((err) => console.error(':x: MongoDB connection failed (asPromise)', err));
              return connection;
            },
          };
        } catch (error: unknown) {
          console.error('Error connecting to MongoDB:', error);
          throw error;
        }
      },
    }),
    // connect redis database
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT, 10),
        //username: process.env.REDIS_USER,
        //password: process.env.REDIS_PASS,
        // tls: {}
      },
      // other BullMQ options
      // limiter: {
      //   max: 100,
      //   duration: 1000,
      // },
      // defaultJobOptions: {
      //   attempts: 3,
      //   backoff: 5000,
      // },
      // prefix: process.env.REDIS_PREFIX ? process.env.REDIS_PREFIX : 'myapp',
    }),
    
    UsersModule,
    AuthModule,
    RoleModule,
    ValidationModule, // Add global validation module


    // import mail module
    MailModule,

  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // global AuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolePermissionGuard,
    },
  ],
})

export class AppModule { }

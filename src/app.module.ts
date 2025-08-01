import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './admin/users/users.module';
import { AuthModule } from './admin/auth/auth.module';
import { RoleModule } from './admin/role/role.module';
import { ValidationModule } from './utilis/validation/validation.module';
import { MailModule } from './utilis/mail/mail.module';

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
  ],
})
export class AppModule { }

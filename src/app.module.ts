import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './admin/users/users.module';
import { AuthModule } from './admin/auth/auth.module';
import { RoleModule } from './admin/role/role.module';
import { ExistsConstraint } from './utilis/decorators/exists.decorator';
import { UniqueConstraint } from './utilis/decorators/unique.decorator';

@Module({
  imports: [
    // Load environment variables from .env file
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // connect mongo database
    // Connect to MongoDB using Mongoose
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // global exists decorator
    ExistsConstraint,
    // global unique decorator
    UniqueConstraint,

  ],
})
export class AppModule { }

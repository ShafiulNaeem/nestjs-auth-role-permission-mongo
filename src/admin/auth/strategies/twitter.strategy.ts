// strategies/twitter.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-twitter-oauth2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwitterStrategy extends PassportStrategy(Strategy, 'twitter') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get('TWITTER_CLIENT_ID'),
      clientSecret: config.get('TWITTER_CLIENT_SECRET'),
      callbackURL: config.get('TWITTER_CALLBACK_URL'),
      scope: ['tweet.read', 'users.read', 'offline.access', 'email'], // email scope requires proper app setup and may not always return an email
      state: true,
    });
  }
  validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    // Twitter often won’t return email; handle null
    const email = profile.emails?.[0]?.value?.toLowerCase?.() ?? null;
    const avatarUrl = profile.photos?.[0]?.value ?? null;
    const name = profile.displayName ?? profile.username ?? null;
    done(null, {
      provider: 'twitter',
      providerId: profile.id,
      email,
      name,
      avatarUrl,
    });
  }
}

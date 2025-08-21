// strategies/facebook.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get('FACEBOOK_CLIENT_ID'),
      clientSecret: config.get('FACEBOOK_CLIENT_SECRET'),
      callbackURL: config.get('FACEBOOK_CALLBACK_URL'),
      profileFields: ['id', 'displayName', 'photos', 'email'],
      scope: ['email'],
    });
  }
  validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const email = profile.emails?.[0]?.value?.toLowerCase?.() ?? null;
    const image = profile.photos?.[0]?.value ?? null;
    done(null, {
      provider: 'facebook',
      providerId: profile.id,
      email,
      name: profile.displayName ?? null,
      image,
    });
  }
}

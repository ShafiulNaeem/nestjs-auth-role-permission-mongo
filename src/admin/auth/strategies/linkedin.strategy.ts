// strategies/linkedin.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LinkedinStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get('LINKEDIN_CLIENT_ID'),
      clientSecret: config.get('LINKEDIN_CLIENT_SECRET'),
      callbackURL: config.get('LINKEDIN_CALLBACK_URL'),
      scope: ['r_liteprofile', 'r_emailaddress'], // Request profile and email access
      // No need to explicitly specify state; it's handled automatically by passport
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const email = profile.emails?.[0]?.value?.toLowerCase?.() ?? null;
    const image = profile.photos?.[0]?.value ?? null;

    done(null, {
      provider: 'linkedin',
      providerId: profile.id,
      email,
      name: profile.displayName ?? null,
      image,
    });
  }
}

import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
      passReqToCallback: false,
      // state is recommended. If you need dynamic state, set it in controller via AuthGuard options.
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value?.toLowerCase?.() ?? null;
    const name = profile.displayName ?? null;
    const image = profile.photos?.[0]?.value ?? null;

    const payload = {
      provider: 'google',
      providerId: profile.id,
      email,
      name,
      image,
    };

    done(null, payload); // passes to request.user
  }
}

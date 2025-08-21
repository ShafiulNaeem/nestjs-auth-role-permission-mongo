
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get('GITHUB_CLIENT_ID'),
      clientSecret: config.get('GITHUB_CLIENT_SECRET'),
      callbackURL: config.get('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }
  validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const primaryEmail = (profile.emails || []).find((e) => e.verified) || profile.emails?.[0];
    done(null, {
      provider: 'github',
      providerId: profile.id,
      email: primaryEmail?.value?.toLowerCase?.() ?? null,
      name: profile.displayName ?? profile.username ?? null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    });
  }
}

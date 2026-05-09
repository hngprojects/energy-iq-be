import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { type ConfigType } from '@nestjs/config';
import { googleConfig } from '../../../config/google.config';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(googleConfig.KEY)
    googleCfg: ConfigType<typeof googleConfig>,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: googleCfg.googleClientId,
      clientSecret: googleCfg.googleClientSecret,
      callbackURL: googleCfg.googleCallbackUrl,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { emails, name } = profile;
    if (!emails || !name) {
      throw new UnauthorizedException(
        'Google account did not provide required profile information',
      );
    }
    const authResponse = await this.authService.findOrCreateGoogleOAuthUser({
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      googleId: profile.id,
    });
    done(null, authResponse);
  }
}

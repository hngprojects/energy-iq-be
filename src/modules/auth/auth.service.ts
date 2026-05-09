import {
  Injectable,
  UnauthorizedException,
  Inject,
  NotAcceptableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { SYS_MSG } from '../../common/constants/sys-msg';
import { User } from '../users/entities/user.entity';
import { PublicUser } from '../users/types/public-user.type';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { type ConfigType } from '@nestjs/config';
import { jwtConfig } from '../../config/jwt.config';
import { EmailService } from '../email/email.service';
import { appConfig } from '../../config/app.config';
import * as OtpUtil from '../../common/utils/otp.util';
import { RedisService } from '../../common/redis/redis.service';
import { ResendVerificationDto } from './dto/resend-verification.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtCfg: ConfigType<typeof jwtConfig>,
    @Inject(appConfig.KEY)
    private readonly appCfg: ConfigType<typeof appConfig>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly redis: RedisService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    await this.sendVerificationEmail(user);
    return this.toPublicUser(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    console.log({ user });
    if (!user) throw new UnauthorizedException(SYS_MSG.INVALID_CREDENTIALS);

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    console.log({ valid });
    if (!valid) throw new UnauthorizedException(SYS_MSG.INVALID_CREDENTIALS);

    if (!user.emailVerified) {
      await this.sendVerificationEmail(user);
      throw new UnauthorizedException(SYS_MSG.INVALID_CREDENTIALS);
    }

    return this.issueTokens(user);
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<PublicUser> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException(SYS_MSG.INVALID_OTP);

    if (user.emailVerified) return this.toPublicUser(user);

    const attemptKey = `${dto.email}`;
    const attemptsRaw = await this.redis.get(attemptKey, 'otp_attempts');
    const attempts = attemptsRaw ? Number.parseInt(attemptsRaw, 10) : 0;
    if (attempts >= 5)
      throw new UnauthorizedException(SYS_MSG.OTP_ATTEMPTS_EXCEEDED);

    const storedHash = await this.redis.get(dto.email, 'otp');
    const match = storedHash
      ? await bcrypt.compare(dto.otp, storedHash)
      : false;

    if (!match) {
      await this.redis.set(attemptKey, `${attempts + 1}`, 'otp_attempts', 900);
      throw new UnauthorizedException(SYS_MSG.INVALID_OTP);
    }

    await this.usersService.setEmailVerified(user.id, true);
    await this.redis.delete(dto.email, 'otp');
    await this.redis.delete(attemptKey, 'otp_attempts');

    user.emailVerified = true;
    return this.toPublicUser(user);
  }

  async resendVerificationEmail(dto: ResendVerificationDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException(SYS_MSG.INVALID_CREDENTIALS);

    const storedHash = await this.redis.get(dto.email, 'otp');
    if (storedHash) {
      throw new NotAcceptableException(SYS_MSG.OTP_NOT_EXPIRED);
    }

    const attemptKey = `${dto.email}_resends`;
    const attemptsRaw = await this.redis.get(attemptKey, 'otp_attempts');
    const attempts = attemptsRaw ? Number.parseInt(attemptsRaw, 10) : 0;
    if (attempts >= 5) {
      throw new UnauthorizedException(SYS_MSG.OTP_ATTEMPTS_EXCEEDED);
    }

    await this.redis.set(attemptKey, `${attempts + 1}`, 'otp_attempts', 900);
    await this.sendVerificationEmail(user);
    return this.toPublicUser(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.jwtCfg.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException(SYS_MSG.INVALID_REFRESH_TOKEN);
    }

    const user = await this.usersService.findOne(payload.sub);
    if (!user.refreshTokenHash)
      throw new UnauthorizedException(SYS_MSG.INVALID_REFRESH_TOKEN);

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches)
      throw new UnauthorizedException(SYS_MSG.INVALID_REFRESH_TOKEN);

    const tokens = await this.signTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  async getProfile(userId: string): Promise<User> {
    return this.usersService.findOne(userId);
  }

  private async issueTokens(user: User): Promise<AuthResponse> {
    const tokens = await this.signTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return { ...tokens, user: this.toPublicUser(user) };
  }

  private async signTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtCfg.accessSecret,
        expiresIn: this.jwtCfg.accessExpiresIn as StringValue,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.jwtCfg.refreshSecret,
        expiresIn: this.jwtCfg.refreshExpiresIn as StringValue,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async persistRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.setRefreshTokenHash(userId, hash);
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      lastLoginAt: user.lastLoginAt ?? undefined,
      emailVerified: user.emailVerified ?? false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const otp = OtpUtil.generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    await this.redis.set(user.email, otpHash, 'otp', 900);

    return this.emailService.sendVerifyEmail(
      user.email,
      `${user.firstName} ${user.lastName}`,
      otp,
      this.appCfg.clientUrl,
    );
  }
}

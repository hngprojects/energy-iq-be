import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { appConfig } from '../../config/app.config';
import { type ConfigType } from '@nestjs/config';
import { Job } from 'bullmq';
import {
  EMAIL_JOBS,
  PasswordResetJobData,
  VerifyEmailJobData,
  WelcomeJobData,
} from './email.jobs';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { QUEUES } from '../../common/constants/queue';

@Processor(QUEUES.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly resend: Resend;
  private readonly templateCache = new Map<
    string,
    HandlebarsTemplateDelegate
  >();

  constructor(
    @Inject(appConfig.KEY)
    private readonly appCfg: ConfigType<typeof appConfig>,
  ) {
    super();
    this.resend = new Resend(appCfg.resendApiKey);
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job ${job.name} [${job.id}]`);

    switch (job.name) {
      case EMAIL_JOBS.WELCOME:
        return this.handleWelcome(job as Job<WelcomeJobData>);
      case EMAIL_JOBS.PASSWORD_RESET:
        return this.handlePasswordReset(job as Job<PasswordResetJobData>);
      case EMAIL_JOBS.VERIFY_EMAIL:
        return this.handleVerifyEmail(job as Job<VerifyEmailJobData>);
      default: {
        const message = `Unknown job type: ${job.name}`;
        this.logger.warn(message);
        throw new Error(message);
      }
    }
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***';
    return `${local.slice(0, 2)}***@${domain}`;
  }

  private async handleWelcome(job: Job<WelcomeJobData>): Promise<void> {
    const { to, firstName } = job.data;
    this.logger.log(`Sending welcome email to ${this.maskEmail(to)}`);
    const html = this.renderTemplate(EMAIL_JOBS.WELCOME, { firstName });

    const fromAddress = this.appCfg.resendFrom;
    const { error } = await this.resend.emails.send({
      from: `Energy IQ <${fromAddress}>`,
      to,
      subject: `Welcome to Energy IQ`,
      html,
    });

    if (error) {
      this.logger.error(
        `Welcome email failed for ${this.maskEmail(to)}`,
        error.name,
        error.message,
        error.statusCode,
      );
      throw new Error(error.message);
    }

    this.logger.log(`Welcome email sent successfully to ${this.maskEmail(to)}`);
  }

  private async handlePasswordReset(
    job: Job<PasswordResetJobData>,
  ): Promise<void> {
    const { to, resetLink } = job.data;
    this.logger.log(`Sending password reset email to ${this.maskEmail(to)}`);
    const html = this.renderTemplate(EMAIL_JOBS.PASSWORD_RESET, { resetLink });

    const fromAddress = this.appCfg.resendFrom;
    const { error } = await this.resend.emails.send({
      from: `Energy IQ <${fromAddress}>`,
      to,
      subject: 'Reset your password',
      html,
    });

    if (error) {
      this.logger.error(
        `Password reset email failed for ${this.maskEmail(to)}`,
        error.name,
        error.message,
        error.statusCode,
      );
      throw new Error(error.message);
    }

    this.logger.log(
      `Password reset email sent successfully to ${this.maskEmail(to)}`,
    );
  }

  private async handleVerifyEmail(job: Job<VerifyEmailJobData>): Promise<void> {
    const { to, verifyCode, fullName, clientUrl } = job.data;
    this.logger.log(`Sending verify email to ${this.maskEmail(to)}`);
    const html = this.renderTemplate(EMAIL_JOBS.VERIFY_EMAIL, {
      verifyCode,
      fullName,
      clientUrl,
    });

    const fromAddress = this.appCfg.resendFrom;
    const { error } = await this.resend.emails.send({
      from: `Energy IQ <${fromAddress}>`,
      to,
      subject: 'Verify your email address',
      html,
    });

    if (error) {
      this.logger.error(
        `Verify email failed for ${this.maskEmail(to)}`,
        error.name,
        error.message,
        error.statusCode,
      );
      throw new Error(error.message);
    }

    this.logger.log(`Verify email sent successfully to ${this.maskEmail(to)}`);
  }

  private renderTemplate(
    name: string,
    context: Record<string, unknown>,
  ): string {
    if (!this.templateCache.has(name)) {
      const filePath = path.join(__dirname, 'templates', `${name}.hbs`);
      const source = fs.readFileSync(filePath, 'utf8');
      this.templateCache.set(name, Handlebars.compile(source));
    }
    return this.templateCache.get(name)!(context);
  }
}

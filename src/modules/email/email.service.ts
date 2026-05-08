import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { QUEUES } from '../../common/constants/queue';
import { Queue } from 'bullmq';
import {
  EMAIL_JOBS,
  PasswordResetJobData,
  VerifyEmailJobData,
  WelcomeJobData,
} from './email.jobs';

@Injectable()
export class EmailService {
  constructor(@InjectQueue(QUEUES.EMAIL) private readonly emailQueue: Queue) {}

  async sendWelcome(to: string, firstName: string): Promise<void> {
    await this.emailQueue.add(EMAIL_JOBS.WELCOME, {
      to,
      firstName,
    } satisfies WelcomeJobData);
  }

  async sendPasswordReset(to: string, resetLink: string): Promise<void> {
    await this.emailQueue.add(EMAIL_JOBS.PASSWORD_RESET, {
      to,
      resetLink,
    } satisfies PasswordResetJobData);
  }

  async sendVerifyEmail(
    to: string,
    fullName: string,
    verifyLink: string,
    clientUrl: string,
  ): Promise<void> {
    await this.emailQueue.add(EMAIL_JOBS.VERIFY_EMAIL, {
      to,
      fullName,
      verifyLink,
      clientUrl,
    } satisfies VerifyEmailJobData);
  }
}

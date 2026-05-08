import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { EmailService } from '../email.service';
import { QUEUES } from '../../../common/constants/queue';

const mockQueue = {
  add: jest.fn(),
};

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: getQueueToken(QUEUES.EMAIL),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should enqueue a welcome email', async () => {
    await service.sendWelcome('user@example.com', 'John');
    expect(mockQueue.add).toHaveBeenCalledWith('welcome', {
      to: 'user@example.com',
      firstName: 'John',
    });
  });

  it('should enqueue a password reset email', async () => {
    await service.sendPasswordReset('user@example.com', 'https://reset.link');
    expect(mockQueue.add).toHaveBeenCalledWith('password_reset', {
      to: 'user@example.com',
      resetLink: 'https://reset.link',
    });
  });

  it('should enqueue a verify email', async () => {
    await service.sendVerifyEmail(
      'user@example.com',
      'John Doe',
      'https://verify.link',
      'https://app.example.com',
    );
    expect(mockQueue.add).toHaveBeenCalledWith('verify_email', {
      to: 'user@example.com',
      fullName: 'John Doe',
      verifyLink: 'https://verify.link',
      clientUrl: 'https://app.example.com',
    });
  });
});

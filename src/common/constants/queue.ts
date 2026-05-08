export const QUEUES = {
  EMAIL: 'email',
};

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

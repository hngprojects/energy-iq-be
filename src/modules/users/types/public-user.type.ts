import { UserRole } from '../../../common/enums';

// export type PublicUser = Omit<
//   User,
//   'passwordHash' | 'refreshTokenHash' | 'deletedAt' | 'googleId'
// >;

export type PartialUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

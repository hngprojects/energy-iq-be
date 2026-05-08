import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Column, Entity, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/abstract-base.entity';
import { UserRole } from '../../../common/enums';

@Entity('users')
export class User extends AbstractBaseEntity {
  @ApiProperty({ example: 'user@example.com' })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 255 })
  firstName: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 255, nullable: true })
  googleId?: string;

  @ApiProperty()
  @Column({ type: 'boolean', nullable: true, default: false })
  emailVerified: boolean;

  @ApiProperty()
  @Column({ type: 'varchar', length: 30, nullable: true })
  inverterBrand?: string;

  @ApiProperty()
  @Column({ type: 'smallint', nullable: true })
  onboardingStep?: number;

  @ApiProperty()
  @Column({ type: 'boolean', nullable: true })
  onboardingComplete?: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', nullable: true, default: false })
  isActive?: boolean;

  @ApiProperty()
  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @ApiProperty({ enum: UserRole, default: UserRole.USER })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Exclude()
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  refreshTokenHash: string | null;
}

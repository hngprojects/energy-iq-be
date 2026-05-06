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
  password: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 255 })
  fullName: string;

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

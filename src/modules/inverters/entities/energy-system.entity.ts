import { Column, Entity, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../database/entities/abstract-base.entity';
import { User } from '../../users/entities/user.entity';
@Entity('energy_systems')
export class EnergySystems extends AbstractBaseEntity {
  @ApiProperty({ example: 'victron' })
  @Column({ type: 'varchar', length: 30 })
  inverterBrand: string;

  @ApiProperty({ example: 'system-123' })
  @Column({ type: 'varchar', length: 255 })
  brandSystemId: string;

  @ApiProperty({ example: 'device-123' })
  @Column({ type: 'varchar', length: 255 })
  brandDeviceId: string;

  @ApiProperty({ example: 'model-123' })
  @Column({ type: 'varchar', length: 255 })
  inverterModel: string;
  @Column({ type: 'varchar', length: 255 })
  isManuel: boolean;

  @OneToMany(() => User, (user) => user.id)
  users: User[];
}

import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserModelAction extends AbstractModelAction<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
  ) {
    super(repository, User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.get({ identifierOptions: { email } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.get({ identifierOptions: { googleId } });
  }

  async upsertByGoogle(data: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
  }): Promise<User> {
    const result = await this.repository
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        googleId: data.googleId,
        emailVerified: true,
      })
      .orUpdate(
        ['googleId', 'emailVerified'], // columns to update on conflict
        ['email'], // conflict target (unique column)
      )
      .returning('*')
      .execute();

    const raw = result.raw as User[];
    return raw[0];
  }
}

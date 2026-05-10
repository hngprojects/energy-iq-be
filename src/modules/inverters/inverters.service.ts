import { Injectable } from '@nestjs/common';

@Injectable()
export class InvertersService {
  findOne(id: string) {
    return { id, message: 'Inverter coming soon' };
  }

  findByUser(userId: string) {
    return { userId, message: 'User inverters coming soon' };
  }
}

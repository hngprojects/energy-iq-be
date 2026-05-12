import { Test, TestingModule } from '@nestjs/testing';
import { InvertersService } from '../inverters.service';
import { InverterModelAction } from '../action/inverters.action';
import { VictronAdapter } from '../adapters/victron.adapters';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

const mockInverter = {
  id: 'inverter-uuid-1',
  userId: 'user-uuid-1',
  isActive: true,
  brand: 'VICTRON',
  model: 'MultiPlus',
  serialNumber: 'SN123',
};

const mockInverterModelAction = {
  findActiveByUserId: jest.fn(),
  get: jest.fn(),
  deactivateById: jest.fn(),
  findBySerialNumber: jest.fn(),
  create: jest.fn(),
};

const mockVictronAdapter = {
  verifyAndGetSystem: jest.fn(),
};

describe('InvertersService', () => {
  let service: InvertersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvertersService,
        { provide: InverterModelAction, useValue: mockInverterModelAction },
        { provide: VictronAdapter, useValue: mockVictronAdapter },
      ],
    }).compile();

    service = module.get<InvertersService>(InvertersService);
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should return only active inverters for a user', async () => {
      mockInverterModelAction.findActiveByUserId.mockResolvedValue([
        mockInverter,
      ]);
      const result = await service.findByUserId('user-uuid-1');
      expect(mockInverterModelAction.findActiveByUserId).toHaveBeenCalledWith(
        'user-uuid-1',
      );
      expect(result).toEqual([mockInverter]);
    });

    it('should throw NotFoundException when user has no active inverters', async () => {
      mockInverterModelAction.findActiveByUserId.mockResolvedValue([]);
      await expect(service.findByUserId('user-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivateInverter', () => {
    it('should deactivate an inverter when the owner requests it', async () => {
      mockInverterModelAction.get.mockResolvedValue({ ...mockInverter });
      mockInverterModelAction.deactivateById.mockResolvedValue(undefined);

      const result = await service.deactivateInverter(
        'inverter-uuid-1',
        'user-uuid-1',
      );

      expect(mockInverterModelAction.deactivateById).toHaveBeenCalledWith(
        'inverter-uuid-1',
      );
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when inverter does not exist', async () => {
      mockInverterModelAction.get.mockResolvedValue(null);
      await expect(
        service.deactivateInverter('bad-id', 'user-uuid-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when a non-owner tries to deactivate', async () => {
      mockInverterModelAction.get.mockResolvedValue({ ...mockInverter });
      await expect(
        service.deactivateInverter('inverter-uuid-1', 'different-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when inverter is already inactive', async () => {
      mockInverterModelAction.get.mockResolvedValue({
        ...mockInverter,
        isActive: false,
      });
      await expect(
        service.deactivateInverter('inverter-uuid-1', 'user-uuid-1'),
      ).rejects.toThrow(ConflictException);
    });
  });
});

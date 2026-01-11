import { equipmentService } from '../equipmentService';
import { apiClient } from '@/lib/api';

jest.mock('@/lib/api');

describe('EquipmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all equipment items', async () => {
      const mockData = [{ id: '1' }, { id: '2' }];
      (apiClient.get as jest.Mock).mockResolvedValue(mockData);

      const result = await equipmentService.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/equipment');
      expect(result).toEqual(mockData);
    });
  });

  describe('getById', () => {
    it('should fetch equipment by id', async () => {
      const mockData = { id: '1' };
      (apiClient.get as jest.Mock).mockResolvedValue(mockData);

      const result = await equipmentService.getById('1');

      expect(apiClient.get).toHaveBeenCalledWith('/equipment/1');
      expect(result).toEqual(mockData);
    });
  });

  describe('create', () => {
    it('should create new equipment', async () => {
      const formData = {
        /* add test data */
      };
      const mockResponse = { id: '1', ...formData };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await equipmentService.create(formData as any);

      expect(apiClient.post).toHaveBeenCalledWith('/equipment', formData);
      expect(result).toEqual(mockResponse);
    });
  });
});

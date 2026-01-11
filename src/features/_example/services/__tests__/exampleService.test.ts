import { exampleService } from '../exampleService';
import { apiClient } from '@/lib/api';
import type { ExampleFormData } from '../../types';

// Mock the API client
jest.mock('@/lib/api');

describe('ExampleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all examples without filters', async () => {
      const mockResponse = {
        items: [
          {
            id: '1',
            title: 'Example 1',
            description: 'Desc 1',
            status: 'published',
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
          },
          {
            id: '2',
            title: 'Example 2',
            description: 'Desc 2',
            status: 'draft',
            created_at: '2026-01-02',
            updated_at: '2026-01-02',
          },
        ],
        total: 2,
        page: 1,
        page_size: 20,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await exampleService.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/examples?');
      expect(result.items).toHaveLength(2);
      expect(result.items[0].title).toBe('Example 1');
      expect(result.items[0].createdAt).toBeInstanceOf(Date);
    });

    it('should fetch examples with status filter', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        page_size: 20,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await exampleService.getAll({ status: 'published' });

      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('status=published'));
    });

    it('should fetch examples with search filter', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        page_size: 20,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await exampleService.getAll({ search: 'test query' });

      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('search=test+query'));
    });
  });

  describe('getById', () => {
    it('should fetch example by id', async () => {
      const mockResponse = {
        id: '1',
        title: 'Example 1',
        description: 'Description',
        status: 'published',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await exampleService.getById('1');

      expect(apiClient.get).toHaveBeenCalledWith('/examples/1');
      expect(result.id).toBe('1');
      expect(result.title).toBe('Example 1');
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('create', () => {
    it('should create new example', async () => {
      const formData: ExampleFormData = {
        title: '  New Example  ',
        description: '  Description  ',
        status: 'draft',
      };

      const mockResponse = {
        id: '1',
        title: 'New Example',
        description: 'Description',
        status: 'draft',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await exampleService.create(formData);

      expect(apiClient.post).toHaveBeenCalledWith('/examples', {
        title: 'New Example', // Trimmed
        description: 'Description', // Trimmed
        status: 'draft',
      });

      expect(result.id).toBe('1');
      expect(result.title).toBe('New Example');
    });
  });

  describe('update', () => {
    it('should update example with partial data', async () => {
      const partialData = {
        title: '  Updated Title  ',
      };

      const mockResponse = {
        id: '1',
        title: 'Updated Title',
        description: 'Original Description',
        status: 'published',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      };

      (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await exampleService.update('1', partialData);

      expect(apiClient.put).toHaveBeenCalledWith('/examples/1', {
        title: 'Updated Title', // Trimmed
      });

      expect(result.title).toBe('Updated Title');
    });

    it('should only include provided fields in payload', async () => {
      const partialData = {
        status: 'archived' as const,
      };

      const mockResponse = {
        id: '1',
        title: 'Title',
        description: 'Description',
        status: 'archived',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      };

      (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      await exampleService.update('1', partialData);

      expect(apiClient.put).toHaveBeenCalledWith('/examples/1', {
        status: 'archived',
      });

      // Should not include title or description
      const callArgs = (apiClient.put as jest.Mock).mock.calls[0][1];
      expect(callArgs).not.toHaveProperty('title');
      expect(callArgs).not.toHaveProperty('description');
    });
  });

  describe('delete', () => {
    it('should delete example', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue(undefined);

      await exampleService.delete('1');

      expect(apiClient.delete).toHaveBeenCalledWith('/examples/1');
    });
  });
});

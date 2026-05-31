
import { GET } from '../route';
import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import { prisma } from '@/lib/prisma';

jest.mock('fs/promises');

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    eventPhoto: {
      findFirst: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as unknown as {
  eventPhoto: {
    findFirst: jest.MockedFunction<typeof prisma.eventPhoto.findFirst>;
  };
};

describe('GET /api/photos/[filename]', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('should serve file from IMAGE_STORAGE_PATH if it exists', async () => {
    const fileBuffer = Buffer.from('mock-data');
    (fs.readFile as jest.Mock).mockResolvedValueOnce(fileBuffer);

    const request = new NextRequest('http://localhost/api/photos/test.jpg');
    const response = await GET(request, { params: Promise.resolve({ filename: 'test.jpg' }) });

    expect(response.status).toBe(200);
    expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('test.jpg'));
  });

  it('should fall back to absolute path from database if not found in IMAGE_STORAGE_PATH', async () => {
    const fileBuffer = Buffer.from('mock-data-fallback');
    // First read fails (not in IMAGE_STORAGE_PATH)
    (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('ENOENT'));
    // Second read succeeds (fallback path)
    (fs.readFile as jest.Mock).mockResolvedValueOnce(fileBuffer);

    // Mock prisma to return the fallback path
    mockPrisma.eventPhoto.findFirst.mockResolvedValueOnce({
      id: 1,
      eventId: 1,
      filePath: '/fallback/path/test.jpg',
    });

    const request = new NextRequest('http://localhost/api/photos/test.jpg');
    const response = await GET(request, { params: Promise.resolve({ filename: 'test.jpg' }) });

    expect(response.status).toBe(200);
    expect(mockPrisma.eventPhoto.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          filePath: {
            endsWith: 'test.jpg',
          },
        },
      })
    );
    expect(fs.readFile).toHaveBeenNthCalledWith(1, expect.stringContaining('test.jpg'));
    expect(fs.readFile).toHaveBeenNthCalledWith(2, '/fallback/path/test.jpg');
  });

  it('should return 404 if file is not found in either path', async () => {
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('ENOENT'));
    mockPrisma.eventPhoto.findFirst.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost/api/photos/test.jpg');
    const response = await GET(request, { params: Promise.resolve({ filename: 'test.jpg' }) });

    expect(response.status).toBe(404);
  });
});

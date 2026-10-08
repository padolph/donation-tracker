import { savePhoto } from '../photoActions';
import fs from 'fs/promises';
import path from 'path';

// Server actions check the session themselves; default to a logged-in user.
let mockSession: { user: { name: string } } | null = { user: { name: 'Test User' } };
jest.mock('@/auth', () => ({
  auth: () => Promise.resolve(mockSession),
}));

jest.mock('fs/promises');
jest.mock('path');

describe('photoActions', () => {
  describe('savePhoto', () => {
    it('should copy the photo to the local app directory and return the path in a success object', async () => {
      const mockBuffer = Buffer.from('mock-data');
      const mockFile = {
        name: 'receipt.jpg',
        arrayBuffer: jest.fn().mockResolvedValue(mockBuffer.buffer),
      } as unknown as File;
      
      (path.join as jest.Mock).mockReturnValue('/mock/app/dir/receipt_123.jpg');
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      const result = await savePhoto(mockFile);

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith('/mock/app/dir/receipt_123.jpg', expect.any(Buffer));
      expect(result).toEqual({ success: true, filePath: '/mock/app/dir/receipt_123.jpg' });
    });

    it('should return a failure object if saving the photo fails', async () => {
      const mockBuffer = Buffer.from('mock-data');
      const mockFile = {
        name: 'receipt.jpg',
        arrayBuffer: jest.fn().mockResolvedValue(mockBuffer.buffer),
      } as unknown as File;
      
      (path.join as jest.Mock).mockReturnValue('/mock/app/dir/receipt_123.jpg');
      (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Write failed'));
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      const result = await savePhoto(mockFile);

      expect(result).toEqual({ success: false, error: 'Failed to upload file "receipt.jpg". Please try again.' });
    });
  });
});

describe('when not logged in', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = null;
  });

  afterEach(() => {
    mockSession = { user: { name: 'Test User' } };
  });

  it('savePhoto returns Unauthorized without writing to disk', async () => {
    const file = { name: 'photo.jpg', arrayBuffer: jest.fn() } as unknown as File;
    const result = await savePhoto(file);
    expect(result).toEqual({ success: false, error: expect.stringContaining('Unauthorized') });
    expect(fs.mkdir).not.toHaveBeenCalled();
    expect(fs.writeFile).not.toHaveBeenCalled();
  });
});

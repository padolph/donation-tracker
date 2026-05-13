import { savePhoto } from '../photoActions';
import fs from 'fs/promises';
import path from 'path';

jest.mock('fs/promises');
jest.mock('path');

describe('photoActions', () => {
  describe('savePhoto', () => {
    it('should copy the photo to the local app directory and return the path', async () => {
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
      expect(result).toBe('/mock/app/dir/receipt_123.jpg');
    });
  });
});

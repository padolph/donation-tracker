import { savePhoto } from '../photoActions';
import { MAX_PHOTO_SIZE_BYTES } from '@/lib/photoLimits';
import fs from 'fs/promises';
import path from 'path';

// Server actions check the session themselves; default to a logged-in user.
let mockSession: { user: { name: string } } | null = { user: { name: 'Test User' } };
jest.mock('@/auth', () => ({
  auth: () => Promise.resolve(mockSession),
}));

jest.mock('fs/promises');
jest.mock('path');

const JPEG_BYTES = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
const PNG_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00];
const PDF_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];

function makeFile(name: string, bytes: number[], type: string, size?: number): File {
  const buffer = Uint8Array.from(bytes).buffer;
  return {
    name,
    type,
    size: size ?? bytes.length,
    arrayBuffer: jest.fn().mockResolvedValue(buffer),
  } as unknown as File;
}

describe('photoActions', () => {
  describe('savePhoto', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (path.join as jest.Mock).mockImplementation((...parts: string[]) => parts.join('/'));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    });

    it('should copy the photo to the local app directory and return the path in a success object', async () => {
      (path.join as jest.Mock).mockReturnValue('/mock/app/dir/receipt_123.jpg');

      const result = await savePhoto(makeFile('receipt.jpg', JPEG_BYTES, 'image/jpeg'));

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith('/mock/app/dir/receipt_123.jpg', expect.any(Buffer));
      expect(result).toEqual({ success: true, filePath: '/mock/app/dir/receipt_123.jpg' });
    });

    it('should return a failure object if saving the photo fails', async () => {
      (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Write failed'));

      const result = await savePhoto(makeFile('receipt.jpg', JPEG_BYTES, 'image/jpeg'));

      expect(result).toEqual({ success: false, error: 'Failed to upload file "receipt.jpg". Please try again.' });
    });

    it.each([
      ['receipt.jpg', JPEG_BYTES, 'image/jpeg', '.jpg'],
      ['receipt.JPEG', JPEG_BYTES, 'image/jpeg', '.jpg'],
      ['photo.png', PNG_BYTES, 'image/png', '.png'],
      ['statement.pdf', PDF_BYTES, 'application/pdf', '.pdf'],
      ['no-type.png', PNG_BYTES, '', '.png'],
    ])('should accept %s and save it with the %s content extension', async (name, bytes, type, ext) => {
      const result = await savePhoto(makeFile(name, bytes, type));

      expect(result.success).toBe(true);
      expect(result.filePath?.split('/').pop()).toHaveLength(36 + ext.length);
      expect(result.filePath?.endsWith(ext)).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
    });

    it('should reject a file larger than the size limit without writing it', async () => {
      const file = makeFile('huge.jpg', JPEG_BYTES, 'image/jpeg', MAX_PHOTO_SIZE_BYTES + 1);

      const result = await savePhoto(file);

      expect(result).toEqual({ success: false, error: 'File "huge.jpg" is too large. Max size is 10MB.' });
      expect(file.arrayBuffer).not.toHaveBeenCalled();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should accept a file exactly at the size limit', async () => {
      const result = await savePhoto(makeFile('big.jpg', JPEG_BYTES, 'image/jpeg', MAX_PHOTO_SIZE_BYTES));

      expect(result.success).toBe(true);
    });

    it('should reject an empty file', async () => {
      const result = await savePhoto(makeFile('empty.jpg', [], 'image/jpeg'));

      expect(result).toEqual({ success: false, error: 'File "empty.jpg" is empty.' });
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it.each([
      ['script.html', [0x3c, 0x68, 0x74, 0x6d, 0x6c], 'text/html'],
      ['image.svg', [0x3c, 0x73, 0x76, 0x67], 'image/svg+xml'],
      ['anim.gif', [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 'image/gif'],
      ['receipt.jpg', JPEG_BYTES, 'text/html'],
      ['receipt.exe', JPEG_BYTES, 'image/jpeg'],
      ['receipt', JPEG_BYTES, 'image/jpeg'],
    ])('should reject %s (%s) as an unsupported type', async (name, bytes, type) => {
      const result = await savePhoto(makeFile(name, bytes, type));

      expect(result).toEqual({
        success: false,
        error: `File "${name}" is not a supported type. Use JPG, PNG or PDF.`,
      });
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should reject a file whose contents do not match an allowed type', async () => {
      const result = await savePhoto(makeFile('fake.jpg', [0x3c, 0x68, 0x74, 0x6d, 0x6c], 'image/jpeg'));

      expect(result).toEqual({
        success: false,
        error: 'File "fake.jpg" is not a supported type. Use JPG, PNG or PDF.',
      });
      expect(fs.writeFile).not.toHaveBeenCalled();
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

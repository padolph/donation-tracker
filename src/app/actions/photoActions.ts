/* eslint-disable security/detect-non-literal-fs-filename */
'use server';

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { MAX_PHOTO_SIZE_BYTES } from '@/lib/photoLimits';

type AllowedType = {
  mimeType: string;
  extensions: string[];
  savedExtension: string;
  signature: number[];
};

// Matches the picker's accept=".jpg,.jpeg,.png,.pdf". The leading bytes are checked
// so a renamed file can't be stored (and later served) under an allowed extension.
const ALLOWED_TYPES: AllowedType[] = [
  { mimeType: 'image/jpeg', extensions: ['.jpg', '.jpeg'], savedExtension: '.jpg', signature: [0xff, 0xd8, 0xff] },
  { mimeType: 'image/png', extensions: ['.png'], savedExtension: '.png', signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mimeType: 'application/pdf', extensions: ['.pdf'], savedExtension: '.pdf', signature: [0x25, 0x50, 0x44, 0x46, 0x2d] },
];

function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? '' : fileName.slice(dot).toLowerCase();
}

function matchesSignature(buffer: Buffer, signature: number[]): boolean {
  return buffer.subarray(0, signature.length).equals(Buffer.from(signature));
}

export async function savePhoto(file: File): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return { success: false, error: `File "${file.name}" is too large. Max size is 10MB.` };
    }
    if (file.size === 0) {
      return { success: false, error: `File "${file.name}" is empty.` };
    }

    const unsupported = { success: false, error: `File "${file.name}" is not a supported type. Use JPG, PNG or PDF.` };
    const extension = getExtension(file.name);
    const allowedType = ALLOWED_TYPES.find((type) => type.extensions.includes(extension));
    // Some browsers send an empty type; the content check below still applies.
    if (!allowedType || (file.type && file.type !== allowedType.mimeType)) {
      return unsupported;
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!matchesSignature(buffer, allowedType.signature)) {
      return unsupported;
    }

    const storageDir = process.env.IMAGE_STORAGE_PATH || path.join(process.cwd(), 'storage', 'donations');

    await fs.mkdir(storageDir, { recursive: true });

    const fileName = `${randomUUID()}${allowedType.savedExtension}`;
    const filePath = path.join(storageDir, fileName);

    await fs.writeFile(filePath, buffer);

    return { success: true, filePath };
  } catch (error) {
    console.error('ERROR: Failed to save photo to disk', {
      fileName: file.name,
      error: error instanceof Error ? error.message : error
    });
    return { success: false, error: `Failed to upload file "${file.name}". Please try again.` };
  }
}

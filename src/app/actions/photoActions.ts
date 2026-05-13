'use server';

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export async function savePhoto(file: File) {
  try {
    const storageDir = path.join(process.cwd(), 'storage', 'donations');
    
    await fs.mkdir(storageDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const fileName = `${randomUUID()}${path.extname(file.name)}`;
    const filePath = path.join(storageDir, fileName);

    await fs.writeFile(filePath, buffer);

    return filePath;
  } catch (error) {
    console.error('ERROR: Failed to save photo to disk', {
      fileName: file.name,
      error: error instanceof Error ? error.message : error
    });
    throw new Error(`Failed to upload file "${file.name}". Please try again.`);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security check: Basic prevention of directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }

    const storageDir = process.env.IMAGE_STORAGE_PATH || path.join(process.cwd(), 'storage', 'donations');
    const filePath = path.join(storageDir, filename);

    try {
      const fileBuffer = await fs.readFile(filePath);
      
      // Determine content type based on extension
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.pdf') contentType = 'application/pdf';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (error) {
      console.error(`File not found: ${filePath}`, error);
      return new NextResponse('File not found', { status: 404 });
    }
  } catch (error) {
    console.error('API Error in photo route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

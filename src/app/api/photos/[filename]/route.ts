import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';

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

    let fileBuffer: Buffer;
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fileBuffer = await fs.readFile(filePath);
    } catch (error) {
      try {
        const photoRecord = await prisma.eventPhoto.findFirst({
          where: {
            filePath: {
              endsWith: filename,
            },
          },
        });

        if (photoRecord && photoRecord.filePath) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          fileBuffer = await fs.readFile(photoRecord.filePath);
        } else {
          throw error;
        }
      } catch (fallbackError) {
        console.error(`File not found in primary path or fallback database path: ${filename}`, fallbackError);
        return new NextResponse('File not found', { status: 404 });
      }
    }

    // Determine content type based on extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.pdf') contentType = 'application/pdf';

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('API Error in photo route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


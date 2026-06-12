import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse('Unauthorized: Access denied.', { status: 401 });
    }

    // Fetch all tables
    const categories = await prisma.category.findMany();
    const items = await prisma.item.findMany();
    const organizations = await prisma.organization.findMany();
    const donationEvents = await prisma.donationEvent.findMany();
    const donatedItems = await prisma.donatedItem.findMany();
    const eventPhotos = await prisma.eventPhoto.findMany();

    const metadata = {
      categories,
      items,
      organizations,
      donationEvents,
      donatedItems,
      eventPhotos,
    };

    const zip = new AdmZip();
    
    // Add metadata.json
    zip.addFile('metadata.json', Buffer.from(JSON.stringify(metadata, null, 2), 'utf-8'));

    // Add referenced physical photos
    for (const photo of eventPhotos) {
      if (photo.filePath) {
        try {
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          const fileBuffer = await fs.readFile(photo.filePath);
          const filename = path.basename(photo.filePath);
          zip.addFile(`photos/${filename}`, fileBuffer);
        } catch (error) {
          console.error(`Failed to include photo file ${photo.filePath} in sync package:`, error);
          // Ignore missing physical photos to keep export resilient
        }
      }
    }

    const zipBuffer = zip.toBuffer();
    
    const dateStr = new Date().toISOString().split('T')[0];
    const randomHash = Math.random().toString(36).substring(2, 8);
    const filename = `donation_tracker_sync_${dateStr}_${randomHash}.dtpack`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('CRITICAL: Sync Export Handler failed', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

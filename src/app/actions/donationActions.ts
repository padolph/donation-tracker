'use server';

import { prisma } from '@/lib/prisma';

interface DonationData {
  organization: string;
  date: Date;
  notes?: string;
  items: Array<{
    itemId: number;
    quantity: number;
    condition: string;
    lockedValue: number;
  }>;
  photos: string[];
}

export async function saveDonation(data: DonationData) {
  try {
    const donation = await prisma.donationEvent.create({
      data: {
        organization: data.organization,
        date: data.date,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
            condition: item.condition,
            lockedValue: item.lockedValue,
          })),
        },
        photos: {
          create: data.photos.map((photoPath) => ({
            filePath: photoPath,
          })),
        },
      },
    });

    return { success: true, donation };
  } catch (error) {
    console.error('CRITICAL: saveDonation failed', error);
    
    // Provide a more descriptive error back to the client
    let message = 'An unexpected error occurred while saving the donation.';
    if (error instanceof Error) {
      message = error.message;
    }
    
    return { 
      success: false, 
      error: message 
    };
  }
}

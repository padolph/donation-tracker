'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSettings() {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      settings = await prisma.appSettings.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, marginalTaxRate: 0.32 },
      });
    }

    return { success: true, settings };
  } catch (error) {
    console.error('CRITICAL: getSettings failed', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch settings' 
    };
  }
}

interface UpdateSettingsData {
  marginalTaxRate: number;
}

export async function updateSettings(data: UpdateSettingsData) {
  try {
    const settings = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: {
        marginalTaxRate: data.marginalTaxRate,
      },
      create: {
        id: 1,
        marginalTaxRate: data.marginalTaxRate,
      },
    });

    revalidatePath('/settings');
    revalidatePath('/');
    return { success: true, settings };
  } catch (error) {
    console.error('CRITICAL: updateSettings failed', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update settings' 
    };
  }
}

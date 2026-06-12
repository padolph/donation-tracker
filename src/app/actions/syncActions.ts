/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { revalidatePath } from 'next/cache';

export interface ParseSyncSummary {
  categories: number;
  items: number;
  organizations: number;
  events: number;
  photos: number;
}

export type ParseSyncResult =
  | { success: true; summary: ParseSyncSummary; tempDir: string }
  | { success: false; error: string };

export type ImportSyncResult =
  | { success: true }
  | { success: false; error: string };

export async function parseSyncPackage(formData: FormData): Promise<ParseSyncResult> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Unauthorized: Access denied.' };
    }

    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: 'No file provided' };
    }

    let buffer: Buffer;
    if (typeof file.arrayBuffer === 'function') {
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } else {
      // Fallback for environments where arrayBuffer is not directly on Blob/File (e.g. some test environments)
      const arrayBuffer = await new Response(file as any).arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    // Validate zip magic header: PK\x03\x04 (0x04034b50 in little endian)
    if (buffer.length < 4 || buffer.readUInt32LE(0) !== 0x04034b50) {
      return { success: false, error: 'Invalid sync package (not a ZIP archive)' };
    }

    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch {
      return { success: false, error: 'Invalid sync package (not a ZIP archive)' };
    }

    const entries = zip.getEntries();
    const MAX_FILE_COUNT = 5000;
    const MAX_SINGLE_SIZE = 25 * 1024 * 1024; // 25MB
    const MAX_TOTAL_SIZE = 1024 * 1024 * 1024; // 1GB

    if (entries.length > MAX_FILE_COUNT) {
      return { success: false, error: 'Too many files in sync package' };
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dt-sync-'));
    const resolvedTempDir = path.resolve(tempDir);

    let totalSize = 0;

    for (const entry of entries) {
      const entryName = entry.entryName;

      if (entryName.includes('..')) {
        await fs.rm(resolvedTempDir, { recursive: true, force: true });
        return { success: false, error: `Path traversal detected: ${entryName}` };
      }

      // Path traversal check
      const targetPath = path.resolve(resolvedTempDir, entryName);
      if (!targetPath.startsWith(resolvedTempDir)) {
        await fs.rm(resolvedTempDir, { recursive: true, force: true });
        return { success: false, error: `Path traversal detected: ${entryName}` };
      }

      if (!entry.isDirectory) {
        const singleSize = entry.header.size;
        if (singleSize > MAX_SINGLE_SIZE) {
          await fs.rm(resolvedTempDir, { recursive: true, force: true });
          return { success: false, error: `Single file size limit exceeded: ${entryName}` };
        }
        totalSize += singleSize;
        if (totalSize > MAX_TOTAL_SIZE) {
          await fs.rm(resolvedTempDir, { recursive: true, force: true });
          return { success: false, error: 'Total size limit exceeded' };
        }
      }
    }

    // Write entries to temp directory
    for (const entry of entries) {
      if (entry.isDirectory) continue;

      if (entry.entryName.includes('..')) {
        await fs.rm(resolvedTempDir, { recursive: true, force: true });
        return { success: false, error: `Path traversal detected: ${entry.entryName}` };
      }

      const targetPath = path.resolve(resolvedTempDir, entry.entryName);
      if (!targetPath.startsWith(resolvedTempDir)) {
        await fs.rm(resolvedTempDir, { recursive: true, force: true });
        return { success: false, error: `Path traversal detected: ${entry.entryName}` };
      }

      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, entry.getData());
    }

    const metadataPath = path.join(resolvedTempDir, 'metadata.json');
    let hasMetadata = false;
    try {
      await fs.access(metadataPath);
      hasMetadata = true;
    } catch {}

    if (!hasMetadata) {
      await fs.rm(resolvedTempDir, { recursive: true, force: true });
      return { success: false, error: 'Missing metadata.json in sync package' };
    }

    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    let metadata: any;
    try {
      metadata = JSON.parse(metadataContent);
    } catch {
      await fs.rm(resolvedTempDir, { recursive: true, force: true });
      return { success: false, error: 'Invalid metadata.json format' };
    }

    const summary = {
      categories: metadata.categories?.length || 0,
      items: metadata.items?.length || 0,
      organizations: metadata.organizations?.length || 0,
      events: metadata.donationEvents?.length || 0,
      photos: metadata.eventPhotos?.length || 0,
    };

    return {
      success: true,
      summary,
      tempDir: resolvedTempDir,
    };
  } catch (error) {
    console.error('CRITICAL: parseSyncPackage failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during parsing'
    };
  }
}

export async function importSyncPackage(formData: FormData): Promise<ImportSyncResult> {
  const parseResult = await parseSyncPackage(formData);
  if (!parseResult.success) {
    return parseResult;
  }

  const { tempDir } = parseResult;
  const copiedFiles: string[] = [];

  try {
    const metadataPath = path.join(tempDir, 'metadata.json');
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataContent);

    await prisma.$transaction(async (tx) => {
      // 1. Remap Categories (Unique by name)
      const categoryMap = new Map<number, number>(); // oldCategoryId -> newCategoryId
      if (metadata.categories) {
        for (const cat of metadata.categories) {
          const existing = await tx.category.findUnique({
            where: { name: cat.name },
          });

          if (existing) {
            categoryMap.set(cat.id, existing.id);
          } else {
            const created = await tx.category.create({
              data: { name: cat.name },
            });
            categoryMap.set(cat.id, created.id);
          }
        }
      }

      // 2. Remap Items (Unique by categoryId + description)
      const itemMap = new Map<number, number>(); // oldItemId -> newItemId
      if (metadata.items) {
        for (const item of metadata.items) {
          const mappedCategoryId = categoryMap.get(item.categoryId);
          if (!mappedCategoryId) {
            throw new Error(`Category mapping missing for item: ${item.description}`);
          }

          const existing = await tx.item.findUnique({
            where: {
              categoryId_description: {
                categoryId: mappedCategoryId,
                description: item.description,
              },
            },
          });

          if (existing) {
            itemMap.set(item.id, existing.id);
          } else {
            const created = await tx.item.create({
              data: {
                categoryId: mappedCategoryId,
                description: item.description,
                leafName: item.leafName ?? '',
                defaultHigh: item.defaultHigh ?? null,
                defaultMedium: item.defaultMedium ?? null,
                userHigh: item.userHigh ?? null,
                userMedium: item.userMedium ?? null,
                isCustomItem: item.isCustomItem ?? false,
              },
            });
            itemMap.set(item.id, created.id);
          }
        }
      }

      // 3. Remap Organizations (Unique by name, or match by taxId)
      const orgMap = new Map<number, number>(); // oldOrgId -> newOrgId
      if (metadata.organizations) {
        for (const org of metadata.organizations) {
          let existing = null;

          if (org.taxId) {
            existing = await tx.organization.findFirst({
              where: { taxId: org.taxId },
            });
          }

          if (!existing) {
            existing = await tx.organization.findUnique({
              where: { name: org.name },
            });
          }

          if (existing) {
            orgMap.set(org.id, existing.id);
          } else {
            const created = await tx.organization.create({
              data: {
                name: org.name,
                address: org.address ?? null,
                taxId: org.taxId ?? null,
              },
            });
            orgMap.set(org.id, created.id);
          }
        }
      }

      // Helper function to calculate total value of exported events
      const getExportedEventTotalValue = (event: any) => {
        if (event.type === 'ITEMS') {
          const eventItems = (metadata.donatedItems || []).filter((di: any) => di.eventId === event.id);
          return eventItems.reduce((sum: number, di: any) => sum + (di.quantity * di.lockedValue), 0);
        }
        return event.cashAmount ?? 0;
      };

      // Helper function to calculate total value of db events
      const getDbEventTotalValue = (event: any) => {
        if (event.type === 'ITEMS') {
          return (event.items || []).reduce((sum: number, di: any) => sum + (di.quantity * di.lockedValue), 0);
        }
        return event.cashAmount ?? 0;
      };

      // Helper to check same calendar day
      const isSameDay = (date1: Date, date2: Date) => {
        return date1.getUTCFullYear() === date2.getUTCFullYear() &&
               date1.getUTCMonth() === date2.getUTCMonth() &&
               date1.getUTCDate() === date2.getUTCDate();
      };

      // 4. Remap Donation Events & Sub-items
      if (metadata.donationEvents) {
        for (const event of metadata.donationEvents) {
          const mappedOrgId = orgMap.get(event.organizationId);
          if (!mappedOrgId) {
            throw new Error(`Organization mapping missing for event: ${event.id}`);
          }

          const eventDate = new Date(event.date);

          // Get potential duplicates (same day + organization)
          const startOfDay = new Date(eventDate);
          startOfDay.setUTCHours(0, 0, 0, 0);
          const endOfDay = new Date(eventDate);
          endOfDay.setUTCHours(23, 59, 59, 999);

          const potentialDuplicates = await tx.donationEvent.findMany({
            where: {
              organizationId: mappedOrgId,
              date: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
            include: {
              items: true,
            },
          });

          // Check if it matches duplicate criteria
          const exportedTotalValue = getExportedEventTotalValue(event);
          let isDuplicate = false;

          for (const dbEvent of potentialDuplicates) {
            const dbEventDate = new Date(dbEvent.date);
            const dbTotalValue = getDbEventTotalValue(dbEvent);

            if (
              isSameDay(eventDate, dbEventDate) &&
              dbEvent.type === event.type &&
              dbEvent.cashAmount === event.cashAmount &&
              dbTotalValue === exportedTotalValue
            ) {
              // Extra check for assets
              if (event.type === 'ASSETS') {
                if (
                  dbEvent.assetTicker === event.assetTicker &&
                  dbEvent.assetShares === event.assetShares
                ) {
                  isDuplicate = true;
                  break;
                }
              } else {
                isDuplicate = true;
                break;
              }
            }
          }

          if (isDuplicate) {
            // Skip duplicate event, its items, and photos
            continue;
          }

          // Create new donation event
          const createdEvent = await tx.donationEvent.create({
            data: {
              organizationId: mappedOrgId,
              date: eventDate,
              type: event.type ?? 'ITEMS',
              cashAmount: event.cashAmount ?? null,
              assetTicker: event.assetTicker ?? null,
              assetShares: event.assetShares ?? null,
              notes: event.notes ?? null,
            },
          });

          // Create donated items
          const eventItems = (metadata.donatedItems || []).filter((di: any) => di.eventId === event.id);
          for (const di of eventItems) {
            const mappedItemId = itemMap.get(di.itemId);
            if (!mappedItemId) {
              throw new Error(`Item mapping missing for donated item: ${di.id}`);
            }

            await tx.donatedItem.create({
              data: {
                eventId: createdEvent.id,
                itemId: mappedItemId,
                quantity: di.quantity,
                condition: di.condition,
                lockedValue: di.lockedValue,
              },
            });
          }

          // Copy and create event photos
          const eventPhotos = (metadata.eventPhotos || []).filter((ep: any) => ep.eventId === event.id);
          const storagePath = process.env.IMAGE_STORAGE_PATH || path.join(process.cwd(), 'storage', 'donations');
          await fs.mkdir(storagePath, { recursive: true });

          for (const ep of eventPhotos) {
            const originalFilename = path.basename(ep.filePath);
            const uniqueFilename = `${Date.now()}_${originalFilename}`;
            const targetFilePath = path.join(storagePath, uniqueFilename);
            const sourceFilePath = path.join(tempDir, 'photos', originalFilename);

            // Copy physical file from temp extraction directory to application storage
            await fs.copyFile(sourceFilePath, targetFilePath);
            copiedFiles.push(targetFilePath);

            // Create EventPhoto database record
            await tx.eventPhoto.create({
              data: {
                eventId: createdEvent.id,
                filePath: targetFilePath,
              },
            });
          }
        }
      }
    });

    revalidatePath('/donations');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    // DB rollback is automatic under transaction. Clean up copied files on disk.
    for (const filePath of copiedFiles) {
      try {
        await fs.unlink(filePath);
      } catch (e) {
        console.error(`Failed to clean up file ${filePath} on rollback:`, e);
      }
    }

    console.error('CRITICAL: importSyncPackage failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during import',
    };
  } finally {
    // Always clean up the extracted temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

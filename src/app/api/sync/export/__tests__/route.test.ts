/**
 * @jest-environment node
 */

import { GET } from '@/app/api/sync/export/route';
import fs from 'fs/promises';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import AdmZip from 'adm-zip';

jest.mock('fs/promises');

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    category: { findMany: jest.fn() },
    item: { findMany: jest.fn() },
    organization: { findMany: jest.fn() },
    donationEvent: { findMany: jest.fn() },
    donatedItem: { findMany: jest.fn() },
    eventPhoto: { findMany: jest.fn() },
  },
}));

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

const mockPrisma = prisma as unknown as {
  category: { findMany: jest.Mock };
  item: { findMany: jest.Mock };
  organization: { findMany: jest.Mock };
  donationEvent: { findMany: jest.Mock };
  donatedItem: { findMany: jest.Mock };
  eventPhoto: { findMany: jest.Mock };
};

describe('GET /api/sync/export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({ user: { name: 'Test User' } });
  });

  it('should return 401 if unauthorized', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const response = await GET();

    expect(response.status).toBe(401);
    const text = await response.text();
    expect(text).toContain('Unauthorized');
  });

  it('should export all data and photos successfully', async () => {
    const mockCategories = [{ id: 1, name: 'Books' }];
    const mockItems = [{ id: 1, categoryId: 1, description: 'Book', isCustomItem: true }];
    const mockOrganizations = [{ id: 1, name: 'Charity' }];
    const mockEvents = [{ id: 1, organizationId: 1, date: new Date('2026-01-01T00:00:00.000Z'), type: 'ITEMS' }];
    const mockDonatedItems = [{ id: 1, eventId: 1, itemId: 1, quantity: 1, condition: 'GOOD', lockedValue: 10 }];
    const mockPhotos = [{ id: 1, eventId: 1, filePath: '/storage/donations/receipt.jpg' }];

    mockPrisma.category.findMany.mockResolvedValueOnce(mockCategories);
    mockPrisma.item.findMany.mockResolvedValueOnce(mockItems);
    mockPrisma.organization.findMany.mockResolvedValueOnce(mockOrganizations);
    mockPrisma.donationEvent.findMany.mockResolvedValueOnce(mockEvents);
    mockPrisma.donatedItem.findMany.mockResolvedValueOnce(mockDonatedItems);
    mockPrisma.eventPhoto.findMany.mockResolvedValueOnce(mockPhotos);

    // Mock physical photo file contents on disk
    const mockPhotoBuffer = Buffer.from('mock-photo-binary-data');
    (fs.readFile as jest.Mock).mockResolvedValueOnce(mockPhotoBuffer);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/zip');
    expect(response.headers.get('Content-Disposition')).toContain('attachment; filename="donation_tracker_sync_');

    // Read ZIP content from response body
    const arrayBuffer = await response.arrayBuffer();
    const zip = new AdmZip(Buffer.from(arrayBuffer));
    
    // Assert ZIP structure
    const metadataEntry = zip.getEntry('metadata.json');
    expect(metadataEntry).not.toBeNull();
    
    const metadata = JSON.parse(metadataEntry!.getData().toString('utf8'));
    expect(metadata.categories).toEqual(mockCategories);
    expect(metadata.items).toEqual(mockItems);
    expect(metadata.organizations).toEqual(mockOrganizations);
    // Dates are serialized to strings in JSON
    expect(metadata.donationEvents[0].id).toBe(1);
    expect(metadata.donatedItems).toEqual(mockDonatedItems);
    expect(metadata.eventPhotos).toEqual(mockPhotos);

    // Check if the photo is packed in the zip
    const photoEntry = zip.getEntry('photos/receipt.jpg');
    expect(photoEntry).not.toBeNull();
    expect(photoEntry!.getData().toString()).toBe('mock-photo-binary-data');
  });

  it('should ignore missing physical photos gracefully and still generate the package', async () => {
    const mockCategories: unknown[] = [];
    const mockItems: unknown[] = [];
    const mockOrganizations: unknown[] = [];
    const mockEvents: unknown[] = [];
    const mockDonatedItems: unknown[] = [];
    const mockPhotos = [{ id: 1, eventId: 1, filePath: '/storage/donations/missing_receipt.jpg' }];

    mockPrisma.category.findMany.mockResolvedValueOnce(mockCategories);
    mockPrisma.item.findMany.mockResolvedValueOnce(mockItems);
    mockPrisma.organization.findMany.mockResolvedValueOnce(mockOrganizations);
    mockPrisma.donationEvent.findMany.mockResolvedValueOnce(mockEvents);
    mockPrisma.donatedItem.findMany.mockResolvedValueOnce(mockDonatedItems);
    mockPrisma.eventPhoto.findMany.mockResolvedValueOnce(mockPhotos);

    // Mock readFile to fail with ENOENT
    (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));

    const response = await GET();

    expect(response.status).toBe(200);

    const arrayBuffer = await response.arrayBuffer();
    const zip = new AdmZip(Buffer.from(arrayBuffer));
    
    const metadataEntry = zip.getEntry('metadata.json');
    expect(metadataEntry).not.toBeNull();
    
    // Missing photo should not be in the zip
    const photoEntry = zip.getEntry('photos/missing_receipt.jpg');
    expect(photoEntry).toBeNull();
  });
});

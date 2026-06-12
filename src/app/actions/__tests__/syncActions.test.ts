/**
 * @jest-environment node
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { parseSyncPackage } from '@/app/actions/syncActions';
import fs from 'fs/promises';

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    $transaction: jest.fn(),
    category: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    item: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    donationEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    donatedItem: {
      create: jest.fn(),
    },
    eventPhoto: {
      create: jest.fn(),
    },
  },
}));

// Dynamic AdmZip mock to allow override of getEntries in specific tests
let useCustomMock = false;
const mockGetEntries = jest.fn();
jest.mock('adm-zip', () => {
  const ActualAdmZip = jest.requireActual('adm-zip') as any;
  return jest.fn().mockImplementation((...args) => {
    const instance = new ActualAdmZip(...args);
    const originalGetEntries = instance.getEntries.bind(instance);
    instance.getEntries = () => {
      if (useCustomMock) {
        return mockGetEntries();
      }
      return originalGetEntries();
    };
    return instance;
  });
});

import { auth } from '@/auth';

describe('syncActions - parseSyncPackage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCustomMock = false;
    mockGetEntries.mockReset();
    (auth as jest.Mock).mockResolvedValue({ user: { name: 'Test User' } });
  });

  const createMockZipBuffer = (files: Record<string, string | Buffer>): Buffer => {
    const zip = new (jest.requireActual('adm-zip') as any)();
    for (const [filepath, content] of Object.entries(files)) {
      zip.addFile(filepath, typeof content === 'string' ? Buffer.from(content) : content);
    }
    return zip.toBuffer();
  };

  const createFormData = (buffer: Buffer | null, filename = 'sync.dtpack'): FormData => {
    const formData = new FormData();
    if (buffer) {
      const file = new Blob([new Uint8Array(buffer)], { type: 'application/octet-stream' });
      formData.append('file', file, filename);
    }
    return formData;
  };

  it('should fail if unauthorized', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const formData = createFormData(Buffer.from([]));

    const result = await parseSyncPackage(formData) as any;
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('should fail if no file is provided', async () => {
    const formData = new FormData();
    const result = await parseSyncPackage(formData) as any;
    expect(result.success).toBe(false);
    expect(result.error).toBe('No file provided');
  });

  it('should fail if the zip file is invalid', async () => {
    const formData = createFormData(Buffer.from('not a zip file'));
    const result = await parseSyncPackage(formData) as any;
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid sync package');
  });

  it('should fail and detect path traversal in zip entry', async () => {
    const zipBuffer = createMockZipBuffer({
      'metadata.json': '{}',
    });
    
    useCustomMock = true;
    mockGetEntries.mockReturnValue([
      {
        entryName: 'metadata.json',
        isDirectory: false,
        header: { size: 100 },
        getData: () => Buffer.from('{}'),
      },
      {
        entryName: '../outside.txt',
        isDirectory: false,
        header: { size: 100 },
        getData: () => Buffer.from('malicious'),
      },
    ] as any);

    const formData = createFormData(zipBuffer);
    const result = await parseSyncPackage(formData) as any;
    expect(result.success).toBe(false);
    expect(result.error).toContain('Path traversal detected');
  });

  it('should fail and detect sibling directory path traversal in zip entry', async () => {
    const zipBuffer = createMockZipBuffer({
      'metadata.json': '{}',
    });
    
    useCustomMock = true;
    mockGetEntries.mockReturnValue([
      {
        entryName: 'metadata.json',
        isDirectory: false,
        header: { size: 100 },
        getData: () => Buffer.from('{}'),
      },
      {
        entryName: '../dt-sync-abcdef/sibling.txt',
        isDirectory: false,
        header: { size: 100 },
        getData: () => Buffer.from('malicious sibling'),
      },
    ] as any);

    const formData = createFormData(zipBuffer);
    const result = await parseSyncPackage(formData) as any;
    expect(result.success).toBe(false);
    expect(result.error).toContain('Path traversal detected');
  });

  it('should fail and detect absolute path traversal in zip entry', async () => {
    const zipBuffer = createMockZipBuffer({
      'metadata.json': '{}',
    });
    
    useCustomMock = true;
    mockGetEntries.mockReturnValue([
      {
        entryName: 'metadata.json',
        isDirectory: false,
        header: { size: 100 },
        getData: () => Buffer.from('{}'),
      },
      {
        entryName: '/absolute-malicious.txt',
        isDirectory: false,
        header: { size: 100 },
        getData: () => Buffer.from('malicious absolute'),
      },
    ] as any);

    const formData = createFormData(zipBuffer);
    const result = await parseSyncPackage(formData) as any;
    expect(result.success).toBe(false);
    expect(result.error).toContain('Path traversal detected');
  });

  it('should fail zip bomb validation if there are too many files', async () => {
    const zip = new (jest.requireActual('adm-zip') as any)();
    zip.addFile('metadata.json', Buffer.from('{}'));
    const zipBuffer = zip.toBuffer();
    
    useCustomMock = true;
    mockGetEntries.mockReturnValue(
      Array.from({ length: 5001 }, (_, i) => ({
        entryName: `file_${i}.jpg`,
        isDirectory: false,
        header: { size: 100 },
        getData: () => Buffer.from(''),
      })) as any
    );

    const formData = createFormData(zipBuffer);
    const result = await parseSyncPackage(formData) as any;
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Too many files');
  });

  it('should fail zip bomb validation if single file size is too large', async () => {
    const zip = new (jest.requireActual('adm-zip') as any)();
    zip.addFile('metadata.json', Buffer.from('{}'));
    const zipBuffer = zip.toBuffer();

    useCustomMock = true;
    mockGetEntries.mockReturnValue([
      {
        entryName: 'metadata.json',
        isDirectory: false,
        header: { size: 100 },
        getData: () => Buffer.from('{}'),
      },
      {
        entryName: 'photos/huge.jpg',
        isDirectory: false,
        header: { size: 26 * 1024 * 1024 }, // 26MB
        getData: () => Buffer.from(''),
      },
    ] as any);

    const formData = createFormData(zipBuffer);
    const result = await parseSyncPackage(formData) as any;

    expect(result.success).toBe(false);
    expect(result.error).toContain('Single file size limit exceeded');
  });

  it('should fail zip bomb validation if total uncompressed size is too large', async () => {
    const zip = new (jest.requireActual('adm-zip') as any)();
    zip.addFile('metadata.json', Buffer.from('{}'));
    const zipBuffer = zip.toBuffer();

    const entries = Array.from({ length: 50 }, (_, i) => ({
      entryName: `photos/img_${i}.jpg`,
      isDirectory: false,
      header: { size: 22 * 1024 * 1024 },
      getData: () => Buffer.from(''),
    }));
    entries.push({
      entryName: 'metadata.json',
      isDirectory: false,
      header: { size: 100 },
      getData: () => Buffer.from('{}'),
    } as any);

    useCustomMock = true;
    mockGetEntries.mockReturnValue(entries as any);

    const formData = createFormData(zipBuffer);
    const result = await parseSyncPackage(formData) as any;

    expect(result.success).toBe(false);
    expect(result.error).toContain('Total size limit exceeded');
  });

  it('should fail if metadata.json is missing in zip', async () => {
    const zipBuffer = createMockZipBuffer({
      'photos/receipt.jpg': 'image data',
    });
    const formData = createFormData(zipBuffer);

    const result = await parseSyncPackage(formData) as any;
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing metadata.json');
  });

  it('should return a correct summary for a valid zip', async () => {
    const metadata = {
      version: 1,
      exportedAt: new Date().toISOString(),
      categories: [{ id: 1, name: 'Clothing' }],
      items: [{ id: 10, categoryId: 1, description: 'Shirt', isCustomItem: true }],
      organizations: [{ id: 2, name: 'Red Cross', taxId: '12-345' }],
      donationEvents: [{ id: 3, organizationId: 2, date: '2026-06-12T00:00:00.000Z', type: 'ITEMS' }],
      donatedItems: [{ id: 4, eventId: 3, itemId: 10, quantity: 1, condition: 'High', lockedValue: 15 }],
      eventPhotos: [{ id: 5, eventId: 3, filePath: 'photos/receipt.jpg' }],
    };

    const zipBuffer = createMockZipBuffer({
      'metadata.json': JSON.stringify(metadata),
      'photos/receipt.jpg': 'dummy photo data',
    });
    const formData = createFormData(zipBuffer);

    const result = await parseSyncPackage(formData) as any;
    expect(result.success).toBe(true);
    expect(result.summary).toEqual({
      categories: 1,
      items: 1,
      organizations: 1,
      events: 1,
      photos: 1,
    });
    expect(result.tempDir).toBeDefined();

    // Clean up if tempDir was created
    if (result.tempDir) {
      await fs.rm(result.tempDir, { recursive: true, force: true });
    }
  });
});

import { importSyncPackage } from '@/app/actions/syncActions';
import { prisma } from '@/lib/prisma';

describe('syncActions - importSyncPackage', () => {
  let spyCopyFile: jest.SpiedFunction<typeof fs.copyFile>;
  let spyUnlink: jest.SpiedFunction<typeof fs.unlink>;

  beforeEach(() => {
    jest.clearAllMocks();
    useCustomMock = false;
    mockGetEntries.mockReset();
    (auth as jest.Mock).mockResolvedValue({ user: { name: 'Test User' } });

    spyCopyFile = jest.spyOn(fs, 'copyFile').mockResolvedValue(undefined);
    spyUnlink = jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
      return await callback(prisma);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createMockZipBuffer = (files: Record<string, string | Buffer>): Buffer => {
    const { Buffer: NodeBuffer } = jest.requireActual('buffer');
    const ActualAdmZip = jest.requireActual('adm-zip') as any;
    const zip = new ActualAdmZip();
    for (const [filepath, content] of Object.entries(files)) {
      const nodeContent = typeof content === 'string'
        ? NodeBuffer.from(content)
        : NodeBuffer.from(content);
      zip.addFile(filepath, nodeContent);
    }
    return zip.toBuffer();
  };

  const createFormData = (buffer: Buffer | null, filename = 'sync.dtpack'): FormData => {
    const formData = new FormData();
    if (buffer) {
      const file = new Blob([new Uint8Array(buffer)], { type: 'application/octet-stream' });
      formData.append('file', file, filename);
    }
    return formData;
  };

  it('should fail if unauthorized', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const formData = createFormData(Buffer.from([]));

    const result = await importSyncPackage(formData) as any;
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('should fail if zip file is invalid', async () => {
    const formData = createFormData(Buffer.from('not a zip file'));
    const result = await importSyncPackage(formData) as any;
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid sync package');
  });

  it('should correctly merge data using transaction and remap IDs', async () => {
    // 1. Setup mock database responses
    // Mock category search: Clothing (exists, ID=100), Electronics (new, create returns ID=200)
    (prisma.category.findUnique as jest.Mock).mockImplementation(({ where }: any) => {
      if (where.name === 'Clothing') {
        return Promise.resolve({ id: 100, name: 'Clothing' });
      }
      return Promise.resolve(null);
    });
    (prisma.category.create as jest.Mock).mockResolvedValue({ id: 200, name: 'Electronics' });

    // Mock item search:
    // Existing item: Shirt (categoryId=100, description='Shirt') exists, ID=300
    (prisma.item.findUnique as jest.Mock).mockImplementation(({ where }: any) => {
      if (where.categoryId_description && where.categoryId_description.categoryId === 100 && where.categoryId_description.description.toLowerCase() === 'shirt') {
        return Promise.resolve({ id: 300, categoryId: 100, description: 'Shirt', isCustomItem: false });
      }
      return Promise.resolve(null);
    });
    // New custom item: Phone (categoryId=200, description='Phone') -> created with ID=400
    (prisma.item.create as jest.Mock).mockResolvedValue({ id: 400, categoryId: 200, description: 'Phone', isCustomItem: true });

    // Mock organization search: Goodwill (exists, ID=500), Red Cross (new, create returns ID=600)
    (prisma.organization.findUnique as jest.Mock).mockImplementation(({ where }: any) => {
      if (where.name === 'Goodwill') {
        return Promise.resolve({ id: 500, name: 'Goodwill', taxId: '11-111' });
      }
      return Promise.resolve(null);
    });
    (prisma.organization.findFirst as jest.Mock).mockImplementation(({ where }: any) => {
      if (where.taxId === '22-222' || where.name?.contains?.('Red Cross')) {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });
    (prisma.organization.create as jest.Mock).mockResolvedValue({ id: 600, name: 'Red Cross', taxId: '22-222' });

    // Mock donationEvent searches:
    // We import two events:
    // - Event 1: Goodwill, ITEMS, 2026-06-12, total value 100.
    //   Assume a duplicate event exists in the primary database on the same day for Goodwill with total value 100.
    //   So Event 1 should be skipped.
    // - Event 2: Red Cross, ITEMS, 2026-06-12, total value 45.
    //   No duplicate exists.
    (prisma.donationEvent.findMany as jest.Mock).mockImplementation(({ where }: any) => {
      if (where.organizationId === 500) {
        // Goodwill events on that day
        return Promise.resolve([
          {
            id: 800,
            organizationId: 500,
            date: new Date('2026-06-12T00:00:00.000Z'),
            type: 'ITEMS',
            cashAmount: null,
            items: [
              { quantity: 2, lockedValue: 50 } // Total value = 100
            ],
            photos: []
          }
        ]);
      }
      return Promise.resolve([]); // Goodwill has no events or other orgs have no events
    });
    (prisma.donationEvent.create as jest.Mock).mockResolvedValue({ id: 900 });

    // 2. Build sync package payload
    const metadata = {
      version: 1,
      exportedAt: new Date().toISOString(),
      categories: [
        { id: 1, name: 'Clothing' },
        { id: 2, name: 'Electronics' }
      ],
      items: [
        { id: 10, categoryId: 1, description: 'Shirt', isCustomItem: false },
        { id: 20, categoryId: 2, description: 'Phone', isCustomItem: true }
      ],
      organizations: [
        { id: 30, name: 'Goodwill', taxId: '11-111' },
        { id: 40, name: 'Red Cross', taxId: '22-222' }
      ],
      donationEvents: [
        { id: 50, organizationId: 30, date: '2026-06-12T00:00:00.000Z', type: 'ITEMS', cashAmount: null },
        { id: 60, organizationId: 40, date: '2026-06-12T00:00:00.000Z', type: 'ITEMS', cashAmount: null }
      ],
      donatedItems: [
        // Belongs to Event 50 (Goodwill duplicate - should be skipped)
        { id: 100, eventId: 50, itemId: 10, quantity: 2, condition: 'High', lockedValue: 50 },
        // Belongs to Event 60 (Red Cross new - should be imported)
        { id: 200, eventId: 60, itemId: 20, quantity: 1, condition: 'High', lockedValue: 45 }
      ],
      eventPhotos: [
        // Photo for skipped event 50
        { id: 500, eventId: 50, filePath: 'photos/photo1.jpg' },
        // Photo for new event 60
        { id: 600, eventId: 60, filePath: 'photos/photo2.jpg' }
      ],
    };

    const zipBuffer = createMockZipBuffer({
      'metadata.json': JSON.stringify(metadata),
      'photos/photo1.jpg': 'photo1 bytes',
      'photos/photo2.jpg': 'photo2 bytes',
    });

    const formData = createFormData(zipBuffer);
    const result = await importSyncPackage(formData);

    expect(result.success).toBe(true);

    // Assertions:
    // Category 'Electronics' should be created. 'Clothing' should not.
    expect(prisma.category.create).toHaveBeenCalledTimes(1);
    expect(prisma.category.create).toHaveBeenCalledWith({ data: { name: 'Electronics' } });

    // Item 'Phone' (new custom item) should be created. 'Shirt' should not.
    expect(prisma.item.create).toHaveBeenCalledTimes(1);
    expect(prisma.item.create).toHaveBeenCalledWith({
      data: {
        categoryId: 200, // mapped categoryId
        description: 'Phone',
        leafName: '',
        defaultHigh: null,
        defaultMedium: null,
        userHigh: null,
        userMedium: null,
        isCustomItem: true
      }
    });

    // Organization 'Red Cross' should be created. 'Goodwill' should not.
    expect(prisma.organization.create).toHaveBeenCalledTimes(1);
    expect(prisma.organization.create).toHaveBeenCalledWith({
      data: {
        name: 'Red Cross',
        address: null,
        taxId: '22-222'
      }
    });

    // Event 50 (Goodwill) is duplicate, so it is skipped. Event 60 (Red Cross) is created.
    expect(prisma.donationEvent.create).toHaveBeenCalledTimes(1);
    expect(prisma.donationEvent.create).toHaveBeenCalledWith({
      data: {
        organizationId: 600, // mapped organizationId
        date: new Date('2026-06-12T00:00:00.000Z'),
        type: 'ITEMS',
        cashAmount: null,
        assetTicker: null,
        assetShares: null,
        notes: null
      }
    });

    // Donated items should be created sequentially
    expect(prisma.donatedItem.create).toHaveBeenCalledTimes(1);
    expect(prisma.donatedItem.create).toHaveBeenCalledWith({
      data: {
        eventId: 900, // resolved from donationEvent.create mock resolve
        itemId: 400,  // mapped itemId
        quantity: 1,
        condition: 'High',
        lockedValue: 45
      }
    });

    // Event photo should be created
    expect(prisma.eventPhoto.create).toHaveBeenCalledTimes(1);
    expect(prisma.eventPhoto.create).toHaveBeenCalledWith({
      data: {
        eventId: 900,
        filePath: expect.stringContaining('photo2.jpg')
      }
    });

    // Photo copying should only copy photo2.jpg, since photo1.jpg belonged to skipped event.
    expect(spyCopyFile).toHaveBeenCalledTimes(1);
    expect(spyCopyFile).toHaveBeenCalledWith(
      expect.stringContaining('photo2.jpg'), // source path in tempDir
      expect.stringContaining('photo2.jpg')  // target path in storage
    );
    expect(spyUnlink).not.toHaveBeenCalled(); // No errors, no unlinks should happen
  });

  it('should rollback transaction and delete copied photo files on database write error', async () => {
    // Setup Prisma mocks:
    // Make organization search return Goodwill
    (prisma.organization.findUnique as jest.Mock).mockResolvedValue({ id: 500, name: 'Goodwill' });
    // Make donationEvent search return no events (not duplicate)
    (prisma.donationEvent.findMany as jest.Mock).mockResolvedValue([]);
    // Make donationEvent.create resolve to event ID 999
    (prisma.donationEvent.create as jest.Mock).mockResolvedValue({ id: 999 });
    // Force eventPhoto.create to throw a database unique key constraint error
    (prisma.eventPhoto.create as jest.Mock).mockRejectedValue(new Error('Prisma database constraint error'));

    const metadata = {
      version: 1,
      exportedAt: new Date().toISOString(),
      categories: [],
      items: [],
      organizations: [{ id: 30, name: 'Goodwill' }],
      donationEvents: [{ id: 50, organizationId: 30, date: '2026-06-12T00:00:00.000Z', type: 'ITEMS' }],
      donatedItems: [],
      eventPhotos: [{ id: 500, eventId: 50, filePath: 'photos/receipt.jpg' }],
    };

    const zipBuffer = createMockZipBuffer({
      'metadata.json': JSON.stringify(metadata),
      'photos/receipt.jpg': 'photo bytes',
    });

    const formData = createFormData(zipBuffer);
    const result = await importSyncPackage(formData) as any;

    expect(result.success).toBe(false);
    expect(result.error).toContain('Prisma database constraint error');

    // Verify copy was attempted
    expect(spyCopyFile).toHaveBeenCalledTimes(1);

    // Verify copy was cleaned up (unlinked) during rollback
    expect(spyUnlink).toHaveBeenCalledTimes(1);
    expect(spyUnlink).toHaveBeenCalledWith(expect.stringContaining('receipt.jpg'));
  });
});


import { PrismaClient } from '@prisma/client';
import { beforeEach } from '@jest/globals';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

import { prisma } from '../prisma';

jest.mock('../prisma', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});

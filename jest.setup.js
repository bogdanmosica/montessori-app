// Jest setup file for admin dashboard tests
require('@jest/globals');

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
}));

jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((fn) => fn),
  revalidateTag: jest.fn(),
}));

// Mock Auth - only mock if the file exists
try {
  jest.mock('@/lib/auth/config', () => ({
    auth: jest.fn(),
  }));
} catch (e) {
  // Auth config not found, skip mock
}

// Mock Database
jest.mock('@/lib/db/drizzle', () => ({
  db: {
    select: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    groupBy: jest.fn(),
    leftJoin: jest.fn(),
    limit: jest.fn(),
  },
}));

// Set up test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.AUTH_SECRET = 'test-secret';
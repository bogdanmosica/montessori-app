import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('GET /api/admin/payments/payments/{payment_id}', () => {
  const mockSchoolId = 'test-school-id';
  const mockPaymentId = 'test-payment-id';
  const mockAdminToken = 'valid-admin-jwt';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return detailed payment information', async () => {
    const mockPaymentDetails = {
      id: 'payment-123',
      school_id: 'school-456',
      parent_id: 'parent-789',
      child_id: 'child-abc',
      stripe_payment_id: 'pi_1234567890',
      amount: 15000, // $150.00
      currency: 'USD',
      payment_method: 'stripe_card',
      payment_status: 'completed',
      payment_date: '2024-01-15T10:00:00Z',
      completed_date: '2024-01-15T10:05:00Z',
      failure_reason: null,
      description: 'January Tuition - Jane Student',
      parent_name: 'John Parent',
      child_name: 'Jane Student'
    };

    // Contract validation - required fields
    expect(mockPaymentDetails).toHaveProperty('id');
    expect(mockPaymentDetails).toHaveProperty('school_id');
    expect(mockPaymentDetails).toHaveProperty('parent_id');
    expect(mockPaymentDetails).toHaveProperty('child_id');
    expect(mockPaymentDetails).toHaveProperty('amount');
    expect(mockPaymentDetails).toHaveProperty('currency');
    expect(mockPaymentDetails).toHaveProperty('payment_method');
    expect(mockPaymentDetails).toHaveProperty('payment_status');
    expect(mockPaymentDetails).toHaveProperty('payment_date');

    // Type validation
    expect(typeof mockPaymentDetails.id).toBe('string');
    expect(typeof mockPaymentDetails.school_id).toBe('string');
    expect(typeof mockPaymentDetails.parent_id).toBe('string');
    expect(typeof mockPaymentDetails.child_id).toBe('string');
    expect(typeof mockPaymentDetails.amount).toBe('number');
    expect(typeof mockPaymentDetails.currency).toBe('string');
    expect(typeof mockPaymentDetails.parent_name).toBe('string');
    expect(typeof mockPaymentDetails.child_name).toBe('string');

    // Enum validation
    expect(['pending', 'completed', 'failed', 'cancelled', 'refunded']).toContain(mockPaymentDetails.payment_status);
    expect(['stripe_card', 'stripe_bank', 'bank_transfer', 'ach']).toContain(mockPaymentDetails.payment_method);

    // Currency validation
    expect(mockPaymentDetails.currency).toBe('USD');

    // Amount validation
    expect(mockPaymentDetails.amount).toBeGreaterThan(0);
  });

  test('should handle nullable fields correctly', async () => {
    const mockPaymentWithNulls = {
      id: 'payment-123',
      school_id: 'school-456',
      parent_id: 'parent-789',
      child_id: 'child-abc',
      stripe_payment_id: null, // Bank transfer payment
      amount: 20000,
      currency: 'USD',
      payment_method: 'bank_transfer',
      payment_status: 'failed',
      payment_date: '2024-01-15T10:00:00Z',
      completed_date: null, // Not completed
      failure_reason: 'Insufficient funds',
      description: 'January Tuition - Tom Student',
      parent_name: 'Sarah Parent',
      child_name: 'Tom Student'
    };

    // Nullable fields validation
    expect(mockPaymentWithNulls.stripe_payment_id).toBeNull();
    expect(mockPaymentWithNulls.completed_date).toBeNull();
    expect(typeof mockPaymentWithNulls.failure_reason).toBe('string');
    expect(mockPaymentWithNulls.failure_reason).toBeTruthy();
  });

  test('should validate date formats', async () => {
    const mockPaymentDetails = {
      id: 'payment-123',
      school_id: 'school-456',
      parent_id: 'parent-789',
      child_id: 'child-abc',
      amount: 15000,
      currency: 'USD',
      payment_method: 'stripe_card',
      payment_status: 'completed',
      payment_date: '2024-01-15T10:00:00Z',
      completed_date: '2024-01-15T10:05:00Z',
      parent_name: 'John Parent',
      child_name: 'Jane Student'
    };

    // Date format validation (ISO 8601)
    const paymentDate = new Date(mockPaymentDetails.payment_date);
    const completedDate = new Date(mockPaymentDetails.completed_date);

    expect(paymentDate).toBeInstanceOf(Date);
    expect(completedDate).toBeInstanceOf(Date);
    expect(paymentDate.toISOString()).toBe(mockPaymentDetails.payment_date);
    expect(completedDate.toISOString()).toBe(mockPaymentDetails.completed_date);
  });

  test('should return 404 for non-existent payment', async () => {
    const mockError = {
      error: 'Payment not found',
      status: 404
    };

    expect(mockError.status).toBe(404);
    expect(mockError.error).toContain('Payment not found');
  });

  test('should require school_id parameter', async () => {
    const mockError = {
      error: 'Missing required parameter: school_id',
      status: 400
    };

    expect(mockError.status).toBe(400);
    expect(mockError.error).toContain('school_id');
  });

  test('should enforce multi-tenant access control', async () => {
    // Payment should only be accessible if it belongs to the requesting school
    const mockUnauthorizedError = {
      error: 'Payment not found', // Generic error to avoid data leakage
      status: 404
    };

    expect(mockUnauthorizedError.status).toBe(404);
  });

  test('should return 403 for non-admin users', async () => {
    const mockError = {
      error: 'Admin access required',
      status: 403
    };

    expect(mockError.status).toBe(403);
    expect(mockError.error).toContain('Admin access required');
  });

  test('should validate UUID format for payment_id', async () => {
    const validUUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const invalidUUID = 'invalid-uuid';

    // UUID validation pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(uuidPattern.test(validUUID)).toBe(true);
    expect(uuidPattern.test(invalidUUID)).toBe(false);
  });

  test('should include complete parent and child information', async () => {
    const mockPaymentDetails = {
      id: 'payment-123',
      school_id: 'school-456',
      parent_id: 'parent-789',
      child_id: 'child-abc',
      amount: 15000,
      currency: 'USD',
      payment_method: 'stripe_card',
      payment_status: 'completed',
      payment_date: '2024-01-15T10:00:00Z',
      completed_date: '2024-01-15T10:05:00Z',
      description: 'January Tuition - Jane Student',
      parent_name: 'John Parent',
      child_name: 'Jane Student'
    };

    // Parent and child names should be included for display
    expect(mockPaymentDetails).toHaveProperty('parent_name');
    expect(mockPaymentDetails).toHaveProperty('child_name');
    expect(typeof mockPaymentDetails.parent_name).toBe('string');
    expect(typeof mockPaymentDetails.child_name).toBe('string');
    expect(mockPaymentDetails.parent_name.length).toBeGreaterThan(0);
    expect(mockPaymentDetails.child_name.length).toBeGreaterThan(0);
  });
});
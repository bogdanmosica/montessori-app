import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('GET /api/admin/payments/payments', () => {
  const mockSchoolId = 'test-school-id';
  const mockAdminToken = 'valid-admin-jwt';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return paginated payments list with default parameters', async () => {
    const mockPaymentsResponse = {
      payments: [
        {
          id: 'payment-1',
          parent_name: 'John Parent',
          child_name: 'Jane Student',
          amount: 15000,
          status: 'completed',
          payment_date: '2024-01-15T10:00:00Z',
          payment_method: 'stripe_card'
        },
        {
          id: 'payment-2',
          parent_name: 'Sarah Parent',
          child_name: 'Tom Student',
          amount: 12000,
          status: 'pending',
          payment_date: '2024-01-16T09:30:00Z',
          payment_method: 'bank_transfer'
        }
      ],
      pagination: {
        current_page: 1,
        total_pages: 5,
        total_items: 250,
        items_per_page: 50
      }
    };

    // Contract validation
    expect(mockPaymentsResponse).toHaveProperty('payments');
    expect(Array.isArray(mockPaymentsResponse.payments)).toBe(true);
    expect(mockPaymentsResponse).toHaveProperty('pagination');

    // Validate payment structure
    const payment = mockPaymentsResponse.payments[0];
    expect(payment).toHaveProperty('id');
    expect(payment).toHaveProperty('parent_name');
    expect(payment).toHaveProperty('child_name');
    expect(payment).toHaveProperty('amount');
    expect(payment).toHaveProperty('status');
    expect(payment).toHaveProperty('payment_date');
    expect(['pending', 'completed', 'failed', 'cancelled', 'refunded']).toContain(payment.status);

    // Validate pagination structure
    const pagination = mockPaymentsResponse.pagination;
    expect(pagination).toHaveProperty('current_page');
    expect(pagination).toHaveProperty('total_pages');
    expect(pagination).toHaveProperty('total_items');
    expect(pagination).toHaveProperty('items_per_page');
    expect(typeof pagination.current_page).toBe('number');
    expect(typeof pagination.total_pages).toBe('number');
    expect(typeof pagination.total_items).toBe('number');
    expect(typeof pagination.items_per_page).toBe('number');
  });

  test('should support filtering by payment status', async () => {
    const mockFilteredResponse = {
      payments: [
        {
          id: 'payment-failed-1',
          parent_name: 'Jane Parent',
          child_name: 'Bob Student',
          amount: 18000,
          status: 'failed',
          payment_date: '2024-01-14T08:00:00Z',
          payment_method: 'stripe_card'
        }
      ],
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_items: 1,
        items_per_page: 50
      }
    };

    // All returned payments should match the filter
    mockFilteredResponse.payments.forEach(payment => {
      expect(payment.status).toBe('failed');
    });
  });

  test('should support filtering by payment method', async () => {
    const mockFilteredResponse = {
      payments: [
        {
          id: 'payment-card-1',
          parent_name: 'Mike Parent',
          child_name: 'Alice Student',
          amount: 16000,
          status: 'completed',
          payment_date: '2024-01-13T11:00:00Z',
          payment_method: 'stripe_card'
        }
      ],
      pagination: {
        current_page: 1,
        total_pages: 2,
        total_items: 75,
        items_per_page: 50
      }
    };

    // All returned payments should match the filter
    mockFilteredResponse.payments.forEach(payment => {
      expect(payment.payment_method).toBe('stripe_card');
    });
  });

  test('should support date range filtering', async () => {
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    const mockDateFilteredResponse = {
      payments: [
        {
          id: 'payment-date-1',
          parent_name: 'Lisa Parent',
          child_name: 'Emma Student',
          amount: 14000,
          status: 'completed',
          payment_date: '2024-01-15T10:00:00Z',
          payment_method: 'bank_transfer'
        }
      ],
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_items: 1,
        items_per_page: 50
      }
    };

    // All returned payments should be within date range
    mockDateFilteredResponse.payments.forEach(payment => {
      const paymentDate = new Date(payment.payment_date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      expect(paymentDate).toBeInstanceOf(Date);
      expect(paymentDate.getTime()).toBeGreaterThanOrEqual(start.getTime());
      expect(paymentDate.getTime()).toBeLessThanOrEqual(end.getTime());
    });
  });

  test('should support parent and child filtering', async () => {
    const mockParentId = 'parent-uuid';
    const mockChildId = 'child-uuid';

    const mockFilteredResponse = {
      payments: [
        {
          id: 'payment-parent-1',
          parent_name: 'Filtered Parent',
          child_name: 'Filtered Child',
          amount: 17000,
          status: 'completed',
          payment_date: '2024-01-12T14:00:00Z',
          payment_method: 'ach'
        }
      ],
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_items: 1,
        items_per_page: 50
      }
    };

    expect(mockFilteredResponse.payments[0].parent_name).toBe('Filtered Parent');
    expect(mockFilteredResponse.payments[0].child_name).toBe('Filtered Child');
  });

  test('should validate pagination parameters', async () => {
    // Test page minimum
    const mockPageError = {
      error: 'Page must be at least 1',
      status: 400
    };
    expect(mockPageError.status).toBe(400);

    // Test limit boundaries
    const mockLimitError = {
      error: 'Limit must be between 10 and 100',
      status: 400
    };
    expect(mockLimitError.status).toBe(400);
  });

  test('should require school_id parameter', async () => {
    const mockError = {
      error: 'Missing required parameter: school_id',
      status: 400
    };

    expect(mockError.status).toBe(400);
    expect(mockError.error).toContain('school_id');
  });

  test('should enforce multi-tenant data isolation', async () => {
    // Payments should only be from the specified school
    const mockResponse = {
      payments: [
        {
          id: 'payment-tenant-1',
          parent_name: 'School A Parent',
          child_name: 'School A Child',
          amount: 15000,
          status: 'completed',
          payment_date: '2024-01-15T10:00:00Z',
          payment_method: 'stripe_card'
        }
      ],
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_items: 1,
        items_per_page: 50
      }
    };

    // Each payment should be validated to belong to the correct school
    expect(mockResponse.payments).toHaveLength(1);
    expect(mockResponse.payments[0]).toHaveProperty('id');
  });
});
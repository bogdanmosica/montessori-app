// Temporary alert service stub
export interface AlertDetails {
  id: string;
  parentId: string | null;
  parentName: string | null;
  paymentId: string | null;
  alertType: 'failed_payment' | 'overdue_payment' | 'expired_card' | 'webhook_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  isResolved: boolean;
  resolvedBy: number | null;
  resolvedAt: Date | null;
  createdAt: Date;
}

export interface AlertsResponse {
  alerts: AlertDetails[];
}

export async function getPaymentAlerts(
  schoolId: string,
  limit: number = 10,
  isResolved: boolean = false
): Promise<AlertsResponse> {
  // Return mock data for now
  const mockAlerts: AlertDetails[] = [
    {
      id: "alert-1",
      parentId: "parent-1",
      parentName: "Johnson Family",
      paymentId: "payment-123",
      alertType: "overdue_payment",
      severity: "high",
      title: "Payment Overdue",
      message: "Payment is 5 days overdue",
      isResolved: false,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: new Date()
    },
    {
      id: "alert-2",
      parentId: "parent-2",
      parentName: "Brown Family",
      paymentId: "payment-456",
      alertType: "failed_payment",
      severity: "critical",
      title: "Payment Failed",
      message: "Payment failed: Insufficient funds",
      isResolved: false,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: new Date()
    }
  ];

  return {
    alerts: isResolved ? [] : mockAlerts.slice(0, limit)
  };
}

export async function resolvePaymentAlert(
  alertId: string,
  schoolId: number,
  resolutionNotes: string,
  resolvedBy: number
): Promise<void> {
  // Stub implementation
  console.log(`Alert ${alertId} resolved for school ${schoolId} by user ${resolvedBy}`);
}

export async function createWebhookFailureAlert(
  schoolId: number,
  webhookEvent: string,
  errorMessage: string
): Promise<void> {
  // Stub implementation
  console.log(`Webhook failure alert created for school ${schoolId}: ${errorMessage}`);
}

export async function createFailedPaymentAlert(
  schoolId: number,
  paymentId: string,
  parentId: string,
  errorMessage: string
): Promise<void> {
  // Stub implementation
  console.log(`Failed payment alert created for school ${schoolId}, payment ${paymentId}`);
}
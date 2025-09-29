// Temporary stub for alert service
export async function getActiveAlertsCount(schoolId: number): Promise<number> {
  return 0;
}

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
  schoolId: number,
  severity?: 'low' | 'medium' | 'high' | 'critical',
  isResolved: boolean = false
): Promise<AlertsResponse> {
  return { alerts: [] };
}
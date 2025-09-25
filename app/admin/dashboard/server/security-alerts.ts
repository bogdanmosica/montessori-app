// T014: Create security alerts query helpers
import { db } from '@/lib/db/drizzle';
import { securityAlerts } from '@/lib/db/schema';
import { eq, and, desc, gte, isNull, or } from 'drizzle-orm';
import { AlertSeverity, AlertType, type SecurityAlert } from '@/lib/types/dashboard';

export async function getSecurityAlerts(
  schoolId?: string,
  options: {
    includeResolved?: boolean;
    severity?: AlertSeverity[];
    limit?: number;
  } = {}
): Promise<SecurityAlert[]> {
  try {
    const {
      includeResolved = false,
      severity,
      limit = 50
    } = options;

    let query = db
      .select()
      .from(securityAlerts);

    // Build WHERE conditions
    const conditions = [];

    // School scoping - null schoolId means system-wide alerts
    if (schoolId) {
      conditions.push(eq(securityAlerts.schoolId, parseInt(schoolId)));
    } else {
      // For system-wide view, include both school-specific and system alerts
      conditions.push(or(
        eq(securityAlerts.schoolId, parseInt(schoolId || '0')),
        isNull(securityAlerts.schoolId)
      ));
    }

    // Resolved filter
    if (!includeResolved) {
      conditions.push(eq(securityAlerts.resolved, false));
    }

    // Severity filter
    if (severity && severity.length > 0) {
      const severityConditions = severity.map(s => eq(securityAlerts.severity, s));
      conditions.push(or(...severityConditions));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const alerts = await query
      .orderBy(desc(securityAlerts.createdAt))
      .limit(limit);

    return alerts.map(alert => ({
      id: alert.id,
      type: alert.type as AlertType,
      severity: alert.severity as AlertSeverity,
      message: alert.message,
      timestamp: alert.createdAt,
      resolved: alert.resolved,
      metadata: alert.metadata ? JSON.parse(alert.metadata) : {},
    }));
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    throw new Error('Failed to fetch security alerts');
  }
}

export async function createFailedLoginAlert(alertData: {
  ipAddress: string;
  userEmail: string;
  attempts: number;
  schoolId: string;
}) {
  try {
    const metadata = {
      ipAddress: alertData.ipAddress,
      userEmail: alertData.userEmail,
      attempts: alertData.attempts,
      timestamp: new Date().toISOString(),
    };

    const alert = await db
      .insert(securityAlerts)
      .values({
        schoolId: parseInt(alertData.schoolId),
        type: 'failed_logins',
        severity: alertData.attempts >= 5 ? 'high' : 'medium',
        message: `${alertData.attempts} failed login attempts from IP ${alertData.ipAddress}`,
        metadata: JSON.stringify(metadata),
        resolved: false,
      })
      .returning();

    return {
      id: alert[0].id,
      type: alert[0].type as AlertType,
      severity: alert[0].severity as AlertSeverity,
      message: alert[0].message,
      timestamp: alert[0].createdAt,
      resolved: alert[0].resolved,
      metadata,
    };
  } catch (error) {
    console.error('Error creating failed login alert:', error);
    throw new Error('Failed to create failed login alert');
  }
}

export async function detectSuspiciousIP(loginData: {
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  schoolId: string;
}): Promise<SecurityAlert | null> {
  try {
    // Simple suspicious IP detection logic
    // In production, this would integrate with GeoIP services and threat intelligence
    const suspiciousPatterns = [
      /^10\./, // Private networks outside expected range
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private networks
      /^192\.168\./, // Local networks (if not expected)
      /^127\./, // Localhost
    ];

    const isSuspicious = suspiciousPatterns.some(pattern =>
      pattern.test(loginData.ipAddress)
    );

    if (isSuspicious) {
      const metadata = {
        ipAddress: loginData.ipAddress,
        userEmail: loginData.userEmail,
        userAgent: loginData.userAgent,
        detectionReason: 'unusual_ip_pattern',
        timestamp: new Date().toISOString(),
      };

      const alert = await db
        .insert(securityAlerts)
        .values({
          schoolId: parseInt(loginData.schoolId),
          type: 'suspicious_ip',
          severity: 'high',
          message: `Login from suspicious IP address ${loginData.ipAddress} for user ${loginData.userEmail}`,
          metadata: JSON.stringify(metadata),
          resolved: false,
        })
        .returning();

      return {
        id: alert[0].id,
        type: alert[0].type as AlertType,
        severity: alert[0].severity as AlertSeverity,
        message: alert[0].message,
        timestamp: alert[0].createdAt,
        resolved: alert[0].resolved,
        metadata,
      };
    }

    return null;
  } catch (error) {
    console.error('Error detecting suspicious IP:', error);
    return null;
  }
}

export async function escalateAlertSeverity(
  alertId: string,
  escalationData: {
    reason: string;
    additionalAttempts?: number;
  }
) {
  try {
    // Get current alert
    const currentAlert = await db
      .select()
      .from(securityAlerts)
      .where(eq(securityAlerts.id, alertId))
      .limit(1);

    if (!currentAlert[0]) {
      throw new Error('Alert not found');
    }

    const alert = currentAlert[0];
    let newSeverity: AlertSeverity = alert.severity as AlertSeverity;

    // Escalate severity
    switch (alert.severity) {
      case 'low':
        newSeverity = AlertSeverity.MEDIUM;
        break;
      case 'medium':
        newSeverity = AlertSeverity.HIGH;
        break;
      case 'high':
        newSeverity = AlertSeverity.CRITICAL;
        break;
    }

    const updatedMetadata = {
      ...JSON.parse(alert.metadata || '{}'),
      escalated: true,
      escalationReason: escalationData.reason,
      originalSeverity: alert.severity,
      escalatedAt: new Date().toISOString(),
    };

    if (escalationData.additionalAttempts) {
      updatedMetadata.additionalAttempts = escalationData.additionalAttempts;
    }

    const updatedAlert = await db
      .update(securityAlerts)
      .set({
        severity: newSeverity,
        message: `${alert.message} (escalated due to ${escalationData.reason})`,
        metadata: JSON.stringify(updatedMetadata),
      })
      .where(eq(securityAlerts.id, alertId))
      .returning();

    return {
      id: updatedAlert[0].id,
      type: updatedAlert[0].type as AlertType,
      severity: updatedAlert[0].severity as AlertSeverity,
      message: updatedAlert[0].message,
      timestamp: updatedAlert[0].createdAt,
      resolved: updatedAlert[0].resolved,
      metadata: updatedMetadata,
    };
  } catch (error) {
    console.error('Error escalating alert severity:', error);
    throw new Error('Failed to escalate alert severity');
  }
}

export async function resolveSecurityAlert(
  alertId: string,
  resolutionData: {
    resolvedBy: string;
    resolution: string;
    notes?: string;
  }
) {
  try {
    const currentAlert = await db
      .select()
      .from(securityAlerts)
      .where(eq(securityAlerts.id, alertId))
      .limit(1);

    if (!currentAlert[0]) {
      throw new Error('Alert not found');
    }

    const updatedMetadata = {
      ...JSON.parse(currentAlert[0].metadata || '{}'),
      resolution: resolutionData.resolution,
      resolutionNotes: resolutionData.notes,
      resolvedAt: new Date().toISOString(),
    };

    const resolvedAlert = await db
      .update(securityAlerts)
      .set({
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: parseInt(resolutionData.resolvedBy),
        metadata: JSON.stringify(updatedMetadata),
      })
      .where(eq(securityAlerts.id, alertId))
      .returning();

    return {
      id: resolvedAlert[0].id,
      type: resolvedAlert[0].type as AlertType,
      severity: resolvedAlert[0].severity as AlertSeverity,
      message: resolvedAlert[0].message,
      timestamp: resolvedAlert[0].createdAt,
      resolved: resolvedAlert[0].resolved,
      resolvedAt: resolvedAlert[0].resolvedAt,
      resolvedBy: resolvedAlert[0].resolvedBy?.toString(),
      metadata: updatedMetadata,
    };
  } catch (error) {
    console.error('Error resolving security alert:', error);
    throw new Error('Failed to resolve security alert');
  }
}

export async function createDataBreachAlert(breachData: {
  schoolId?: string;
  suspiciousActivity: string;
  affectedTables?: string[];
  severity?: AlertSeverity;
}) {
  try {
    const metadata = {
      suspiciousActivity: breachData.suspiciousActivity,
      affectedTables: breachData.affectedTables || [],
      detectedAt: new Date().toISOString(),
      source: 'automated_detection',
    };

    const alert = await db
      .insert(securityAlerts)
      .values({
        schoolId: breachData.schoolId ? parseInt(breachData.schoolId) : null,
        type: 'data_breach_attempt',
        severity: breachData.severity || 'critical',
        message: `Potential data breach detected: ${breachData.suspiciousActivity}`,
        metadata: JSON.stringify(metadata),
        resolved: false,
      })
      .returning();

    return {
      id: alert[0].id,
      type: alert[0].type as AlertType,
      severity: alert[0].severity as AlertSeverity,
      message: alert[0].message,
      timestamp: alert[0].createdAt,
      resolved: alert[0].resolved,
      metadata,
    };
  } catch (error) {
    console.error('Error creating data breach alert:', error);
    throw new Error('Failed to create data breach alert');
  }
}
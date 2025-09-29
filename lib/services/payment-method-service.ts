import { db } from '@/lib/db';
import {
  paymentMethods,
  PaymentMethod,
  NewPaymentMethod
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface PaymentMethodDetails {
  id: string;
  paymentType: 'card' | 'bank_account' | 'ach';
  isPrimary: boolean;
  lastFour: string;
  brand: string;
  expiresAt: Date | null;
  isActive: boolean;
}

export interface PaymentMethodsResponse {
  paymentMethods: PaymentMethodDetails[];
}

export async function getPaymentMethodsForParent(
  schoolId: number,
  parentId: string
): Promise<PaymentMethodsResponse> {
  const methods = await db
    .select({
      id: paymentMethods.id,
      paymentType: paymentMethods.paymentType,
      isPrimary: paymentMethods.isPrimary,
      lastFour: paymentMethods.lastFour,
      brand: paymentMethods.brand,
      expiresAt: paymentMethods.expiresAt,
      isActive: paymentMethods.isActive,
    })
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.schoolId, schoolId),
        eq(paymentMethods.parentId, parentId),
        eq(paymentMethods.isActive, true)
      )
    )
    .orderBy(paymentMethods.isPrimary); // Primary methods first

  return {
    paymentMethods: methods
  };
}

export async function createPaymentMethod(data: NewPaymentMethod): Promise<PaymentMethod> {
  // If this is being set as primary, unset other primary methods for this parent
  if (data.isPrimary) {
    await db
      .update(paymentMethods)
      .set({ isPrimary: false })
      .where(
        and(
          eq(paymentMethods.schoolId, data.schoolId),
          eq(paymentMethods.parentId, data.parentId),
          eq(paymentMethods.isPrimary, true)
        )
      );
  }

  const result = await db
    .insert(paymentMethods)
    .values(data)
    .returning();

  return result[0];
}

export async function updatePaymentMethod(
  methodId: string,
  schoolId: number,
  updates: Partial<PaymentMethod>
): Promise<boolean> {
  // If setting as primary, unset other primary methods for this parent
  if (updates.isPrimary) {
    const method = await db
      .select({ parentId: paymentMethods.parentId })
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.id, methodId),
          eq(paymentMethods.schoolId, schoolId)
        )
      )
      .limit(1);

    if (method.length > 0) {
      await db
        .update(paymentMethods)
        .set({ isPrimary: false })
        .where(
          and(
            eq(paymentMethods.schoolId, schoolId),
            eq(paymentMethods.parentId, method[0].parentId),
            eq(paymentMethods.isPrimary, true)
          )
        );
    }
  }

  const result = await db
    .update(paymentMethods)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(paymentMethods.id, methodId),
        eq(paymentMethods.schoolId, schoolId)
      )
    )
    .returning();

  return result.length > 0;
}

export async function deactivatePaymentMethod(
  methodId: string,
  schoolId: number
): Promise<boolean> {
  const result = await db
    .update(paymentMethods)
    .set({
      isActive: false,
      isPrimary: false,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(paymentMethods.id, methodId),
        eq(paymentMethods.schoolId, schoolId)
      )
    )
    .returning();

  return result.length > 0;
}

export async function getPrimaryPaymentMethod(
  schoolId: number,
  parentId: string
): Promise<PaymentMethod | null> {
  const result = await db
    .select()
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.schoolId, schoolId),
        eq(paymentMethods.parentId, parentId),
        eq(paymentMethods.isPrimary, true),
        eq(paymentMethods.isActive, true)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
import { db } from '@/lib/db';
import {
  invoices,
  invoiceLineItems,
  parentProfiles,
  children,
  Invoice,
  NewInvoice,
  InvoiceLineItem,
  NewInvoiceLineItem
} from '@/lib/db/schema';
import { eq, and, desc, gte, lte, count } from 'drizzle-orm';

export interface InvoiceFilters {
  schoolId: number;
  parentId?: string;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueBefore?: Date;
  page?: number;
  limit?: number;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  parentName: string;
  totalAmount: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate: Date | null;
}

export interface InvoiceDetails extends InvoiceSummary {
  schoolId: number;
  parentId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  subtotal: string;
  taxAmount: string;
  pdfUrl: string | null;
  lineItems: InvoiceLineItemDetails[];
}

export interface InvoiceLineItemDetails {
  id: string;
  childId: string;
  childName: string;
  description: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  itemType: 'tuition' | 'fees' | 'supplies' | 'activities' | 'other';
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
}

export interface InvoicesListResponse {
  invoices: InvoiceSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export async function getInvoicesList(filters: InvoiceFilters): Promise<InvoicesListResponse> {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100);
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [eq(invoices.schoolId, filters.schoolId)];

  if (filters.parentId) {
    conditions.push(eq(invoices.parentId, filters.parentId));
  }

  if (filters.status) {
    conditions.push(eq(invoices.status, filters.status));
  }

  if (filters.dueBefore) {
    conditions.push(lte(invoices.dueDate, filters.dueBefore));
  }

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(invoices)
    .where(and(...conditions));

  const totalItems = totalResult[0]?.count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  // Get invoices with parent info
  const invoiceResults = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      paidDate: invoices.paidDate,
      parentFirstName: parentProfiles.firstName,
      parentLastName: parentProfiles.lastName,
    })
    .from(invoices)
    .innerJoin(parentProfiles, eq(invoices.parentId, parentProfiles.id))
    .where(and(...conditions))
    .orderBy(desc(invoices.dueDate))
    .limit(limit)
    .offset(offset);

  const invoicesData: InvoiceSummary[] = invoiceResults.map(inv => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    parentName: `${inv.parentFirstName} ${inv.parentLastName}`,
    totalAmount: inv.totalAmount,
    status: inv.status,
    dueDate: inv.dueDate,
    paidDate: inv.paidDate
  }));

  return {
    invoices: invoicesData,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit
    }
  };
}

export async function getInvoiceDetails(invoiceId: string, schoolId: number): Promise<InvoiceDetails | null> {
  const invoiceResult = await db
    .select({
      id: invoices.id,
      schoolId: invoices.schoolId,
      parentId: invoices.parentId,
      invoiceNumber: invoices.invoiceNumber,
      billingPeriodStart: invoices.billingPeriodStart,
      billingPeriodEnd: invoices.billingPeriodEnd,
      subtotal: invoices.subtotal,
      taxAmount: invoices.taxAmount,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      paidDate: invoices.paidDate,
      pdfUrl: invoices.pdfUrl,
      parentFirstName: parentProfiles.firstName,
      parentLastName: parentProfiles.lastName,
    })
    .from(invoices)
    .innerJoin(parentProfiles, eq(invoices.parentId, parentProfiles.id))
    .where(
      and(
        eq(invoices.id, invoiceId),
        eq(invoices.schoolId, schoolId)
      )
    )
    .limit(1);

  if (invoiceResult.length === 0) {
    return null;
  }

  const invoice = invoiceResult[0];

  // Get line items
  const lineItemsResult = await db
    .select({
      id: invoiceLineItems.id,
      childId: invoiceLineItems.childId,
      description: invoiceLineItems.description,
      quantity: invoiceLineItems.quantity,
      unitPrice: invoiceLineItems.unitPrice,
      totalPrice: invoiceLineItems.totalPrice,
      itemType: invoiceLineItems.itemType,
      billingPeriodStart: invoiceLineItems.billingPeriodStart,
      billingPeriodEnd: invoiceLineItems.billingPeriodEnd,
      childFirstName: children.firstName,
      childLastName: children.lastName,
    })
    .from(invoiceLineItems)
    .innerJoin(children, eq(invoiceLineItems.childId, children.id))
    .where(eq(invoiceLineItems.invoiceId, invoiceId))
    .orderBy(invoiceLineItems.itemType);

  const lineItems: InvoiceLineItemDetails[] = lineItemsResult.map(item => ({
    id: item.id,
    childId: item.childId,
    childName: `${item.childFirstName} ${item.childLastName}`,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    itemType: item.itemType,
    billingPeriodStart: item.billingPeriodStart,
    billingPeriodEnd: item.billingPeriodEnd
  }));

  return {
    id: invoice.id,
    schoolId: invoice.schoolId,
    parentId: invoice.parentId,
    invoiceNumber: invoice.invoiceNumber,
    parentName: `${invoice.parentFirstName} ${invoice.parentLastName}`,
    billingPeriodStart: invoice.billingPeriodStart,
    billingPeriodEnd: invoice.billingPeriodEnd,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    status: invoice.status,
    dueDate: invoice.dueDate,
    paidDate: invoice.paidDate,
    pdfUrl: invoice.pdfUrl,
    lineItems
  };
}

export async function createInvoice(data: NewInvoice): Promise<Invoice> {
  const result = await db
    .insert(invoices)
    .values(data)
    .returning();

  return result[0];
}

export async function createInvoiceLineItem(data: NewInvoiceLineItem): Promise<InvoiceLineItem> {
  const result = await db
    .insert(invoiceLineItems)
    .values(data)
    .returning();

  return result[0];
}

export async function updateInvoiceStatus(
  invoiceId: string,
  schoolId: number,
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
  paidDate?: Date,
  sentDate?: Date
): Promise<boolean> {
  const updateData: Partial<Invoice> = {
    status,
    updatedAt: new Date()
  };

  if (paidDate) {
    updateData.paidDate = paidDate;
  }

  if (sentDate) {
    updateData.sentDate = sentDate;
  }

  const result = await db
    .update(invoices)
    .set(updateData)
    .where(
      and(
        eq(invoices.id, invoiceId),
        eq(invoices.schoolId, schoolId)
      )
    )
    .returning();

  return result.length > 0;
}

export async function generateInvoiceNumber(schoolId: number): Promise<string> {
  // Get the latest invoice number for this school
  const latestInvoice = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(eq(invoices.schoolId, schoolId))
    .orderBy(desc(invoices.createdAt))
    .limit(1);

  if (latestInvoice.length === 0) {
    return `INV-${schoolId}-0001`;
  }

  // Extract number from last invoice and increment
  const lastNumber = latestInvoice[0].invoiceNumber;
  const match = lastNumber.match(/INV-\d+-(\d+)$/);

  if (match) {
    const nextNumber = parseInt(match[1]) + 1;
    return `INV-${schoolId}-${nextNumber.toString().padStart(4, '0')}`;
  }

  return `INV-${schoolId}-0001`;
}
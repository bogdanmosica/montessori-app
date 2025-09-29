import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, AlertTriangle, Clock, CreditCard } from 'lucide-react';
import DashboardOverview from './dashboard-overview';
import PaymentHistory from './payment-history';
import PaymentAlerts from './payment-alerts';

export default function PaymentsDashboard() {
  return (
    <div className="w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payments</h1>
          <p className="text-muted-foreground">
            Manage parent payments, invoices, and payment methods
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <Button variant="outline">
            <DollarSign className="mr-2 h-4 w-4" />
            Process Payment
          </Button>
          <Button>
            <CreditCard className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Dashboard Overview Cards */}
      <DashboardOverview />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Payment History - Takes 3 columns on xl+ screens */}
        <div className="xl:col-span-3">
          <PaymentHistory />
        </div>

        {/* Payment Alerts - Takes 1 column on xl+ screens */}
        <div className="xl:col-span-1">
          <PaymentAlerts />
        </div>
      </div>
    </div>
  );
}
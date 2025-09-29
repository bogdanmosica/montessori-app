'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// Import report components
import { ReportTypeSelector } from './components/report-type-selector';
import { DateRangeFilter } from './components/date-range-filter';
import { StatusFilter } from './components/status-filter';
import { ExportButtons } from './components/export-buttons';
import { ApplicationsReportTable } from './components/applications-report-table';
import { EnrollmentsReportTable } from './components/enrollments-report-table';
import { PaymentsReportTable } from './components/payments-report-table';
import { ReportLoadingState } from './components/report-loading-state';
import { ReportEmptyState } from './components/report-empty-state';

// Import types and constants
import { REPORT_TYPES, EXPORT_FORMATS } from '@/lib/constants/report-constants';
import type {
  ApplicationReportRow,
  EnrollmentReportRow,
  PaymentReportRow,
  ActivityReportRow
} from '@/lib/types/report-types';

interface ReportFilters {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  status?: string[];
  activityType?: string[];
}

interface ReportData {
  data: (ApplicationReportRow | EnrollmentReportRow | PaymentReportRow | ActivityReportRow)[];
  metadata: {
    totalRows: number;
    generatedAt: Date;
    filters: ReportFilters;
    tenantId: string;
    requestedBy: string;
  };
}

export default function AdminReportsClient() {
  // State management
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [filters, setFilters] = useState<ReportFilters>({});
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset filters when report type changes
  useEffect(() => {
    setFilters({});
    setReportData(null);
    setError(null);
  }, [selectedReportType]);

  // Generate report
  const handleGenerateReport = async () => {
    if (!selectedReportType) {
      toast.error('Please select a report type first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.set('format', EXPORT_FORMATS.JSON);

      // Add date range filters
      if (filters.dateRange?.startDate) {
        params.set('startDate', filters.dateRange.startDate.toISOString());
      }
      if (filters.dateRange?.endDate) {
        params.set('endDate', filters.dateRange.endDate.toISOString());
      }

      // Add status/type filters
      if (filters.status?.length) {
        params.set('status', filters.status.join(','));
      }
      if (filters.activityType?.length) {
        params.set('activityType', filters.activityType.join(','));
      }

      // Make API request
      const response = await fetch(`/api/admin/reports/${selectedReportType}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate report: ${response.status}`);
      }

      const data = await response.json();
      setReportData(data);
      toast.success('Report generated successfully');

    } catch (error) {
      console.error('Report generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter handlers
  const handleDateRangeChange = (startDate?: Date, endDate?: Date) => {
    setFilters(prev => ({
      ...prev,
      dateRange: startDate && endDate ? { startDate, endDate } : undefined
    }));
  };

  const handleStatusChange = (status: string[]) => {
    setFilters(prev => ({
      ...prev,
      status: selectedReportType !== REPORT_TYPES.ACTIVITY ? status : undefined,
      activityType: selectedReportType === REPORT_TYPES.ACTIVITY ? status : undefined
    }));
  };

  const clearAllFilters = () => {
    setFilters({});
    setReportData(null);
    setError(null);
  };

  const refreshReport = () => {
    if (reportData) {
      handleGenerateReport();
    }
  };

  // Render report table based on type
  const renderReportTable = () => {
    if (!reportData || !reportData.data) return null;

    switch (selectedReportType) {
      case REPORT_TYPES.APPLICATIONS:
        return (
          <ApplicationsReportTable
            data={reportData.data as ApplicationReportRow[]}
            isLoading={isLoading}
          />
        );
      case REPORT_TYPES.ENROLLMENTS:
        return (
          <EnrollmentsReportTable
            data={reportData.data as EnrollmentReportRow[]}
            isLoading={isLoading}
          />
        );
      case REPORT_TYPES.PAYMENTS:
        return (
          <PaymentsReportTable
            data={reportData.data as PaymentReportRow[]}
            isLoading={isLoading}
          />
        );
      case REPORT_TYPES.ACTIVITY:
        // For now, render a simple table or use a generic component
        return (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Activity Report</h3>
                <span className="text-sm text-muted-foreground">
                  {reportData.data.length} records found
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Activity report table implementation is in progress. The data has been successfully
                retrieved and can be exported using the export buttons above.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Available data:</strong> User activities, login/logout events,
                  system access logs, and administrative actions.
                </p>
              </div>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  const hasFilters = filters.dateRange ||
                    (filters.status && filters.status.length > 0) ||
                    (filters.activityType && filters.activityType.length > 0);

  const showEmptyState = !isLoading && !error && reportData && reportData.data.length === 0;
  const showLoadingState = isLoading;
  const showErrorState = !isLoading && error;

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Reports</h1>
            <p className="text-muted-foreground mt-1">
              Generate comprehensive reports for applications, enrollments, payments, and activity
            </p>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Type Selection */}
          <div className="lg:col-span-2">
            <ReportTypeSelector
              selectedType={selectedReportType}
              onTypeSelect={setSelectedReportType}
            />
          </div>

          {/* Export Options */}
          <div>
            <ExportButtons
              reportType={selectedReportType}
              filters={filters}
              disabled={!selectedReportType}
            />
          </div>
        </div>

        {/* Filters */}
        {selectedReportType && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DateRangeFilter
              startDate={filters.dateRange?.startDate}
              endDate={filters.dateRange?.endDate}
              onDateRangeChange={handleDateRangeChange}
            />

            <StatusFilter
              reportType={selectedReportType}
              selectedStatuses={filters.status || filters.activityType || []}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}

        {/* Generate Report Button */}
        {selectedReportType && (
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={handleGenerateReport}
              disabled={isLoading}
              size="lg"
              className="min-w-[200px]"
            >
              {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>

            {hasFilters && (
              <Button
                variant="outline"
                onClick={clearAllFilters}
                disabled={isLoading}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        <Separator />

        {/* Report Results */}
        {showLoadingState && (
          <ReportLoadingState message="Generating your report..." />
        )}

        {showErrorState && (
          <Card className="p-6">
            <div className="text-center space-y-4">
              <div className="text-red-600">
                <h3 className="text-lg font-semibold">Error Generating Report</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <Button onClick={handleGenerateReport} variant="outline">
                Try Again
              </Button>
            </div>
          </Card>
        )}

        {showEmptyState && (
          <ReportEmptyState
            reportType={selectedReportType}
            hasFilters={hasFilters}
            onClearFilters={clearAllFilters}
            onRefresh={refreshReport}
          />
        )}

        {!showLoadingState && !showErrorState && !showEmptyState && reportData && (
          <div className="space-y-6">
            {/* Report Metadata */}
            <Card className="p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="font-medium">
                    {reportData.metadata.totalRows} records found
                  </span>
                  <span className="text-muted-foreground">
                    Generated {new Date(reportData.metadata.generatedAt).toLocaleString()}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={refreshReport}>
                  Refresh
                </Button>
              </div>
            </Card>

            {/* Report Table */}
            {renderReportTable()}
          </div>
        )}

        {/* Help Text */}
        {!selectedReportType && (
          <Card className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Welcome to Admin Reports</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Select a report type above to get started. You can filter data by date ranges and status,
                then export your results as CSV or PDF files for further analysis.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">📝</div>
                  <div className="text-sm font-medium mt-1">Applications</div>
                  <div className="text-xs text-muted-foreground">Student applications</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">👥</div>
                  <div className="text-sm font-medium mt-1">Enrollments</div>
                  <div className="text-xs text-muted-foreground">Active enrollments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">💳</div>
                  <div className="text-sm font-medium mt-1">Payments</div>
                  <div className="text-xs text-muted-foreground">Transaction history</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">📊</div>
                  <div className="text-sm font-medium mt-1">Activity</div>
                  <div className="text-xs text-muted-foreground">System activity logs</div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
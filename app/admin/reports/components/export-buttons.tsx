'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, File, Loader2 } from 'lucide-react';
import { EXPORT_FORMATS } from '@/lib/constants/report-constants';
import { toast } from 'sonner';

interface ExportButtonsProps {
  reportType: string;
  filters: any;
  disabled?: boolean;
  className?: string;
}

interface ExportState {
  isExporting: boolean;
  exportingFormat?: string;
}

export function ExportButtons({
  reportType,
  filters,
  disabled = false,
  className
}: ExportButtonsProps) {
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false
  });

  const handleExport = async (format: string) => {
    if (!reportType || disabled) {
      toast.error('Please select a report type first');
      return;
    }

    setExportState({ isExporting: true, exportingFormat: format });

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.set('format', format);

      // Add date range filters
      if (filters.dateRange?.startDate) {
        params.set('startDate', filters.dateRange.startDate.toISOString());
      }
      if (filters.dateRange?.endDate) {
        params.set('endDate', filters.dateRange.endDate.toISOString());
      }

      // Add status/type filters
      if (filters.status?.length > 0) {
        params.set('status', filters.status.join(','));
      }
      if (filters.activityType?.length > 0) {
        params.set('activityType', filters.activityType.join(','));
      }

      // Make API request
      const response = await fetch(`/api/admin/reports/${reportType}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Export failed: ${response.status}`);
      }

      // Handle file download
      if (format === EXPORT_FORMATS.CSV || format === EXPORT_FORMATS.PDF) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');

        // Extract filename from Content-Disposition header
        let filename = `${reportType}-report.${format}`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="([^"]+)"/);
          if (match) {
            filename = match[1];
          }
        }

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(`${format.toUpperCase()} report downloaded successfully`);
      } else {
        // For JSON format, handle as data response
        const data = await response.json();
        console.log('Report data:', data);
        toast.success('Report generated successfully');
      }

    } catch (error) {
      console.error('Export error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to export report. Please try again.'
      );
    } finally {
      setExportState({ isExporting: false });
    }
  };

  const getExportButtonContent = (format: string, icon: React.ReactNode) => {
    const isCurrentlyExporting = exportState.isExporting && exportState.exportingFormat === format;

    return (
      <>
        {isCurrentlyExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          icon
        )}
        {isCurrentlyExporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
      </>
    );
  };

  const hasFilters = filters.dateRange ||
                    (filters.status && filters.status.length > 0) ||
                    (filters.activityType && filters.activityType.length > 0);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <h3 className="text-base font-semibold">Export Report</h3>
          </div>
          {reportType && (
            <Badge variant="outline" className="text-xs">
              {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
            </Badge>
          )}
        </div>

        {!reportType && (
          <div className="p-3 border-2 border-dashed border-gray-200 rounded-md text-center">
            <p className="text-sm text-muted-foreground">
              Select a report type above to enable export options
            </p>
          </div>
        )}

        {reportType && (
          <>
            <div className="space-y-3">
              {/* CSV Export */}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleExport(EXPORT_FORMATS.CSV)}
                disabled={disabled || exportState.isExporting}
              >
                {getExportButtonContent(EXPORT_FORMATS.CSV, <File className="mr-2 h-4 w-4" />)}
              </Button>

              {/* PDF Export */}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleExport(EXPORT_FORMATS.PDF)}
                disabled={disabled || exportState.isExporting}
              >
                {getExportButtonContent(EXPORT_FORMATS.PDF, <FileText className="mr-2 h-4 w-4" />)}
              </Button>
            </div>

            <Separator />

            {/* Export Information */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>CSV Format:</span>
                <span>Spreadsheet-ready data</span>
              </div>
              <div className="flex justify-between">
                <span>PDF Format:</span>
                <span>Professional report layout</span>
              </div>
            </div>

            {/* Filter Summary */}
            {hasFilters && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs font-medium text-blue-900 mb-1">
                  Current filters will be applied to export:
                </p>
                <div className="space-y-1 text-xs text-blue-800">
                  {filters.dateRange && (
                    <div>• Date range: {filters.dateRange.startDate.toLocaleDateString()} - {filters.dateRange.endDate.toLocaleDateString()}</div>
                  )}
                  {filters.status && filters.status.length > 0 && (
                    <div>• Status filter: {filters.status.length} selected</div>
                  )}
                  {filters.activityType && filters.activityType.length > 0 && (
                    <div>• Activity types: {filters.activityType.length} selected</div>
                  )}
                </div>
              </div>
            )}

            {!hasFilters && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs text-amber-800">
                  No filters applied - full dataset will be exported
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
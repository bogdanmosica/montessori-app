import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSearch, Filter, Calendar, RefreshCw } from 'lucide-react';

interface ReportEmptyStateProps {
  reportType?: string;
  onClearFilters?: () => void;
  onRefresh?: () => void;
  hasFilters?: boolean;
  className?: string;
}

export function ReportEmptyState({
  reportType,
  onClearFilters,
  onRefresh,
  hasFilters = false,
  className
}: ReportEmptyStateProps) {
  const getEmptyStateContent = () => {
    if (hasFilters) {
      return {
        icon: <Filter className="h-12 w-12 text-muted-foreground" />,
        title: 'No results found',
        description: `No ${reportType || 'records'} match your current filter criteria. Try adjusting your filters or clearing them to see more results.`,
        suggestions: [
          'Expand the date range to include more data',
          'Remove status filters to see all records',
          'Check if the selected criteria are too restrictive'
        ]
      };
    }

    return {
      icon: <FileSearch className="h-12 w-12 text-muted-foreground" />,
      title: 'No data available',
      description: `There are no ${reportType || 'records'} available in your school's database yet. This report will populate as data is added to your system.`,
      suggestions: [
        'Check back later as new data becomes available',
        'Ensure your school has been actively using the system',
        'Contact support if you believe data should be present'
      ]
    };
  };

  const content = getEmptyStateContent();

  return (
    <Card className={`p-8 ${className}`}>
      <div className="text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          {content.icon}
        </div>

        {/* Title and Description */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{content.title}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {content.description}
          </p>
        </div>

        {/* Suggestions */}
        <div className="max-w-sm mx-auto">
          <div className="text-left space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Suggestions:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {content.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-primary">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-3">
          {hasFilters && onClearFilters && (
            <Button variant="outline" onClick={onClearFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}

          {onRefresh && (
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>

        {/* Additional Help */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Try different date ranges</span>
            </div>
            <div className="flex items-center space-x-1">
              <Filter className="h-3 w-3" />
              <span>Adjust filter settings</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
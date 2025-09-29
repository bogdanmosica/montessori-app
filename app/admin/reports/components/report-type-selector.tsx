'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, CreditCard, Activity } from 'lucide-react';
import { REPORT_TYPES } from '@/lib/constants/report-constants';

interface ReportTypeOption {
  type: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const REPORT_OPTIONS: ReportTypeOption[] = [
  {
    type: REPORT_TYPES.APPLICATIONS,
    title: 'Applications Report',
    description: 'View and analyze all student applications with parent information and status tracking.',
    icon: FileText,
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    type: REPORT_TYPES.ENROLLMENTS,
    title: 'Enrollments Report',
    description: 'Track active enrollments, program types, and monthly fee information.',
    icon: Users,
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  {
    type: REPORT_TYPES.PAYMENTS,
    title: 'Payments Report',
    description: 'Monitor payment transactions, including failed charges and refunds.',
    icon: CreditCard,
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    type: REPORT_TYPES.ACTIVITY,
    title: 'Activity Report',
    description: 'Review user activity logs and system access patterns for audit purposes.',
    icon: Activity,
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  }
];

interface ReportTypeSelectorProps {
  selectedType?: string;
  onTypeSelect: (type: string) => void;
  className?: string;
}

export function ReportTypeSelector({
  selectedType,
  onTypeSelect,
  className
}: ReportTypeSelectorProps) {
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  return (
    <div className={className}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Select Report Type</h3>
        <p className="text-sm text-muted-foreground">
          Choose the type of report you want to generate. Each report provides different insights into your school's data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.type;
          const isHovered = hoveredType === option.type;

          return (
            <Card
              key={option.type}
              className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? 'ring-2 ring-primary bg-primary/5'
                  : 'hover:bg-gray-50'
              }`}
              onMouseEnter={() => setHoveredType(option.type)}
              onMouseLeave={() => setHoveredType(null)}
              onClick={() => onTypeSelect(option.type)}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${option.color}`}>
                  <Icon className="h-6 w-6" />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{option.title}</h4>
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {option.description}
                  </p>

                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="mt-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTypeSelect(option.type);
                    }}
                  >
                    {isSelected ? 'Selected' : 'Select Report'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedType && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            <p className="text-sm font-medium text-blue-900">
              {REPORT_OPTIONS.find(opt => opt.type === selectedType)?.title} selected
            </p>
          </div>
          <p className="text-sm text-blue-800 mt-1">
            Configure your filters below to customize the report data.
          </p>
        </div>
      )}
    </div>
  );
}
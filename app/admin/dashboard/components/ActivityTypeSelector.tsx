'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  TREND_ACTIVITY_TYPES,
  TREND_ACTIVITY_LABELS,
  TREND_ACTIVITY_COLORS,
  type TrendActivityType,
} from '@/lib/constants/activity-types';

interface ActivityTypeSelectorProps {
  selectedTypes: TrendActivityType[];
  onChange: (types: TrendActivityType[]) => void;
}

export function ActivityTypeSelector({
  selectedTypes,
  onChange,
}: ActivityTypeSelectorProps) {
  const handleToggle = (type: TrendActivityType) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];

    // Ensure at least one type is selected
    if (newTypes.length > 0) {
      onChange(newTypes);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-gray-700">Activity Types</h3>
      <div className="flex flex-col gap-2">
        {TREND_ACTIVITY_TYPES.map((type) => (
          <div key={type} className="flex items-center gap-2">
            <Checkbox
              id={`activity-${type}`}
              checked={selectedTypes.includes(type)}
              onCheckedChange={() => handleToggle(type)}
            />
            <Label
              htmlFor={`activity-${type}`}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: TREND_ACTIVITY_COLORS[type] }}
              />
              <span className="text-sm">{TREND_ACTIVITY_LABELS[type]}</span>
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

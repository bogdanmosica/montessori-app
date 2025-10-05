'use client';

/**
 * Import Form Component
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EntityType } from '@/lib/constants/import-constants';
import { ImportValidationResult } from '@/lib/types/import-types';
import { Download, Upload } from 'lucide-react';
import ValidationSummary from './ValidationSummary';
import ReviewConfirm from './ReviewConfirm';

interface ImportFormProps {
  entityType: EntityType;
}

export default function ImportForm({ entityType }: ImportFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`/admin/import/api/template?type=${entityType}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityType}_import_template.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download template');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidationResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);

      const response = await fetch('/admin/import/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setValidationResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Import {entityType}s</CardTitle>
          <CardDescription>
            Download the template, fill it with data, and upload to import records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleDownloadTemplate} variant="outline" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>

          <div className="space-y-2">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload and Validate'}
            </Button>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {validationResult && (
        <>
          <ValidationSummary result={validationResult} />
          {validationResult.validCount > 0 && (
            <ReviewConfirm
              entityType={entityType}
              validRows={validationResult.validRows}
              onSuccess={() => {
                setFile(null);
                setValidationResult(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

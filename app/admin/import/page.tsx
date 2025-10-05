/**
 * Admin Import Page
 */

import ImportTabs from './components/ImportTabs';
import AdminNavigation from '@/components/admin/admin-navigation';

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-gray-50/30">
      <AdminNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Import Data</h1>
          <p className="mt-2 text-gray-600">
            Import teachers, parents, and children from Excel files
          </p>
        </div>

        <ImportTabs />
      </div>
    </div>
  );
}

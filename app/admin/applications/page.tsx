import { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getApplicationsForPage, validateApplicationsAccess } from './server/applications';
import { ApplicationsPageClient } from './components/ApplicationsPageClient';
import { ApplicationsPageSkeleton } from './components/ApplicationsPageSkeleton';

export const metadata: Metadata = {
  title: 'Applications | Admin Dashboard',
  description: 'Manage and process school applications from prospective families',
};

interface ApplicationsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
  // Await the searchParams promise in Next.js 15+
  const resolvedSearchParams = await searchParams;
  // Validate user access to applications
  const accessValidation = await validateApplicationsAccess();

  if (!accessValidation.valid) {
    // Redirect to appropriate page based on error
    if (accessValidation.error?.includes('Authentication')) {
      redirect('/login');
    } else if (accessValidation.error?.includes('permissions')) {
      redirect('/unauthorized');
    } else {
      redirect('/admin/dashboard');
    }
  }

  // Convert searchParams to URLSearchParams
  const urlSearchParams = new URLSearchParams();
  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (typeof value === 'string') {
      urlSearchParams.set(key, value);
    } else if (Array.isArray(value)) {
      urlSearchParams.set(key, value[0] || '');
    }
  });

  // Get applications data server-side
  const applicationsResult = await getApplicationsForPage(urlSearchParams);

  if (!applicationsResult.success || !applicationsResult.data) {
    // Handle error state
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Unable to Load Applications</h2>
            <p className="text-gray-600">
              {applicationsResult.error || 'An unexpected error occurred while loading applications.'}
            </p>
            <p className="text-sm text-gray-500">
              Please refresh the page or contact your system administrator if the problem persists.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">School Applications</h1>
        <p className="text-gray-600">
          Review and process applications from prospective families. Approve applications to create
          parent accounts and enroll children in your school programs.
        </p>
      </div>

      {/* Applications Stats Summary */}
      <Suspense fallback={<ApplicationsStatsSkeleton />}>
        <ApplicationsStats />
      </Suspense>

      {/* Main Applications Table and Actions */}
      <Suspense fallback={<ApplicationsPageSkeleton />}>
        <ApplicationsPageClient
          initialData={applicationsResult.data}
          initialSearchParams={urlSearchParams}
        />
      </Suspense>
    </div>
  );
}

// Stats component that shows application summary
async function ApplicationsStats() {
  const { getApplicationsStatsForDashboard } = await import('./server/applications');
  const statsResult = await getApplicationsStatsForDashboard();

  if (!statsResult.success || !statsResult.data) {
    return null; // Fail silently for stats
  }

  const { pending, approved, rejected, total } = statsResult.data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">Total Applications</div>
            <div className="text-2xl font-bold text-gray-900">{total}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">Pending Review</div>
            <div className="text-2xl font-bold text-yellow-600">{pending}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">Approved</div>
            <div className="text-2xl font-bold text-green-600">{approved}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">Rejected</div>
            <div className="text-2xl font-bold text-red-600">{rejected}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for stats
function ApplicationsStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="ml-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-12"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
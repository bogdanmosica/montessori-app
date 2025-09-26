import { PlaceholderPageProps } from '@/lib/types/navigation';

export default function PlaceholderPage({ pageName, expectedDate }: PlaceholderPageProps) {
  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto px-4 py-8">
        <div className="placeholder-page">
          <div className="placeholder-content text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {pageName} - Coming Soon
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              This feature is currently under development.
            </p>
            {expectedDate && (
              <p className="text-sm text-gray-500">
                Expected completion: {expectedDate}
              </p>
            )}
            <div className="mt-8">
              <p className="text-gray-500">
                We're working hard to bring you this feature. Please check back soon!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
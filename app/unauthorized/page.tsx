import { AlertTriangle, Home, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">
            Access Denied
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            You don't have permission to access this page. This area is restricted to administrators only.
          </p>

          <p className="text-sm text-gray-500">
            If you believe you should have access, please contact your system administrator.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              asChild
              variant="outline"
              className="flex items-center gap-2"
            >
              <Link href="/dashboard">
                <Home className="h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>

            <Button
              asChild
              variant="default"
              className="flex items-center gap-2"
            >
              <Link href="/sign-out">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
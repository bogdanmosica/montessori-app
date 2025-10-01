import React from 'react';
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { requireAdminPermissions } from '@/lib/auth/dashboard-context';
import { SettingsService } from '@/lib/services/settings-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminNavigation from '@/components/admin/admin-navigation';
import { SettingsForm } from './components/settings-form';
import { SettingsDisplay } from './components/settings-display';

/**
 * Settings Page - Server Component
 * Displays and manages school settings for admin users
 */
export default async function SettingsPage() {
  // Authenticate user
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Verify admin permissions
  try {
    requireAdminPermissions(session.user.role);
  } catch {
    redirect('/unauthorized');
  }

  // Get school ID from user session
  const schoolIdRaw = session.user.schoolId;
  if (!schoolIdRaw) {
    return (
      <div className="min-h-screen bg-gray-50/30">
        <AdminNavigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Settings Unavailable</CardTitle>
              <CardDescription>
                School affiliation required to manage settings.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const schoolId = typeof schoolIdRaw === 'string' ? parseInt(schoolIdRaw) : schoolIdRaw;

  // Fetch current settings
  let settings;
  try {
    settings = await SettingsService.getSettings(schoolId);
  } catch (error) {
    console.error('Error loading settings:', error);
    return (
      <div className="min-h-screen bg-gray-50/30">
        <AdminNavigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Error Loading Settings</CardTitle>
              <CardDescription>
                Unable to load school settings. Please try again later.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // Default values if settings not found
  const defaultMonthlyFee = settings ? parseFloat(settings.defaultMonthlyFeeRon) : 0;
  const freeEnrollmentCount = settings ? settings.freeEnrollmentCount : 0;
  const maximumCapacity = settings ? settings.maximumCapacity : 100;
  const ageGroupCapacities = settings?.ageGroupCapacities || [];
  const lastUpdated = settings?.settingsUpdatedAt;

  // Extract individual age group capacities with defaults
  const toddlerCapacity = ageGroupCapacities.find(c => c.ageGroup.includes('Toddler'))?.capacity || 40;
  const primaryCapacity = ageGroupCapacities.find(c => c.ageGroup.includes('Primary'))?.capacity || 120;
  const elementaryCapacity = ageGroupCapacities.find(c => c.ageGroup.includes('Elementary'))?.capacity || 40;

  return (
    <div className="min-h-screen bg-gray-50/30">
      <AdminNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">School Settings</h1>
            <p className="text-muted-foreground mt-2">
              Configure default values and limits for your school
            </p>
          </div>

          {/* Current Settings Display */}
          <SettingsDisplay
            defaultMonthlyFee={defaultMonthlyFee}
            freeEnrollmentCount={freeEnrollmentCount}
            maximumCapacity={maximumCapacity}
            lastUpdated={lastUpdated || null}
          />

          {/* Settings Update Form */}
          <Card>
            <CardHeader>
              <CardTitle>Update Settings</CardTitle>
              <CardDescription>
                Modify school-wide default values and enrollment limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsForm
                schoolId={schoolId}
                initialDefaultFee={defaultMonthlyFee}
                initialEnrollmentCount={freeEnrollmentCount}
                initialMaximumCapacity={maximumCapacity}
                initialToddlerCapacity={toddlerCapacity}
                initialPrimaryCapacity={primaryCapacity}
                initialElementaryCapacity={elementaryCapacity}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
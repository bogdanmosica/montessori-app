import { Button } from '@/components/ui/button';
import { ArrowRight, Users, ClipboardCheck, TrendingUp, Database } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Monte SMS
                <span className="block text-primary">Montessori School Management</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Streamline your Montessori school operations with our comprehensive management system.
                Track student progress, manage attendance, and handle enrollments all in one place.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0 flex gap-4">
                <Link href="/sign-in">
                  <Button
                    size="lg"
                    className="text-lg rounded-full"
                  >
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg rounded-full"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                  <div className="p-8 space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Student Management</h3>
                        <p className="text-sm text-gray-500">Track progress and observations</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <ClipboardCheck className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Attendance Tracking</h3>
                        <p className="text-sm text-gray-500">Daily attendance records</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Progress Reports</h3>
                        <p className="text-sm text-gray-500">Comprehensive analytics</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Built for Montessori Educators</h2>
            <p className="mt-4 text-lg text-gray-500">
              Everything you need to manage your Montessori school efficiently
            </p>
          </div>
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                <Users className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Student Profiles & Observations
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Track individual student progress, record observations, and monitor developmental milestones in the Montessori way.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Attendance & Enrollment
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Manage daily attendance, track enrollment applications, and handle student admissions seamlessly.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Reports & Analytics
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Generate comprehensive reports on enrollments, attendance, payments, and teacher activity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Ready to streamline your Montessori school?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Join educators who are already using Monte SMS to manage their schools more efficiently.
                Focus on what matters most - guiding your students' development.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end gap-4">
              <Link href="/sign-in">
                <Button
                  size="lg"
                  className="text-lg rounded-full"
                >
                  Sign In Now
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

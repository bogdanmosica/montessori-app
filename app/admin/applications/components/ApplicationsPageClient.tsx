'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { ApplicationsTable } from './ApplicationsTable';
import { AddParentForm } from './AddParentForm';
import { AddChildForm } from './AddChildForm';
import { ApplicationDetailModal } from './ApplicationDetailModal';
import { RejectionModal } from './RejectionModal';

import {
  ApplicationWithRelations,
  ApplicationListResponse,
  ApplicationsSearchFilters,
  ApprovalFormData,
  RejectionFormData,
} from '../../../../lib/types/applications';

interface ApplicationsPageClientProps {
  initialData: ApplicationListResponse;
  initialSearchParams: URLSearchParams;
}

export function ApplicationsPageClient({
  initialData,
  initialSearchParams
}: ApplicationsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [applications, setApplications] = useState(initialData.applications);
  const [pagination, setPagination] = useState(initialData.pagination);
  const [filters, setFilters] = useState(initialData.filters);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithRelations | null>(null);
  const [showParentForm, setShowParentForm] = useState(false);
  const [showChildForm, setShowChildForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [processingApplication, setProcessingApplication] = useState(false);

  // Form data for multi-step approval
  const [approvalFormData, setApprovalFormData] = useState<Partial<ApprovalFormData>>({});

  // Update URL and fetch new data
  const updateFiltersAndFetch = useCallback(async (newFilters: ApplicationsSearchFilters, page?: number) => {
    setLoading(true);

    try {
      // Build new URL
      const url = new URL(window.location.href);
      const params = new URLSearchParams();

      // Add filters to URL
      if (newFilters.status) params.set('status', newFilters.status);
      if (newFilters.search) params.set('search', newFilters.search);
      if (newFilters.programRequested) params.set('programRequested', newFilters.programRequested);
      if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy);
      if (newFilters.sortOrder) params.set('sortOrder', newFilters.sortOrder);

      params.set('page', (page || 1).toString());
      params.set('limit', '10');

      url.search = params.toString();

      // Update URL without page reload
      router.push(url.pathname + url.search);

      // Fetch new data
      const response = await fetch(`/api/applications?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setApplications(result.data.applications);
        setPagination(result.data.pagination);
        setFilters(result.data.filters);
      } else {
        toast.error('Failed to load applications');
        console.error('Error fetching applications:', result.error);
      }
    } catch (error) {
      toast.error('Failed to load applications');
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: ApplicationsSearchFilters) => {
    updateFiltersAndFetch(newFilters, 1); // Reset to page 1 when filtering
  }, [updateFiltersAndFetch]);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    updateFiltersAndFetch(filters, page);
  }, [filters, updateFiltersAndFetch]);

  // Handle application actions
  const handleApplicationAction = useCallback(async (applicationId: string, action: 'approve' | 'reject' | 'view') => {
    const application = applications.find(app => app.id === applicationId);
    if (!application) return;

    setSelectedApplication(application);

    switch (action) {
      case 'view':
        setShowDetailModal(true);
        break;
      case 'approve':
        // Start multi-step approval process
        setApprovalFormData({});
        setShowParentForm(true);
        break;
      case 'reject':
        // Show rejection modal
        setShowRejectionModal(true);
        break;
    }
  }, [applications]);

  // Handle parent form completion (step 1 of approval)
  const handleParentFormSubmit = useCallback((parentData: ApprovalFormData['parentData']) => {
    setApprovalFormData(prev => ({ ...prev, parentData }));
    setShowParentForm(false);
    setShowChildForm(true);
  }, []);

  // Handle child form completion (step 2 of approval - final step)
  const handleChildFormSubmit = useCallback(async (childData: ApprovalFormData['childData']) => {
    if (!selectedApplication || !approvalFormData.parentData) {
      toast.error('Missing approval data');
      return;
    }

    setProcessingApplication(true);

    try {
      const approvalRequest: ApprovalFormData = {
        parentData: approvalFormData.parentData,
        childData,
        enrollmentData: {
          status: 'active',
          startDate: childData.startDate,
          programId: childData.programId,
        },
        notes: `Application approved on ${new Date().toISOString()}`,
      };

      const response = await fetch('/api/admin/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: selectedApplication.id,
          action: 'approve',
          ...approvalRequest,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Application approved successfully! Parent account and child record created.');

        // Refresh the applications list
        await updateFiltersAndFetch(filters, pagination.currentPage);

        // Reset form state
        setApprovalFormData({});
        setSelectedApplication(null);
        setShowChildForm(false);
      } else {
        toast.error(result.message || 'Failed to approve application');
        console.error('Approval error:', result.error);
      }
    } catch (error) {
      toast.error('Failed to approve application');
      console.error('Approval error:', error);
    } finally {
      setProcessingApplication(false);
    }
  }, [selectedApplication, approvalFormData, filters, pagination.currentPage, updateFiltersAndFetch]);

  // Handle application rejection
  const handleRejectApplication = useCallback(async (data: RejectionFormData) => {
    if (!selectedApplication) {
      toast.error('No application selected for rejection');
      return;
    }

    setProcessingApplication(true);

    try {
      const response = await fetch('/api/admin/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: selectedApplication.id,
          action: 'reject',
          rejectionReason: data.rejectionReason,
          notifyParent: data.notifyParent,
          notes: data.notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Application rejected successfully.');

        // Refresh the applications list
        await updateFiltersAndFetch(filters, pagination.currentPage);

        // Reset states
        setSelectedApplication(null);
        setShowRejectionModal(false);
      } else {
        toast.error(result.message || 'Failed to reject application');
        console.error('Rejection error:', result.error);
      }
    } catch (error) {
      toast.error('Failed to reject application');
      console.error('Rejection error:', error);
    } finally {
      setProcessingApplication(false);
    }
  }, [selectedApplication, filters, pagination.currentPage, updateFiltersAndFetch]);

  // Handle modal closes
  const handleCloseModals = useCallback(() => {
    setSelectedApplication(null);
    setShowParentForm(false);
    setShowChildForm(false);
    setShowDetailModal(false);
    setShowRejectionModal(false);
    setApprovalFormData({});
  }, []);

  return (
    <>
      {/* Applications Table */}
      <ApplicationsTable
        applications={applications}
        pagination={pagination}
        filters={filters}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onApplicationAction={handleApplicationAction}
        loading={loading}
      />

      {/* Parent Form Modal (Step 1 of Approval) */}
      {selectedApplication && (
        <AddParentForm
          application={selectedApplication}
          isOpen={showParentForm}
          onClose={handleCloseModals}
          onSubmit={handleParentFormSubmit}
          isLoading={processingApplication}
        />
      )}

      {/* Child Form Modal (Step 2 of Approval) */}
      {selectedApplication && (
        <AddChildForm
          application={selectedApplication}
          isOpen={showChildForm}
          onClose={handleCloseModals}
          onSubmit={handleChildFormSubmit}
          isLoading={processingApplication}
        />
      )}

      {/* Application Detail Modal */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          isOpen={showDetailModal}
          onClose={handleCloseModals}
          onAction={handleApplicationAction}
        />
      )}

      {/* Rejection Modal */}
      {selectedApplication && (
        <RejectionModal
          application={selectedApplication}
          isOpen={showRejectionModal}
          onClose={handleCloseModals}
          onSubmit={handleRejectApplication}
          isLoading={processingApplication}
        />
      )}
    </>
  );
}
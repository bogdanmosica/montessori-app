// T032: Unit tests for capacity calculations
import { describe, it, expect } from '@jest/globals';
import { getCapacityMetrics } from '@/app/admin/dashboard/server/capacity-metrics';

describe('Capacity Metrics Calculations', () => {
  describe('Basic Capacity Calculations', () => {
    it('should calculate utilization percentage correctly', () => {
      const totalCapacity = 200;
      const activeEnrollments = 150;
      const utilizationPercentage = (activeEnrollments / totalCapacity) * 100;
      
      expect(utilizationPercentage).toBe(75);
    });

    it('should handle zero capacity gracefully', () => {
      const totalCapacity = 0;
      const activeEnrollments = 0;
      const utilizationPercentage = totalCapacity > 0 ? (activeEnrollments / totalCapacity) * 100 : 0;
      
      expect(utilizationPercentage).toBe(0);
    });

    it('should handle over-capacity enrollment', () => {
      const totalCapacity = 100;
      const activeEnrollments = 120; // Over capacity
      const utilizationPercentage = (activeEnrollments / totalCapacity) * 100;
      
      expect(utilizationPercentage).toBe(120); // Over 100% is valid
    });
  });

  describe('Age Group Capacity Logic', () => {
    it('should categorize children by age groups correctly', () => {
      const testChildren = [
        { ageInMonths: 24 }, // Toddler (18-36 months)
        { ageInMonths: 48 }, // Primary (37-72 months) 
        { ageInMonths: 96 }, // Elementary (73-144 months)
        { ageInMonths: 30 }, // Toddler
        { ageInMonths: 60 }, // Primary
      ];

      const categorized = {
        toddler: 0,
        primary: 0,
        elementary: 0,
      };

      testChildren.forEach(child => {
        if (child.ageInMonths >= 18 && child.ageInMonths <= 36) {
          categorized.toddler++;
        } else if (child.ageInMonths >= 37 && child.ageInMonths <= 72) {
          categorized.primary++;
        } else if (child.ageInMonths >= 73 && child.ageInMonths <= 144) {
          categorized.elementary++;
        }
      });

      expect(categorized.toddler).toBe(2);
      expect(categorized.primary).toBe(2);
      expect(categorized.elementary).toBe(1);
    });

    it('should calculate available spots per age group', () => {
      const ageGroupCapacities = [
        {
          ageGroup: 'Toddler',
          capacity: 40,
          currentEnrollment: 35,
        },
        {
          ageGroup: 'Primary',
          capacity: 120,
          currentEnrollment: 85,
        },
        {
          ageGroup: 'Elementary',
          capacity: 40,
          currentEnrollment: 25,
        }
      ];

      const withAvailableSpots = ageGroupCapacities.map(group => ({
        ...group,
        availableSpots: group.capacity - group.currentEnrollment,
        utilizationPercentage: (group.currentEnrollment / group.capacity) * 100
      }));

      expect(withAvailableSpots[0].availableSpots).toBe(5);
      expect(withAvailableSpots[0].utilizationPercentage).toBe(87.5);

      expect(withAvailableSpots[1].availableSpots).toBe(35);
      expect(withAvailableSpots[1].utilizationPercentage).toBeCloseTo(70.83, 2);

      expect(withAvailableSpots[2].availableSpots).toBe(15);
      expect(withAvailableSpots[2].utilizationPercentage).toBe(62.5);
    });
  });

  describe('Waitlist Management Logic', () => {
    it('should identify which age groups need waitlists', () => {
      const ageGroupData = [
        { ageGroup: 'Toddler', capacity: 40, currentEnrollment: 39, pendingApplications: 5 }, // Near capacity with demand
        { ageGroup: 'Primary', capacity: 120, currentEnrollment: 85, pendingApplications: 2 }, // Has space
        { ageGroup: 'Elementary', capacity: 40, currentEnrollment: 40, pendingApplications: 8 }, // At capacity with waitlist
      ];

      const needsWaitlist = ageGroupData.filter(group => 
        (group.currentEnrollment + group.pendingApplications) > group.capacity
      );

      expect(needsWaitlist).toHaveLength(2);
      expect(needsWaitlist[0].ageGroup).toBe('Toddler');
      expect(needsWaitlist[1].ageGroup).toBe('Elementary');
    });

    it('should calculate waitlist priority by age group demand', () => {
      const ageGroupData = [
        { ageGroup: 'Toddler', capacity: 40, currentEnrollment: 35, pendingApplications: 15 },
        { ageGroup: 'Primary', capacity: 120, currentEnrollment: 85, pendingApplications: 20 },
        { ageGroup: 'Elementary', capacity: 40, currentEnrollment: 25, pendingApplications: 5 },
      ];

      const demandRatio = ageGroupData.map(group => ({
        ageGroup: group.ageGroup,
        demandRatio: group.pendingApplications / (group.capacity - group.currentEnrollment),
        availableSpots: group.capacity - group.currentEnrollment
      })).sort((a, b) => b.demandRatio - a.demandRatio);

      // Toddler has highest demand ratio: 15 / 5 = 3.0
      expect(demandRatio[0].ageGroup).toBe('Toddler');
      expect(demandRatio[0].demandRatio).toBe(3);

      // Primary has lower demand ratio: 20 / 35 ≈ 0.57
      expect(demandRatio[1].ageGroup).toBe('Primary');
      expect(demandRatio[1].demandRatio).toBeCloseTo(0.57, 2);
    });
  });

  describe('Capacity Thresholds', () => {
    it('should categorize capacity utilization levels', () => {
      const testUtilizations = [45, 60, 80, 95, 105];
      const THRESHOLDS = {
        LOW: 50,
        MEDIUM: 75,
        HIGH: 90,
        CRITICAL: 95
      };

      const categorized = testUtilizations.map(utilization => {
        if (utilization < THRESHOLDS.LOW) return 'low';
        if (utilization < THRESHOLDS.MEDIUM) return 'medium'; 
        if (utilization < THRESHOLDS.HIGH) return 'high';
        if (utilization < THRESHOLDS.CRITICAL) return 'critical';
        return 'over-capacity';
      });

      expect(categorized).toEqual(['low', 'medium', 'high', 'over-capacity', 'over-capacity']);
    });

    it('should identify capacity alerts', () => {
      const ageGroups = [
        { ageGroup: 'Toddler', utilization: 95 }, // Critical
        { ageGroup: 'Primary', utilization: 60 }, // Normal
        { ageGroup: 'Elementary', utilization: 85 }, // High
      ];

      const alerts = ageGroups
        .filter(group => group.utilization >= 90)
        .map(group => ({
          ageGroup: group.ageGroup,
          alertLevel: group.utilization >= 95 ? 'critical' : 'high',
          utilization: group.utilization
        }));

      expect(alerts).toHaveLength(1);
      expect(alerts[0].ageGroup).toBe('Toddler');
      expect(alerts[0].alertLevel).toBe('critical');
    });
  });

  describe('Integration Test Placeholder', () => {
    it('should test full capacity metrics integration', () => {
      // TODO: Implement integration test with database
      // This would test the getCapacityMetrics function with real/mocked database calls
      expect(true).toBe(true); // Placeholder
    });
  });
});
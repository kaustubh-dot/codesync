import {
  getTotalNumberOfStreaks,
  formatProblemsPerDay,
  getLocalDateKey,
} from '../utils/streak.helper';

describe('Streak Helper Functions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const mockDate = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getTotalNumberOfStreaks', () => {
    it('should return 0 when no streak exists', () => {
      expect(getTotalNumberOfStreaks({})).toBe(0);
    });
    it('should return 1 when only today has submissions', () => {
      expect(getTotalNumberOfStreaks({ '2024-01-15': 1 })).toBe(1);
    });
    it('should calculate correct streak for consecutive days', () => {
      expect(getTotalNumberOfStreaks({ '2024-01-15': 1, '2024-01-14': 1, '2024-01-13': 1 })).toBe(
        3,
      );
    });
    it('should break streak when there is a gap', () => {
      expect(getTotalNumberOfStreaks({ '2024-01-15': 1, '2024-01-13': 1 })).toBe(1);
    });
    it('should handle streak with zero submissions', () => {
      expect(getTotalNumberOfStreaks({ '2024-01-15': 1, '2024-01-14': 0, '2024-01-13': 1 })).toBe(
        1,
      );
    });
    it('should handle unordered input', () => {
      expect(getTotalNumberOfStreaks({ '2024-01-13': 1, '2024-01-15': 1, '2024-01-14': 1 })).toBe(
        3,
      );
    });
    it('should handle single day streaks in the past', () => {
      expect(getTotalNumberOfStreaks({ '2024-01-10': 1 })).toBe(1);
    });
    it('should handle streaks with zeros at the start', () => {
      expect(
        getTotalNumberOfStreaks({
          '2024-01-15': 1,
          '2024-01-14': 1,
          '2024-01-13': 0,
          '2024-01-12': 1,
        }),
      ).toBe(2);
    });
    it('should handle all zero streaks', () => {
      expect(getTotalNumberOfStreaks({ '2024-01-15': 0, '2024-01-14': 0 })).toBe(0);
    });
    it('should handle non-consecutive streaks', () => {
      expect(getTotalNumberOfStreaks({ '2024-01-15': 1, '2024-01-12': 1, '2024-01-10': 1 })).toBe(
        1,
      );
    });
  });

  describe('formatProblemsPerDay', () => {
    it('groups submissions by the local calendar day used by the streak UI', () => {
      const timestamp = new Date(2024, 0, 15, 23, 30).getTime();

      expect(formatProblemsPerDay([{ timestamp }])).toEqual({
        [getLocalDateKey(new Date(timestamp))]: 1,
      });
    });

    it('should format problems correctly for a single day', () => {
      const problems = [
        { timestamp: new Date('2024-01-15T10:00:00Z').getTime() },
        { timestamp: new Date('2024-01-15T14:00:00Z').getTime() },
      ];
      const result = formatProblemsPerDay(problems);
      expect(result['2024-01-15']).toBe(2);
    });
    it('should handle multiple days correctly', () => {
      const problems = [
        { timestamp: new Date('2024-01-15T10:00:00Z').getTime() },
        { timestamp: new Date('2024-01-15T14:00:00Z').getTime() },
        { timestamp: new Date('2024-01-14T10:00:00Z').getTime() },
      ];
      const result = formatProblemsPerDay(problems);
      expect(result['2024-01-15']).toBe(2);
      expect(result['2024-01-14']).toBe(1);
    });
    it('should handle empty array', () => {
      expect(formatProblemsPerDay([])).toEqual({});
    });
    it('should handle problems with same timestamp', () => {
      const timestamp = new Date('2024-01-15T10:00:00Z').getTime();
      const problems = [{ timestamp }, { timestamp }];
      const result = formatProblemsPerDay(problems);
      expect(result['2024-01-15']).toBe(2);
    });
    it('should ignore negative timestamps', () => {
      const problems = [{ timestamp: -1 }];
      const result = formatProblemsPerDay(problems);
      expect(result[getLocalDateKey(new Date(-1))]).toBe(1);
    });
    it('should handle far future dates', () => {
      const timestamp = new Date('2099-12-31T23:59:59Z').getTime();
      const problems = [{ timestamp }];
      const result = formatProblemsPerDay(problems);
      expect(result[getLocalDateKey(new Date(timestamp))]).toBe(1);
    });
    it('should handle non-integer timestamps', () => {
      const problems = [{ timestamp: 1705291200000.9 }];
      const result = formatProblemsPerDay(problems);
      expect(result['2024-01-15']).toBe(1);
    });
  });
});

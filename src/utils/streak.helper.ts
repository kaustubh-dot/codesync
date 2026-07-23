export const getLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

export const getTotalNumberOfStreaks = (streak: { [date: string]: number }) => {
  const streakDates = Object.keys(streak)
    .filter((date) => streak[date] > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort()
    .reverse();

  if (streakDates.length === 0) return 0;

  const dayNumber = (key: string) => {
    const [year, month, day] = key.split('-').map(Number);
    return Date.UTC(year, month - 1, day) / 86_400_000;
  };
  if (dayNumber(getLocalDateKey(new Date())) - dayNumber(streakDates[0]) > 1) return 0;

  let streaks = 1;
  for (let i = 1; i < streakDates.length; i++) {
    if (dayNumber(streakDates[i - 1]) - dayNumber(streakDates[i]) === 1) {
      streaks++;
    } else {
      break;
    }
  }
  return streaks;
};

export const formatProblemsPerDay = (
  problemsSolved: { timestamp: number }[],
): { [date: string]: number } => {
  const problemsPerDay: { [date: string]: number } = {};
  problemsSolved.forEach((problem) => {
    const dateStr = getLocalDateKey(new Date(problem.timestamp));
    problemsPerDay[dateStr] = (problemsPerDay[dateStr] || 0) + 1;
  });
  return problemsPerDay;
};

export const getLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

export const getTotalNumberOfStreaks = (streak: { [date: string]: number }) => {
  const streakDates = Object.keys(streak)
    .filter((date) => streak[date] > 0)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (streakDates.length === 0) return 0;

  let streaks = 1;
  for (let i = 1; i < streakDates.length; i++) {
    const prev = new Date(streakDates[i - 1]);
    const curr = new Date(streakDates[i]);
    const diff = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
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

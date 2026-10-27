const dayFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});

export function formatDayLabel(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Data indisponível';

  // A data representa o calendário da cidade, não um instante no fuso do dispositivo.
  const calendarDate = new Date(`${date}T00:00:00Z`);
  if (
    !Number.isFinite(calendarDate.getTime()) ||
    calendarDate.toISOString().slice(0, 10) !== date
  ) {
    return 'Data indisponível';
  }

  return dayFormatter.format(calendarDate);
}

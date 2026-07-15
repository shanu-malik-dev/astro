const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 18;
const DAYS_AHEAD = 14;
const MIN_NOTICE_HOURS = 12;

export interface DaySlots {
  date: Date;
  label: string;
  times: Date[];
}

export function generateCandidateSlots(durationMinutes: number, locale: string): DaySlots[] {
  const now = new Date();
  const earliest = new Date(now.getTime() + MIN_NOTICE_HOURS * 60 * 60 * 1000);
  const stepMinutes = durationMinutes <= 30 ? 30 : 60;

  const days: DaySlots[] = [];

  for (let d = 0; d < DAYS_AHEAD; d++) {
    const day = new Date(now);
    day.setDate(day.getDate() + d);
    day.setHours(0, 0, 0, 0);

    const times: Date[] = [];
    for (let h = BUSINESS_START_HOUR; h < BUSINESS_END_HOUR; h += stepMinutes / 60) {
      const slot = new Date(day);
      const hour = Math.floor(h);
      const minute = Math.round((h - hour) * 60);
      slot.setHours(hour, minute, 0, 0);
      if (slot.getTime() >= earliest.getTime()) {
        times.push(slot);
      }
    }

    if (times.length > 0) {
      days.push({
        date: day,
        label: day.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' }),
        times,
      });
    }
  }

  return days;
}

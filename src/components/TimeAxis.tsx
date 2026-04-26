export default function TimeAxis({ startHour, totalSlots }: { startHour: number; totalSlots: number }) {
  const slots = Array.from({ length: totalSlots }, (_, i) => {
    const totalMinutes = startHour * 60 + i * 30;
    const hour = Math.floor(totalMinutes / 60) % 24;
    const minute = totalMinutes % 60;
    const minuteStr = String(minute).padStart(2, '0');
    return (
      <div
        key={`${hour}-${minute}`}
        className="time-slot"
        style={{ height: 'var(--spacing-cell-height)' }}
      >
        {hour}:{minuteStr}
      </div>
    );
  });

  return <div className="time-axis">{slots}</div>;
}

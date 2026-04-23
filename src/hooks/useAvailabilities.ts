import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface Slot {
  id: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  available: boolean;
}

export function useAvailabilities(serviceId: string | null) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!serviceId) { setSlots([]); return; }
    setLoading(true);
    api.get(`/api/student-services/${serviceId}/availabilities`)
      .then(res => {
        const raw = res.data;
        const list: Record<string, unknown>[] = Array.isArray(raw) ? raw : (raw?.availabilities ?? raw?.data ?? []);

        const weeklyBlocks = list.filter(item => item.day_of_week != null && item.start_time && item.end_time);
        if (weeklyBlocks.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const generated: Slot[] = [];

          for (let offset = 0; offset < 60; offset += 1) {
            const current = new Date(today);
            current.setDate(today.getDate() + offset);
            const weekday = current.getDay();
            const isoDate = current.toISOString().slice(0, 10);

            for (const block of weeklyBlocks) {
              if (Number(block.day_of_week) !== weekday) continue;

              const start = String(block.start_time ?? '00:00').slice(0, 5);
              const end = String(block.end_time ?? '00:00').slice(0, 5);
              const [startHour, startMinute] = start.split(':').map(Number);
              const [endHour, endMinute] = end.split(':').map(Number);
              let minutes = startHour * 60 + startMinute;
              const endMinutes = endHour * 60 + endMinute;

              while (minutes <= endMinutes - 30) {
                const hh = Math.floor(minutes / 60).toString().padStart(2, '0');
                const mm = (minutes % 60).toString().padStart(2, '0');
                generated.push({
                  id: `${String(block.id ?? 'slot')}-${isoDate}-${hh}:${mm}`,
                  date: isoDate,
                  time: `${hh}:${mm}`,
                  available: true,
                });
                minutes += 30;
              }
            }
          }

          setSlots(generated);
          return;
        }

        setSlots(list.map(a => {
          const dt = String(a.datetime ?? a.scheduledAt ?? a.start ?? '');
          let date = String(a.date ?? '');
          let time = String(a.time ?? '');
          if ((!date || !time) && dt) {
            const d = new Date(dt);
            date = d.toISOString().slice(0, 10);
            time = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
          }
          return { id: String(a.id ?? ''), date, time, available: a.available !== false };
        }));
      })
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [serviceId]);

  const byDate = (date: string) => slots.filter(s => s.date === date && s.available);

  return { slots, byDate, loading };
}

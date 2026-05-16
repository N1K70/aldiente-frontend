import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface Slot {
  id: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  available: boolean;
}

function normalizeSlot(item: Record<string, unknown>): Slot | null {
  const dt = String(item.datetime ?? item.scheduledAt ?? item.start ?? '').trim();
  let date = String(item.date ?? '').trim();
  let time = String(item.time ?? '').trim();

  if ((!date || !time) && dt.includes('T')) {
    const [d, t = ''] = dt.split('T');
    date = d;
    time = t.slice(0, 5);
  }

  if (time.length > 5) time = time.slice(0, 5);
  if (!date || !time) return null;

  return {
    id: String(item.id ?? `${date}-${time}`),
    date,
    time,
    available: item.available !== false,
  };
}

export function useAvailabilities(serviceId: string | null) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!serviceId) {
        setSlots([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const slotsResponse = await api.get(`/api/student-services/${serviceId}/slots`, {
          params: { days: 60 },
        });
        const rawSlots = Array.isArray(slotsResponse.data?.slots) ? slotsResponse.data.slots : null;
        if (rawSlots) {
          const normalized = rawSlots
            .map((item: Record<string, unknown>) => normalizeSlot(item))
            .filter((item: Slot | null): item is Slot => Boolean(item));
          if (!cancelled) {
            setSlots(normalized);
            setLoading(false);
          }
          return;
        }
      } catch {}

      try {
        const response = await api.get(`/api/student-services/${serviceId}/availabilities`);
        const raw = response.data;
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

          if (!cancelled) setSlots(generated);
          return;
        }

        const normalized = list
          .map(item => normalizeSlot(item))
          .filter((item: Slot | null): item is Slot => Boolean(item));
        if (!cancelled) setSlots(normalized);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  const byDate = (date: string) => slots.filter(s => s.date === date && s.available);

  return { slots, byDate, loading };
}

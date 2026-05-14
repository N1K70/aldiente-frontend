import { NextRequest, NextResponse } from 'next/server';
import { pushTelemetry, readTelemetry, clearTelemetry, type TelemetryEnvelope } from '@/lib/telemetry-store';

function isValidEnvelope(value: unknown): value is TelemetryEnvelope {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  const validKind = v.kind === 'funnel_event' || v.kind === 'frontend_error';
  const validTimestamp = typeof v.timestamp === 'string' && v.timestamp.length > 0;
  const validData = typeof v.data === 'object' && v.data !== null && !Array.isArray(v.data);
  return validKind && validTimestamp && validData;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isValidEnvelope(body)) {
      return NextResponse.json({ ok: false, error: 'Telemetry payload schema mismatch' }, { status: 400 });
    }

    pushTelemetry(body);
    console.info('[telemetry-ingest]', body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid telemetry payload' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, events: readTelemetry() });
}

export async function DELETE() {
  clearTelemetry();
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { pushTelemetry, readTelemetry, clearTelemetry } from '@/lib/telemetry-store';
import { isValidTelemetryEnvelope } from '@/lib/telemetry-contract';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isValidTelemetryEnvelope(body)) {
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

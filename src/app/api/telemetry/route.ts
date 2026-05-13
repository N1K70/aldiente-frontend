import { NextRequest, NextResponse } from 'next/server';
import { pushTelemetry, readTelemetry, type TelemetryEnvelope } from '@/lib/telemetry-store';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TelemetryEnvelope;
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

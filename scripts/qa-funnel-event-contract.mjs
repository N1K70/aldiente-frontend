import fs from 'node:fs';

const ALLOWED = new Set([
  'funnel_visit',
  'funnel_signup_completed',
  'funnel_service_viewed',
  'funnel_booking_started',
  'funnel_payment_started',
  'funnel_payment_completed',
  'market_research_viewed',
  'market_research_submitted',
]);

function readFixture() {
  const fixturePath = process.argv[2];
  if (!fixturePath) return null;
  const raw = fs.readFileSync(fixturePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Fixture must be an array of funnel events');
  return parsed;
}

function validateEvent(event) {
  if (!event || typeof event !== 'object') return { ok: false, reason: 'event must be an object' };
  if (!ALLOWED.has(event.name)) return { ok: false, reason: `invalid name: ${String(event.name)}` };
  if (typeof event.timestamp !== 'string' || !event.timestamp.trim()) {
    return { ok: false, reason: 'missing timestamp' };
  }
  if (!event.payload || typeof event.payload !== 'object') {
    return { ok: false, reason: 'missing payload object' };
  }
  return { ok: true };
}

function main() {
  const sample = [
    { id: 'ok-visit', name: 'funnel_visit', timestamp: new Date().toISOString(), payload: { source: 'landing' } },
    { id: 'ok-booking', name: 'funnel_booking_started', timestamp: new Date().toISOString(), payload: { serviceId: 'svc_1' } },
    { id: 'bad-name', name: 'funnel_unknown', timestamp: new Date().toISOString(), payload: {} },
  ];

  const events = readFixture() ?? sample;
  const strictSampleMode = !process.argv[2];

  let failed = 0;
  for (const event of events) {
    const result = validateEvent(event);
    if (strictSampleMode && String(event.id).startsWith('ok') && !result.ok) {
      failed++;
      console.error(`FAIL ${event.id}: expected valid, got ${result.reason}`);
    } else if (strictSampleMode && String(event.id).startsWith('bad') && result.ok) {
      failed++;
      console.error(`FAIL ${event.id}: expected invalid`);
    } else {
      if (!strictSampleMode) {
        console.log(`${result.ok ? 'PASS' : 'FAIL'} ${event.id ?? event.name ?? 'event'}${result.ok ? '' : `: ${result.reason}`}`);
        if (!result.ok) failed++;
      } else {
        console.log(`PASS ${event.id}`);
      }
    }
  }

  if (failed > 0) {
    console.error(`Funnel event contract smoke failed: ${failed} case(s)`);
    process.exit(1);
  }

  console.log('Funnel event contract smoke passed.');
}

main();

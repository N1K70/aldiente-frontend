import fs from 'node:fs';

const REQUIRED = ['file_url', 'file_name'];

function isValidUrlLike(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  if (value.startsWith('/')) return true;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateAttachment(attachment) {
  if (!attachment || typeof attachment !== 'object') {
    return { ok: false, reason: 'attachment missing or not object' };
  }
  for (const key of REQUIRED) {
    if (!attachment[key]) return { ok: false, reason: `missing ${key}` };
  }
  if (!isValidUrlLike(attachment.file_url)) {
    return { ok: false, reason: 'invalid file_url' };
  }
  return { ok: true };
}

function getCasesFromArgs() {
  const fixturePath = process.argv[2];
  if (!fixturePath) return null;
  const raw = fs.readFileSync(fixturePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('Fixture must be an array of messages');
  }
  return parsed;
}

function main() {
  const sample = [
    {
      id: 'ok-1',
      content: '[Archivo] foto.png',
      attachment: {
        file_url: 'https://cdn.example.com/a.png',
        file_name: 'foto.png',
        file_size: 1234,
        file_mime: 'image/png',
      },
    },
    {
      id: 'ok-2',
      content: '[Archivo] local.pdf',
      attachment: {
        file_url: '/uploads/local.pdf',
        file_name: 'local.pdf',
      },
    },
    {
      id: 'bad-1',
      content: '[Archivo] x',
      attachment: { file_name: 'x' },
    },
  ];

  const cases = getCasesFromArgs() ?? sample;
  const strictSampleMode = !process.argv[2];

  let failed = 0;
  for (const msg of cases) {
    const result = validateAttachment(msg.attachment);
    if (strictSampleMode && msg.id?.startsWith('ok') && !result.ok) {
      failed++;
      console.error(`FAIL ${msg.id}: expected valid, got ${result.reason}`);
    } else if (strictSampleMode && msg.id?.startsWith('bad') && result.ok) {
      failed++;
      console.error(`FAIL ${msg.id}: expected invalid`);
    } else {
      if (!strictSampleMode) {
        console.log(`${result.ok ? 'PASS' : 'FAIL'} ${msg.id ?? 'message'}${result.ok ? '' : `: ${result.reason}`}`);
        if (!result.ok) failed++;
      } else {
        console.log(`PASS ${msg.id}`);
      }
    }
  }

  if (failed > 0) {
    console.error(`Contract smoke failed: ${failed} case(s)`);
    process.exit(1);
  }
  console.log('Chat attachment contract smoke passed.');
}

main();

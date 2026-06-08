import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve('src');
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json']);
const forbiddenPatterns = [
  /\bmock(?:s|ed|ing|Data)?\b/i,
  /\bdummy\b/i,
  /\bfake\b/i,
  /\bsample\b/i,
  /\bfixture\b/i,
  /\bdemo(?:Data)?\b/i,
  /Universidad Visual QA/i,
  /Visual QA/i,
];

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    if (!extensions.has(path.extname(entry.name))) return [];
    return [fullPath];
  });
}

const findings = [];

for (const filePath of listFiles(rootDir)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const pattern of forbiddenPatterns) {
      if (!pattern.test(line)) continue;
      findings.push({
        filePath,
        lineNumber: index + 1,
        line: line.trim(),
        pattern: pattern.toString(),
      });
      break;
    }
  });
}

if (findings.length > 0) {
  console.error('Production mock guard failed: forbidden mock/demo markers found in src.');
  for (const finding of findings) {
    const relativePath = path.relative(process.cwd(), finding.filePath);
    console.error(`- ${relativePath}:${finding.lineNumber} (${finding.pattern})`);
    console.error(`  ${finding.line}`);
  }
  process.exit(1);
}

console.log('Production mock guard passed: no mock/demo markers found in src.');

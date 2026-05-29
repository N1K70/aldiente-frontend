import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve('src');
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const mojibakePattern = /Ã|Â|â|ð|Å¸|ƒ|�/;

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    return extensions.has(path.extname(entry.name)) ? [fullPath] : [];
  });
}

const findings = [];

for (const filePath of listFiles(rootDir)) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!mojibakePattern.test(line)) return;
    findings.push({
      filePath: path.relative(process.cwd(), filePath),
      lineNumber: index + 1,
      line: line.trim(),
    });
  });
}

if (findings.length > 0) {
  console.error('Source encoding guard failed: mojibake-like text found in src.');
  for (const finding of findings) {
    console.error(`- ${finding.filePath}:${finding.lineNumber}`);
    console.error(`  ${finding.line}`);
  }
  process.exit(1);
}

console.log('Source encoding guard passed: no mojibake-like text found in src.');

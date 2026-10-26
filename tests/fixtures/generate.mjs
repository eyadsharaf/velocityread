/**
 * Generates the binary/text E2E fixtures used by the Playwright suite.
 *
 *   node tests/fixtures/generate.mjs
 *
 * - sample.txt   : 69 words, 3 paragraphs, 9 sentences — indices are known
 *                  (The=0, Pack=9, How=17, Jackdaws=42, jugs.=16/56) so specs
 *                  can assert exact sentence jumps and progress percentages.
 * - sample.md    : markdown with headings, bold, links, lists, quotes.
 * - empty.txt    : 0 bytes — triggers the "No readable text" import error.
 * - sample.pdf   : minimal single-page PDF with three text lines (built by
 *                  hand with correct xref offsets; no deps).
 * - sample.epub  : minimal valid EPUB 3 (mimetype + container + OPF + 1 chapter),
 *                  zipped with the macOS `zip` CLI (mimetype stored uncompressed).
 */
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURES_DIR = resolve(dirname(fileURLToPath(import.meta.url)));

// --- sample.txt -------------------------------------------------------------
const sampleTxt = `The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!

Sphinx of black quartz, judge my vow. The five boxing wizards jump quickly. Bright vixens jump; dozy fowl quack.

Jackdaws love my big sphinx of quartz. Pack my box with five dozen liquor jugs. The quick brown fox jumps over the lazy dog again and again.
`;
writeFileSync(join(FIXTURES_DIR, 'sample.txt'), sampleTxt, 'utf8');

// --- sample.md --------------------------------------------------------------
const sampleMd = `# Markdown Journey

This is a **bold statement** with a [link](https://example.com) and some \`inline code\` for good measure.

- First list item arrives
- Second list item follows

> A quoted sentence ends here. Another quoted sentence follows it.

A plain closing paragraph with a final sentence and terminal punctuation.
`;
writeFileSync(join(FIXTURES_DIR, 'journey.md'), sampleMd, 'utf8');

// --- empty.txt --------------------------------------------------------------
writeFileSync(join(FIXTURES_DIR, 'empty.txt'), '', 'utf8');

// --- sample.pdf -------------------------------------------------------------
/** Build a minimal single-page PDF with correct xref offsets (no deps). */
function buildPdf(lines) {
  const content = lines
    .map((line, i) => `BT /F1 14 Tf 72 ${720 - i * 28} Td (${line}) Tj ET`)
    .join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return pdf;
}
writeFileSync(
  join(FIXTURES_DIR, 'sample.pdf'),
  buildPdf([
    'The quick brown fox jumps over the lazy dog.',
    'Pack my box with five dozen liquor jugs.',
    'Sphinx of black quartz, judge my vow.',
  ]),
  'latin1'
);

// --- sample.epub ------------------------------------------------------------
const epubBuild = join(FIXTURES_DIR, '.epub-build');
rmSync(epubBuild, { recursive: true, force: true });
mkdirSync(join(epubBuild, 'META-INF'), { recursive: true });
mkdirSync(join(epubBuild, 'OEBPS'), { recursive: true });

// mimetype must be stored uncompressed and be the first entry.
writeFileSync(join(epubBuild, 'mimetype'), 'application/epub+zip', 'utf8');
writeFileSync(
  join(epubBuild, 'META-INF', 'container.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
`,
  'utf8'
);
writeFileSync(
  join(epubBuild, 'OEBPS', 'content.opf'),
  `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:velocityread-e2e-fixture</dc:identifier>
    <dc:title>VelocityRead E2E Fixture</dc:title>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="ch1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="ch1"/>
  </spine>
</package>
`,
  'utf8'
);
writeFileSync(
  join(epubBuild, 'OEBPS', 'chapter1.xhtml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Chapter 1</title></head>
<body>
  <p>Reading science matters more than raw speed alone. The optimal recognition point anchors each flashed word.</p>
  <p>Adaptive pacing adds pauses for punctuation, numbers, and long words. Readers keep their place with context.</p>
</body>
</html>
`,
  'utf8'
);

const epubOut = join(FIXTURES_DIR, 'sample.epub');
rmSync(epubOut, { force: true });
execSync(`cd "${epubBuild}" && zip -X -0 "${epubOut}" mimetype && zip -X -9 "${epubOut}" META-INF/container.xml OEBPS/content.opf OEBPS/chapter1.xhtml`, { stdio: 'pipe' });
rmSync(epubBuild, { recursive: true, force: true });

console.log('Fixtures generated in', FIXTURES_DIR);

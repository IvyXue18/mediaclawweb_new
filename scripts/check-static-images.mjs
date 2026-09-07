import { fileURLToPath } from 'node:url';

import { auditStaticImages } from './lib/static-images.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const audit = auditStaticImages(root);
console.log(
  `[static-images] ${audit.references.length} references, ${audit.uniqueImages} unique images, ${audit.missing.length} missing`
);
for (const ref of audit.missing) {
  console.error(`${ref.file}:${ref.line} ${ref.url}`);
}
if (audit.missing.length) process.exitCode = 1;

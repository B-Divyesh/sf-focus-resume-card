import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import JSZip from 'jszip';

const source = '.output/chrome-mv3';
const destination = 'dist/site/downloads/focus-resume-card.zip';
const archive = new JSZip();
// DOS ZIP timestamps cannot represent dates before 1980. Keep every member at
// the earliest representable instant so two packages made from the same WXT
// output have identical bytes, regardless of when CI happens to run.
const PACKAGE_DATE = new Date('1980-01-01T00:00:00.000Z');

async function addDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await addDirectory(path);
    else archive.file(relative(source, path), await readFile(path), {
      createFolders: false,
      date: PACKAGE_DATE,
    });
  }
}

await addDirectory(source);
await mkdir('dist/site/downloads', { recursive: true });
await writeFile(destination, await archive.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } }));
console.log(`Packaged ${destination}`);

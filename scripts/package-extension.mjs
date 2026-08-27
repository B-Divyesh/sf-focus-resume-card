import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import JSZip from 'jszip';

const source = '.output/chrome-mv3';
const destination = 'dist/site/downloads/focus-resume-card.zip';
const archive = new JSZip();

async function addDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await addDirectory(path);
    else archive.file(relative(source, path), await readFile(path));
  }
}

await addDirectory(source);
await mkdir('dist/site/downloads', { recursive: true });
await writeFile(destination, await archive.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } }));
console.log(`Packaged ${destination}`);

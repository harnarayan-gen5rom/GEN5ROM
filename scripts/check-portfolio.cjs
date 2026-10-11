const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const esbuild = require('esbuild');

// Render the real UI with production React, without a browser or a GPU.
let source = fs.readFileSync('src/portfolio.js', 'utf8');
source = source.slice(0, source.lastIndexOf('(0, br.createRoot)')) + `
import { renderToString } from 'react-dom/server';
export const markup = renderToString(React.createElement(Xl));
`;
const result = esbuild.buildSync({
  stdin: { contents: source, resolveDir: process.cwd() + '/src' },
  bundle: true, write: false, platform: 'node', format: 'cjs',
  define: { 'process.env.NODE_ENV': '"production"' },
  external: ['../assets/index-DSt8gREU.js']
});
const rendered = new Module(process.cwd() + '/portfolio-check.cjs');
rendered.filename = process.cwd() + '/portfolio-check.cjs';
rendered._compile(result.outputFiles[0].text, rendered.filename);
const html = rendered.exports.markup;
for (const text of ['MwyLKuCi6Qc', 'Load interactive 3D', 'id="interactive"', 'id="work"', 'id="contact"']) {
  assert(html.includes(text), `Missing ${text}`);
}
assert(!html.includes('<canvas'), '3D must wait for a deliberate tap');
assert(!html.includes('<iframe'), 'Video players must wait for a deliberate tap');
assert(!fs.readFileSync('index.html', 'utf8').includes('modulepreload'), 'No eager Spline downloads');

// Validate every retained runtime import/export, including its dynamic chunks.
esbuild.buildSync({
  entryPoints: ['assets/index-DSt8gREU.js'],
  bundle: true, write: false, platform: 'browser', format: 'esm', logLevel: 'error'
});
console.log('PASS: production page renders; new video is present; 3D/video wait for input; runtime module graph resolves.');

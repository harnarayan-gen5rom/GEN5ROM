const esbuild = require('esbuild');
esbuild.buildSync({
  entryPoints: ['src/portfolio.js'],
  outfile: 'assets/portfolio-app.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  define: { 'process.env.NODE_ENV': '"production"' },
  external: ['../assets/index-DSt8gREU.js'],
  minify: true,
  legalComments: 'eof'
});

const fs = require('fs');
const path = require('path');
const ncc = require('@vercel/ncc');
const { execSync } = require('child_process');

async function build() {
  console.log('1. Compiling backend/server.js with @vercel/ncc...');
  const entry = path.resolve(__dirname, '../backend/server.js');
  const { code } = await ncc(entry, {
    minify: false,
    sourceMap: false,
  });

  const distDir = path.resolve(__dirname, '../backend/dist');
  fs.mkdirSync(distDir, { recursive: true });

  let cjsCode = code;
  cjsCode = cjsCode.replace(
    /import\s*\{\s*createRequire\s+as\s+__WEBPACK_EXTERNAL_createRequire\s*\}\s*from\s*["']module["'];?/g,
    'const __WEBPACK_EXTERNAL_createRequire = () => require;'
  );
  cjsCode = cjsCode.replace(/import\.meta\.url/g, '""');

  const outIndex = path.join(distDir, 'index.js');
  fs.writeFileSync(outIndex, cjsCode, 'utf8');

  const pkgJson = {
    name: 'anime-server',
    version: '1.0.0',
    main: 'index.js',
    bin: 'index.js',
    pkg: {
      scripts: ['index.js']
    }
  };
  fs.writeFileSync(path.join(distDir, 'package.json'), JSON.stringify(pkgJson, null, 2), 'utf8');

  console.log('2. Packaging with pkg...');
  const outBinary = path.resolve(__dirname, '../src-tauri/bin/anime-server-x86_64-pc-windows-msvc');
  const pkgConfig = path.join(distDir, 'package.json');
  execSync(`npx pkg "${pkgConfig}" -t node18-win-x64 -o "${outBinary}"`, {
    stdio: 'inherit'
  });

  console.log('3. Sidecar build complete.');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});

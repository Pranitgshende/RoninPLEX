const fs = require('fs');
const ts = require('typescript');
const serviceCode = fs.readFileSync('src/services/anime/AnimeStreamService.ts', 'utf8');
const transpiled = ts.transpile(serviceCode, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS });
const exportsObj = {};
const func = new Function('exports', 'require', transpiled);
func(exportsObj, (name) => {
  if (name.includes('logger')) return { logPlayback: console.log };
  return {};
});

(async () => {
  try {
    const stream = await exportsObj.AnimeStreamService.resolveEpisodeStream('Naruto', 1, 'sub');
    console.log('FINAL STREAM:', stream);
  } catch (e) {
    console.error('ERROR:', e);
  }
  process.exit(0);
})();

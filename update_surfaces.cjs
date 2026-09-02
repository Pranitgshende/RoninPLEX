const fs = require('fs');
const path = require('path');

const walkSync = (dir, callback) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile() && filepath.endsWith('.tsx')) {
      callback(filepath);
    }
  });
};

walkSync(path.join(__dirname, 'src'), (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  let original = content;

  // Detail Page Poster
  content = content.replace(/shadow-2xl border border-white\/10 bg-surface-200/g, 'glass-standard');
  
  // Cast Cards & Episode Cards
  content = content.replace(/bg-surface-100\/60 border border-white\/5/g, 'glass-subtle');
  content = content.replace(/bg-surface-100 border border-white\/5/g, 'glass-subtle');
  
  // Meta tags (Runtime, Date, Seasons)
  content = content.replace(/bg-surface-100 border border-white\/10/g, 'glass-subtle');

  // Input select
  content = content.replace(/bg-surface-300 border border-white\/10/g, 'glass-subtle');

  // Misc
  content = content.replace(/bg-surface-50 border border-white\/10/g, 'glass-subtle');

  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log('Updated:', filepath);
  }
});

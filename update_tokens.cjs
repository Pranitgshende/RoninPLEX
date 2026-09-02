const fs = require('fs');
const path = require('path');

const walkSync = (dir, callback) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile() && (filepath.endsWith('.tsx') || filepath.endsWith('.ts'))) {
      callback(filepath);
    }
  });
};

walkSync(path.join(__dirname, 'src'), (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  let original = content;

  content = content.replace(/\bglass-card glass-card-hover\b/g, 'glass-standard glass-interactive');
  content = content.replace(/\bglass-card\b/g, 'glass-standard');
  content = content.replace(/\bglass-nav\b/g, 'glass-subtle !border-x-0 !border-t-0');
  content = content.replace(/\bglass-panel\b/g, 'glass-elevated');
  content = content.replace(/\bglass-modal\b/g, 'glass-elevated');
  content = content.replace(/\bglass-chip\b/g, 'glass-subtle glass-interactive');

  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log('Updated:', filepath);
  }
});

const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, 'node_modules', 'react-resizable-panels', 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  console.log('Version:', pkg.version);
  console.log('Main:', pkg.main);
  console.log('Module:', pkg.module);
  console.log('Exports:', pkg.exports);
} else {
  console.log('Package not found');
}

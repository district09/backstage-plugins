const fs = require('fs');
const path = require('path');

const dirs = [
  'C:\\Dev\\backstage-plugins\\plugins\\migrations\\src\\components\\ComponentMigrationsContent',
  'C:\\Dev\\backstage-plugins\\plugins\\migrations\\src\\components\\MigrationComponentsTable'
];

dirs.forEach(dir => {
  try {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created: ${dir}`);
  } catch (err) {
    console.error(`✗ Error creating ${dir}:`, err.message);
  }
});

// Verify directories exist
console.log('\nVerification:');
dirs.forEach(dir => {
  const exists = fs.existsSync(dir);
  console.log(`${exists ? '✓' : '✗'} ${dir} exists: ${exists}`);
});

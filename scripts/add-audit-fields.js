#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to update
const files = [
  'src/features/clients/services/clientService.ts',
  'src/features/jobs/services/jobService.ts',
  'src/features/equipment/services/equipmentService.ts',
];

files.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add audit fields before createdAt
  content = content.replace(
    /(\s+)createdAt: new Date\(/g,
    "$1createdBy: 'tech_test_admin',\n$1createdByName: 'Test Admin',\n$1createdAt: new Date("
  );

  // Add modified fields before updatedAt
  content = content.replace(
    /(\s+)updatedAt: new Date\(/g,
    "$1modifiedBy: 'tech_test_admin',\n$1modifiedByName: 'Test Admin',\n$1updatedAt: new Date("
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.warn(`Updated ${file}`);
});

console.warn('Done!');

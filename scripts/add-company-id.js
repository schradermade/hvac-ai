#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to update
const files = [
  'src/features/clients/services/clientService.ts',
  'src/features/jobs/services/jobService.ts',
];

files.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace client test objects
  content = content.replace(
    /{\n(\s+)id: 'client_test_/g,
    "{\n$1companyId: 'company_test_1',\n$1id: 'client_test_"
  );

  // Replace job test objects
  content = content.replace(
    /{\n(\s+)id: 'job_test_/g,
    "{\n$1companyId: 'company_test_1',\n$1id: 'job_test_"
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});

console.log('Done!');

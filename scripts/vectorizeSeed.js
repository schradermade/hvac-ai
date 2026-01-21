const { readFileSync } = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8787';

function getArg(name, fallback) {
  const arg = process.argv.find((value) => value.startsWith(`--${name}=`));
  if (!arg) {
    return fallback;
  }
  return arg.split('=')[1];
}

function loadLocalSecret() {
  const devVarsPath = path.join(process.cwd(), '.dev.vars');
  try {
    const raw = readFileSync(devVarsPath, 'utf-8');
    const line = raw.split('\n').find((entry) => entry.startsWith('VECTORIZE_ADMIN_TOKEN='));
    if (!line) {
      return undefined;
    }
    return line.replace('VECTORIZE_ADMIN_TOKEN=', '').trim();
  } catch {
    return undefined;
  }
}

async function runSeed() {
  const tenantId = getArg('tenant', 'tenant_demo');
  const jobId = getArg('job', 'job_demo');

  const endpoint = `${BASE_URL}/api/vectorize/reindex/job/${jobId}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-tenant-id': tenantId,
      'x-api-key': loadLocalSecret() || '',
    },
    body: JSON.stringify({ jobId }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Seed failed: ${response.status} ${text}`);
  }

  console.warn(text);
}

runSeed().catch((error) => {
  console.error(error);
  process.exit(1);
});

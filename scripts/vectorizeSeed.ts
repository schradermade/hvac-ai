import { readFileSync } from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:8787';

function getArg(name: string, fallback?: string) {
  const arg = process.argv.find((value) => value.startsWith(`--${name}=`));
  if (!arg) {
    return fallback;
  }
  return arg.split('=')[1];
}

function loadLocalSecret(): string | undefined {
  const devVarsPath = path.join(process.cwd(), '.dev.vars');
  try {
    const raw = readFileSync(devVarsPath, 'utf-8');
    const line = raw.split('\n').find((entry) => entry.startsWith('OPENAI_API_KEY='));
    if (!line) {
      return undefined;
    }
    return line.replace('OPENAI_API_KEY=', '').trim();
  } catch {
    return undefined;
  }
}

async function runSeed() {
  const tenantId = getArg('tenant', 'tenant_demo');
  const jobId = getArg('job', 'job_demo');
  const localMode = process.argv.includes('--local');

  const endpoint = `${BASE_URL}/api/vectorize/reindex/job/${jobId}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-tenant-id': tenantId,
      'x-api-key': loadLocalSecret() ?? '',
      'x-local-mode': localMode ? '1' : '0',
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

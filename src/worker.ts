import { Hono } from 'hono';
import { createCopilotRouter } from '@/server/copilot/routes';
import type { AppEnv } from '@/server/copilot/workerTypes';

const app = new Hono<AppEnv>();

app.route('/api', createCopilotRouter());
app.notFound((c) => c.json({ error: 'Not found' }, 404));

export default app;

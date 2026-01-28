import { getJobEvidence } from '../buildEvidence';

type Prepared<T> = {
  bind: (..._args: unknown[]) => Prepared<T>;
  all: <R = T>() => Promise<{ results: R[] }>;
  first: <R = T>() => Promise<R | null>;
};

type FakeDb = {
  prepare: <T = unknown>(query: string) => Prepared<T>;
};

type D1Database = {
  prepare: <T = unknown>(query: string) => Prepared<T>;
};

describe('getJobEvidence', () => {
  const makePrepared = <T>(params: {
    first?: () => Promise<T | null>;
    all?: () => Promise<{ results: T[] }>;
  }): Prepared<T> => {
    const prepared: Prepared<T> = {
      bind: () => prepared,
      first: params.first ?? (async () => null),
      all: params.all ?? (async () => ({ results: [] })),
    };
    return prepared;
  };

  it('returns combined evidence sorted by date desc', async () => {
    const db: FakeDb = {
      prepare: (query: string) => {
        const trimmed = query.replace(/\s+/g, ' ').trim().toLowerCase();

        if (trimmed.includes('from jobs')) {
          return makePrepared({
            first: async () => ({ property_id: 'p1', client_id: 'c1' }),
            all: async () => ({ results: [] }),
          }) as Prepared<{ property_id: string; client_id: string }>;
        }

        if (trimmed.includes('from job_events')) {
          return makePrepared({
            all: async () => ({
              results: [
                {
                  id: 'e1',
                  event_type: 'diagnostic',
                  issue: 'noise',
                  resolution: null,
                  created_at: '2024-01-02T10:00:00Z',
                },
              ],
            }),
          }) as Prepared<unknown>;
        }

        if (trimmed.includes('from notes')) {
          return makePrepared({
            all: async () => ({
              results: [
                {
                  id: 'n1',
                  note_type: 'job',
                  content: 'Checked filter',
                  created_at: '2024-01-03T09:00:00Z',
                  author_name: 'Tech A',
                  author_email: 'a@example.com',
                },
              ],
            }),
          }) as Prepared<unknown>;
        }

        return makePrepared({}) as Prepared<unknown>;
      },
    };

    const evidence = await getJobEvidence(db as unknown as D1Database, 't1', 'j1');

    expect(evidence).toHaveLength(5);
    expect(evidence.slice(0, 3).every((item) => item.docId === 'n1')).toBe(true);
    expect(evidence.slice(3).every((item) => item.docId === 'e1')).toBe(true);
  });

  it('returns empty when job is missing', async () => {
    const db: FakeDb = {
      prepare: (query: string) => {
        const trimmed = query.replace(/\s+/g, ' ').trim().toLowerCase();
        if (trimmed.includes('from jobs')) {
          return makePrepared({
            first: async () => null,
            all: async () => ({ results: [] }),
          }) as Prepared<unknown>;
        }
        return makePrepared({}) as Prepared<unknown>;
      },
    };

    const evidence = await getJobEvidence(db as unknown as D1Database, 't1', 'j1');

    expect(evidence).toEqual([]);
  });
});

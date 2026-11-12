// Cliente Supabase falso: registra cada consulta y responde con lo que configure la prueba.
export interface QueryResult {
  data?: unknown;
  error?: unknown;
}

interface Call {
  table: string;
  ops: string[];
}

export const mock = {
  calls: [] as Call[],
  queue: [] as QueryResult[],
  user: { id: 'user-1' } as { id: string } | null,
  signOutCalls: 0,
  reset(): void {
    this.calls = [];
    this.queue = [];
    this.user = { id: 'user-1' };
    this.signOutCalls = 0;
  },
  respond(...results: QueryResult[]): void {
    this.queue.push(...results);
  },
};

function builder(table: string) {
  const call: Call = { table, ops: [] };
  mock.calls.push(call);

  const chain: Record<string, unknown> = {};
  for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'gte', 'lte', 'order', 'range', 'single', 'maybeSingle']) {
    chain[method] = (...args: unknown[]) => {
      call.ops.push(`${method}(${args.map((a) => JSON.stringify(a)).join(',')})`);
      return chain;
    };
  }
  chain.then = (resolve: (value: QueryResult) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(mock.queue.shift() ?? { data: null, error: null }).then(resolve, reject);
  return chain;
}

export const supabase = {
  from: (table: string) => builder(table),
  rpc: async () => mock.queue.shift() ?? { data: null, error: null },
  auth: {
    signInWithPassword: async () => mock.queue.shift() ?? { data: {}, error: null },
    signUp: async () => mock.queue.shift() ?? { data: { user: null, session: null }, error: null },
    getUser: async () => ({ data: { user: mock.user }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signOut: async () => {
      mock.signOutCalls += 1;
      return { error: null };
    },
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  },
};

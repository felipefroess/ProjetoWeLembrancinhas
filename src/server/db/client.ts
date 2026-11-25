import 'server-only';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';

const rawDatabaseUrl = (process.env.DATABASE_URL || '').trim();

export function isDbConfigured(): boolean {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return false;
  }

  return Boolean(
    rawDatabaseUrl &&
    rawDatabaseUrl.startsWith('postgres') &&
    !rawDatabaseUrl.includes('placeholder') &&
    !rawDatabaseUrl.includes('usuario:senha')
  );
}

let dbInstance: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> | null {
  if (!isDbConfigured()) {
    return null;
  }

  if (!dbInstance) {
    dbInstance = neon(rawDatabaseUrl);
  }

  return dbInstance;
}

export async function sql<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  const db = getDb();
  if (!db) {
    throw new Error(
      'Banco de dados Neon não configurado. Defina a variável DATABASE_URL no arquivo .env.local.'
    );
  }

  const result = await db(strings, ...values);
  return result as T[];
}


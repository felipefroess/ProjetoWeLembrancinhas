import 'server-only';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';

/**
 * WE LEMBRANCINHAS - CONEXÃO COM POSTGRESQL (NEON)
 * 
 * Camada centralizada de acesso ao banco. Protegida por 'server-only',
 * garantindo que jamais seja importada acidentalmente em Client Components.
 */

const rawDatabaseUrl = (process.env.DATABASE_URL || '').trim();

/**
 * Verifica se a variável DATABASE_URL está configurada e válida.
 */
export function isDbConfigured(): boolean {
  return Boolean(
    rawDatabaseUrl &&
    rawDatabaseUrl.startsWith('postgres') &&
    !rawDatabaseUrl.includes('placeholder') &&
    !rawDatabaseUrl.includes('usuario:senha')
  );
}

let dbInstance: NeonQueryFunction<false, false> | null = null;

/**
 * Retorna o cliente SQL do Neon (ou null se não configurado).
 */
export function getDb(): NeonQueryFunction<false, false> | null {
  if (!isDbConfigured()) {
    return null;
  }

  if (!dbInstance) {
    dbInstance = neon(rawDatabaseUrl);
  }

  return dbInstance;
}

/**
 * Helper tagged template para executar queries seguras com parametrização automática.
 * Exemplo: const rows = await sql`SELECT * FROM products WHERE id = ${id}`;
 */
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


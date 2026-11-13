import { sql, isDbConfigured } from '@/server/db/client';

export interface SeedMeta {
  productsSeeded?: boolean;
  categoriesSeeded?: boolean;
  couponsSeeded?: boolean;
  settingsSeeded?: boolean;
  statusSeeded?: boolean;
}

const SEED_META_ID = 'seed_meta';

export async function getSeedMeta(): Promise<SeedMeta> {
  if (!isDbConfigured()) return {};

  try {
    const rows = await sql<{ data: SeedMeta }>`
      SELECT data FROM public.store_settings WHERE id = ${SEED_META_ID} LIMIT 1
    `;
    if (rows.length > 0 && rows[0]?.data && typeof rows[0].data === 'object') {
      return rows[0].data as SeedMeta;
    }
    return {};
  } catch {
    return {};
  }
}

export async function markSeedMeta(patch: Partial<SeedMeta>): Promise<void> {
  if (!isDbConfigured()) return;

  try {
    const current = await getSeedMeta();
    const updated = { ...current, ...patch };
    const nowIso = new Date().toISOString();

    await sql`
      INSERT INTO public.store_settings (id, data, updated_at)
      VALUES (${SEED_META_ID}, ${JSON.stringify(updated)}::jsonb, ${nowIso})
      ON CONFLICT (id) DO UPDATE
      SET data = ${JSON.stringify(updated)}::jsonb, updated_at = ${nowIso}
    `;
  } catch (err) {
    console.error('Erro ao salvar seed_meta no Neon:', err);
  }
}

import { getSupabaseAdmin } from '@/lib/supabase';

export interface SeedMeta {
  productsSeeded?: boolean;
  categoriesSeeded?: boolean;
  couponsSeeded?: boolean;
  settingsSeeded?: boolean;
  statusSeeded?: boolean;
}

const SEED_META_ID = 'seed_meta';

export async function getSeedMeta(): Promise<SeedMeta> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return {};

  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('data')
      .eq('id', SEED_META_ID)
      .maybeSingle();

    if (error || !data?.data || typeof data.data !== 'object') {
      return {};
    }
    return data.data as SeedMeta;
  } catch {
    return {};
  }
}

export async function markSeedMeta(patch: Partial<SeedMeta>): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    const current = await getSeedMeta();
    await supabase.from('store_settings').upsert(
      {
        id: SEED_META_ID,
        data: { ...current, ...patch },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.error('Erro ao salvar seed_meta no Supabase:', err);
  }
}

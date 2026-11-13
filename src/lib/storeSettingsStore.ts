import fs from 'fs';
import path from 'path';
import { StoreSettings, DEFAULT_SETTINGS } from '@/types/storeSettings';
import { sql, isDbConfigured } from '@/server/db/client';
import { getSeedMeta, markSeedMeta } from '@/lib/seedMeta';
import { updateAllCustomProductsLeadTime } from '@/lib/productsStore';

export type { StoreSettings, TopBannerSettings } from '@/types/storeSettings';
export { DEFAULT_SETTINGS };

const SETTINGS_FILE = path.join(process.cwd(), 'src', 'data', 'store-settings.json');
const STATUS_FILE = path.join(process.cwd(), 'src', 'data', 'store-status.json');
const SETTINGS_ROW_ID = 'main';
const STATUS_ROW_ID = 'status';

function mergeSettings(raw: Partial<StoreSettings> | null | undefined): StoreSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    topBanner: {
      ...DEFAULT_SETTINGS.topBanner,
      ...(raw.topBanner || {}),
    },
  };
}

function readLocalSettings(): StoreSettings {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      return DEFAULT_SETTINGS;
    }
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return mergeSettings(JSON.parse(raw));
  } catch (error) {
    console.error('Erro ao ler configurações locais da loja:', error);
    return DEFAULT_SETTINGS;
  }
}

function writeLocalSettings(settings: StoreSettings): void {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  } catch {
    // Em ambientes somente leitura, ignora falha de escrita local
  }
}

function readLocalStatus(): { isOnline: boolean } {
  try {
    if (!fs.existsSync(STATUS_FILE)) {
      return { isOnline: true };
    }
    const raw = fs.readFileSync(STATUS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { isOnline: parsed?.isOnline !== false };
  } catch {
    return { isOnline: true };
  }
}

function writeLocalStatus(data: { isOnline: boolean }): void {
  try {
    const dir = path.dirname(STATUS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // Em ambientes somente leitura, ignora falha de escrita local
  }
}

/**
 * Lê as configurações da loja no Neon (com auto-seed inicial e fallback local)
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  if (isDbConfigured()) {
    try {
      const rows = await sql<{ data: Partial<StoreSettings> }>`
        SELECT data FROM public.store_settings WHERE id = ${SETTINGS_ROW_ID} LIMIT 1
      `;

      if (rows.length > 0 && rows[0]?.data) {
        return mergeSettings(rows[0].data);
      }

      const meta = await getSeedMeta();
      const local = readLocalSettings();
      if (!meta.settingsSeeded) {
        const nowIso = new Date().toISOString();
        await sql`
          INSERT INTO public.store_settings (id, data, updated_at)
          VALUES (${SETTINGS_ROW_ID}, ${JSON.stringify(local)}::jsonb, ${nowIso})
          ON CONFLICT (id) DO UPDATE
          SET data = ${JSON.stringify(local)}::jsonb, updated_at = ${nowIso}
        `;
        await markSeedMeta({ settingsSeeded: true });
      }
      return local;
    } catch (err) {
      console.error('Erro ao buscar ajustes da loja no Neon, usando fallback local:', err);
    }
  }

  return readLocalSettings();
}

/**
 * Salva as configurações da loja no Neon e opcionalmente atualiza os prazos em lote
 */
export async function updateStoreSettings(
  updates: Partial<StoreSettings>,
  applyLeadTimeToAllProducts = false
): Promise<{ success: boolean; settings: StoreSettings; error?: string }> {
  try {
    const current = await getStoreSettings();

    let whatsappNumber =
      updates.whatsappNumber !== undefined
        ? updates.whatsappNumber.replace(/\D/g, '')
        : current.whatsappNumber;
    if (whatsappNumber.length === 10 || whatsappNumber.length === 11) {
      whatsappNumber = '55' + whatsappNumber;
    }

    const instagram =
      updates.instagram !== undefined
        ? updates.instagram.replace(/^@/, '').trim()
        : current.instagram;
    const instagramUrl = instagram ? `https://instagram.com/${instagram}` : current.instagramUrl;

    const updatedSettings: StoreSettings = {
      ...current,
      ...updates,
      whatsappNumber,
      instagram,
      instagramUrl,
      defaultLeadTimeDays:
        updates.defaultLeadTimeDays !== undefined
          ? Math.max(1, Number(updates.defaultLeadTimeDays))
          : current.defaultLeadTimeDays,
      topBanner: {
        ...current.topBanner,
        ...(updates.topBanner || {}),
      },
    };

    if (isDbConfigured()) {
      const nowIso = new Date().toISOString();
      const payload = JSON.stringify(updatedSettings);

      try {
        await sql`
          INSERT INTO public.store_settings (id, data, updated_at)
          VALUES (${SETTINGS_ROW_ID}, ${payload}::jsonb, ${nowIso})
          ON CONFLICT (id) DO UPDATE
          SET data = ${payload}::jsonb, updated_at = ${nowIso}
        `;
      } catch (error) {
        console.error('Erro ao salvar ajustes no Neon:', error);
        return {
          success: false,
          settings: current,
          error: 'Erro ao gravar configurações no Neon.',
        };
      }
    }

    writeLocalSettings(updatedSettings);

    if (applyLeadTimeToAllProducts && updates.defaultLeadTimeDays) {
      await updateAllCustomProductsLeadTime(updates.defaultLeadTimeDays);
    }

    return { success: true, settings: updatedSettings };
  } catch (error) {
    console.error('Erro ao salvar configurações da loja:', error);
    return {
      success: false,
      settings: await getStoreSettings(),
      error: 'Erro ao gravar configurações da loja.',
    };
  }
}

/**
 * Lê o status Online/Offline da loja no Neon
 */
export async function getStoreStatus(): Promise<{ isOnline: boolean }> {
  if (isDbConfigured()) {
    try {
      const rows = await sql<{ data: { isOnline?: boolean } }>`
        SELECT data FROM public.store_settings WHERE id = ${STATUS_ROW_ID} LIMIT 1
      `;

      if (rows.length > 0 && rows[0]?.data && typeof rows[0].data.isOnline === 'boolean') {
        return { isOnline: Boolean(rows[0].data.isOnline) };
      }

      const meta = await getSeedMeta();
      const local = readLocalStatus();
      if (!meta.statusSeeded) {
        const nowIso = new Date().toISOString();
        await sql`
          INSERT INTO public.store_settings (id, data, updated_at)
          VALUES (${STATUS_ROW_ID}, ${JSON.stringify(local)}::jsonb, ${nowIso})
          ON CONFLICT (id) DO UPDATE
          SET data = ${JSON.stringify(local)}::jsonb, updated_at = ${nowIso}
        `;
        await markSeedMeta({ statusSeeded: true });
      }
      return local;
    } catch (err) {
      console.error('Erro ao buscar status da loja no Neon:', err);
    }
  }

  return readLocalStatus();
}

/**
 * Atualiza o status Online/Offline da loja no Neon
 */
export async function updateStoreStatus(isOnline: boolean): Promise<{ isOnline: boolean }> {
  const payload = { isOnline: Boolean(isOnline) };

  if (isDbConfigured()) {
    try {
      const nowIso = new Date().toISOString();
      await sql`
        INSERT INTO public.store_settings (id, data, updated_at)
        VALUES (${STATUS_ROW_ID}, ${JSON.stringify(payload)}::jsonb, ${nowIso})
        ON CONFLICT (id) DO UPDATE
        SET data = ${JSON.stringify(payload)}::jsonb, updated_at = ${nowIso}
      `;
    } catch (error) {
      console.error('Erro ao atualizar status da loja no Neon:', error);
      throw new Error('Erro ao atualizar status da loja no Neon.');
    }
  }

  writeLocalStatus(payload);
  return payload;
}

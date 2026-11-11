import fs from 'fs';
import path from 'path';
import { StoreSettings, DEFAULT_SETTINGS } from '@/types/storeSettings';

export type { StoreSettings, TopBannerSettings } from '@/types/storeSettings';
export { DEFAULT_SETTINGS };

const SETTINGS_FILE = path.join(process.cwd(), 'src', 'data', 'store-settings.json');
const CUSTOM_PRODUCTS_FILE = path.join(process.cwd(), 'src', 'data', 'custom-products.json');

/**
 * Lê as configurações da loja do arquivo JSON
 */
export function getStoreSettings(): StoreSettings {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf8');
      return DEFAULT_SETTINGS;
    }
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      topBanner: {
        ...DEFAULT_SETTINGS.topBanner,
        ...(parsed.topBanner || {}),
      },
    };
  } catch (error) {
    console.error('Erro ao ler configurações da loja:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Salva as configurações da loja e opcionalmente aplica o novo prazo de produção em lote
 */
export function updateStoreSettings(
  updates: Partial<StoreSettings>,
  applyLeadTimeToAllProducts = false
): { success: boolean; settings: StoreSettings; error?: string } {
  try {
    const current = getStoreSettings();

    // Limpa e formata dados
    let whatsappNumber = updates.whatsappNumber !== undefined ? updates.whatsappNumber.replace(/\D/g, '') : current.whatsappNumber;
    // Se o usuário digitou sem o DDI 55, adiciona se tiver 10 ou 11 dígitos
    if (whatsappNumber.length === 10 || whatsappNumber.length === 11) {
      whatsappNumber = '55' + whatsappNumber;
    }

    let instagram = updates.instagram !== undefined ? updates.instagram.replace(/^@/, '').trim() : current.instagram;
    let instagramUrl = instagram ? `https://instagram.com/${instagram}` : current.instagramUrl;

    const updatedSettings: StoreSettings = {
      ...current,
      ...updates,
      whatsappNumber,
      instagram,
      instagramUrl,
      defaultLeadTimeDays: updates.defaultLeadTimeDays !== undefined ? Math.max(1, Number(updates.defaultLeadTimeDays)) : current.defaultLeadTimeDays,
      topBanner: {
        ...current.topBanner,
        ...(updates.topBanner || {}),
      },
    };

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updatedSettings, null, 2), 'utf8');

    // Se o usuário marcou para propagar o novo prazo a todos os produtos cadastrados
    if (applyLeadTimeToAllProducts && updates.defaultLeadTimeDays) {
      try {
        if (fs.existsSync(CUSTOM_PRODUCTS_FILE)) {
          const rawProds = fs.readFileSync(CUSTOM_PRODUCTS_FILE, 'utf8');
          const products = JSON.parse(rawProds);
          if (Array.isArray(products)) {
            const updatedProducts = products.map((p) => ({
              ...p,
              leadTimeDays: Math.max(1, Number(updates.defaultLeadTimeDays)),
            }));
            fs.writeFileSync(CUSTOM_PRODUCTS_FILE, JSON.stringify(updatedProducts, null, 2), 'utf8');
          }
        }
      } catch (prodErr) {
        console.error('Erro ao propagar prazo para produtos:', prodErr);
      }
    }

    return { success: true, settings: updatedSettings };
  } catch (error) {
    console.error('Erro ao salvar configurações da loja:', error);
    return { success: false, settings: getStoreSettings(), error: 'Erro ao gravar arquivo de configurações.' };
  }
}

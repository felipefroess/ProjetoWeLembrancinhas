import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { getSeedMeta, markSeedMeta } from '@/lib/seedMeta';

export interface AdminCoupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description?: string;
  minOrderValue?: number;
  expiresAt?: string | null; // Formato YYYY-MM-DD ou ISO
  isActive: boolean;
  createdAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'coupons.json');

function readLocalCoupons(): AdminCoupon[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const items = JSON.parse(raw);

    if (!Array.isArray(items)) return [];

    let hasChanges = false;
    const normalized: AdminCoupon[] = items.map((item, index) => {
      const id = item.id || `cupom_${item.code?.toLowerCase() || index}_${Date.now()}`;
      if (!item.id) hasChanges = true;

      return {
        id,
        code: (item.code || '').trim().toUpperCase(),
        type: item.type === 'fixed' ? 'fixed' : 'percentage',
        value: Number(item.value) || 0,
        description: item.description || '',
        minOrderValue: Number(item.minOrderValue) || 0,
        expiresAt: item.expiresAt || null,
        isActive: item.isActive !== false,
        createdAt: item.createdAt || new Date().toISOString(),
      };
    });

    if (hasChanges) {
      saveLocalCoupons(normalized);
    }

    return normalized;
  } catch (error) {
    console.error('Erro ao ler cupons locais:', error);
    return [];
  }
}

function saveLocalCoupons(coupons: AdminCoupon[]): boolean {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(coupons, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

function mapRowToCoupon(row: any): AdminCoupon {
  return {
    id: String(row.id),
    code: String(row.code || '').trim().toUpperCase(),
    type: row.type === 'fixed' ? 'fixed' : 'percentage',
    value: Number(row.value) || 0,
    description: row.description || '',
    minOrderValue: Number(row.min_order_value) || 0,
    expiresAt: row.expires_at || null,
    isActive: row.is_active !== false,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/**
 * Lê os cupons do Supabase (com auto-seed inicial e fallback local)
 */
export async function getAllCoupons(): Promise<AdminCoupon[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data: rows, error } = await supabase
          .from('coupons')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && rows) {
          if (rows.length === 0) {
            const meta = await getSeedMeta();
            if (!meta.couponsSeeded) {
              const localCoupons = readLocalCoupons();
              if (localCoupons.length > 0) {
                const payload = localCoupons.map((c) => ({
                  id: c.id,
                  code: c.code,
                  type: c.type,
                  value: c.value,
                  description: c.description || '',
                  min_order_value: c.minOrderValue || 0,
                  expires_at: c.expiresAt || null,
                  is_active: c.isActive,
                  created_at: c.createdAt,
                }));
                const { error: seedError } = await supabase
                  .from('coupons')
                  .upsert(payload, { onConflict: 'id' });
                if (!seedError) {
                  await markSeedMeta({ couponsSeeded: true });
                  return localCoupons;
                }
              } else {
                await markSeedMeta({ couponsSeeded: true });
              }
            }
          }

          return rows.map(mapRowToCoupon);
        }
      } catch (err) {
        console.error('Erro ao buscar cupons no Supabase, usando fallback local:', err);
      }
    }
  }

  return readLocalCoupons();
}

/**
 * Cria um novo cupom
 */
export async function createCoupon(data: {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description?: string;
  minOrderValue?: number;
  expiresAt?: string | null;
  isActive?: boolean;
}): Promise<{ success: boolean; coupon?: AdminCoupon; error?: string }> {
  const cleanCode = (data.code || '').trim().toUpperCase();

  if (!cleanCode) {
    return { success: false, error: 'O código do cupom é obrigatório.' };
  }

  if (cleanCode.length < 2) {
    return { success: false, error: 'O código deve ter pelo menos 2 caracteres.' };
  }

  if (!data.value || data.value <= 0) {
    return { success: false, error: 'O valor do desconto deve ser maior que zero.' };
  }

  if (data.type === 'percentage' && data.value > 100) {
    return { success: false, error: 'A porcentagem de desconto não pode ser superior a 100%.' };
  }

  const existing = await getAllCoupons();
  if (existing.some((c) => c.code === cleanCode)) {
    return { success: false, error: `Já existe um cupom com o código "${cleanCode}".` };
  }

  const newCoupon: AdminCoupon = {
    id: `cupom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    code: cleanCode,
    type: data.type === 'fixed' ? 'fixed' : 'percentage',
    value: Number(data.value),
    description: data.description?.trim() || '',
    minOrderValue: Number(data.minOrderValue) || 0,
    expiresAt: data.expiresAt || null,
    isActive: data.isActive !== false,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase.from('coupons').insert({
        id: newCoupon.id,
        code: newCoupon.code,
        type: newCoupon.type,
        value: newCoupon.value,
        description: newCoupon.description || '',
        min_order_value: newCoupon.minOrderValue || 0,
        expires_at: newCoupon.expiresAt || null,
        is_active: newCoupon.isActive,
        created_at: newCoupon.createdAt,
      });

      if (error) {
        console.error('Erro ao criar cupom no Supabase:', error);
        return { success: false, error: 'Falha ao salvar cupom no Supabase.' };
      }

      saveLocalCoupons([newCoupon, ...existing]);
      return { success: true, coupon: newCoupon };
    }
  }

  const saved = saveLocalCoupons([newCoupon, ...existing]);
  if (!saved) {
    return { success: false, error: 'Falha ao salvar no banco de cupons.' };
  }

  return { success: true, coupon: newCoupon };
}

/**
 * Atualiza um cupom existente
 */
export async function updateCoupon(
  id: string,
  updates: Partial<Omit<AdminCoupon, 'id' | 'createdAt'>>
): Promise<{ success: boolean; coupon?: AdminCoupon; error?: string }> {
  const existing = await getAllCoupons();
  const index = existing.findIndex((c) => c.id === id);

  if (index === -1) {
    return { success: false, error: 'Cupom não encontrado.' };
  }

  const normalizedUpdates = { ...updates };
  if (normalizedUpdates.code) {
    const cleanCode = normalizedUpdates.code.trim().toUpperCase();
    if (
      cleanCode !== existing[index].code &&
      existing.some((c) => c.code === cleanCode && c.id !== id)
    ) {
      return { success: false, error: `Já existe outro cupom com o código "${cleanCode}".` };
    }
    normalizedUpdates.code = cleanCode;
  }

  if (normalizedUpdates.type === 'percentage' && normalizedUpdates.value && normalizedUpdates.value > 100) {
    return { success: false, error: 'A porcentagem de desconto não pode ser superior a 100%.' };
  }

  const updatedCoupon: AdminCoupon = {
    ...existing[index],
    ...normalizedUpdates,
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase
        .from('coupons')
        .update({
          code: updatedCoupon.code,
          type: updatedCoupon.type,
          value: updatedCoupon.value,
          description: updatedCoupon.description || '',
          min_order_value: updatedCoupon.minOrderValue || 0,
          expires_at: updatedCoupon.expiresAt || null,
          is_active: updatedCoupon.isActive,
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar cupom no Supabase:', error);
        return { success: false, error: 'Falha ao salvar alterações no Supabase.' };
      }

      existing[index] = updatedCoupon;
      saveLocalCoupons(existing);
      return { success: true, coupon: updatedCoupon };
    }
  }

  existing[index] = updatedCoupon;
  const saved = saveLocalCoupons(existing);
  if (!saved) {
    return { success: false, error: 'Falha ao salvar alterações.' };
  }

  return { success: true, coupon: updatedCoupon };
}

/**
 * Deleta um cupom por ID
 */
export async function deleteCoupon(id: string): Promise<{ success: boolean; error?: string }> {
  const existing = await getAllCoupons();
  const filtered = existing.filter((c) => c.id !== id);

  if (filtered.length === existing.length) {
    return { success: false, error: 'Cupom não encontrado para exclusão.' };
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) {
        console.error('Erro ao excluir cupom no Supabase:', error);
        return { success: false, error: 'Falha ao excluir cupom no Supabase.' };
      }
      saveLocalCoupons(filtered);
      return { success: true };
    }
  }

  const saved = saveLocalCoupons(filtered);
  if (!saved) {
    return { success: false, error: 'Falha ao excluir cupom.' };
  }

  return { success: true };
}

/**
 * Valida o cupom para uso no checkout / carrinho
 */
export async function validateCoupon(
  rawCode: string,
  subtotal: number
): Promise<{
  valid: boolean;
  message: string;
  coupon?: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    description: string;
  };
  discountAmount?: number;
}> {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, message: 'Digite o código do cupom.' };
  }

  const coupons = await getAllCoupons();
  const matched = coupons.find((c) => c.code === code);

  if (!matched) {
    return { valid: false, message: 'Cupom inválido ou não encontrado.' };
  }

  if (!matched.isActive) {
    return { valid: false, message: 'Este cupom não está mais ativo.' };
  }

  if (matched.expiresAt) {
    const expDate = new Date(matched.expiresAt);
    if (matched.expiresAt.length === 10) {
      expDate.setHours(23, 59, 59, 999);
    }
    if (Date.now() > expDate.getTime()) {
      const formattedDate = new Date(matched.expiresAt).toLocaleDateString('pt-BR');
      return {
        valid: false,
        message: `Este cupom expirou em ${formattedDate}.`,
      };
    }
  }

  if (matched.minOrderValue && subtotal < matched.minOrderValue) {
    const minFormatted = matched.minOrderValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    return {
      valid: false,
      message: `Este cupom é válido para pedidos a partir de ${minFormatted}.`,
    };
  }

  let discountAmount = 0;
  if (matched.type === 'percentage') {
    discountAmount = Number(((subtotal * matched.value) / 100).toFixed(2));
  } else {
    discountAmount = Math.min(matched.value, subtotal);
  }

  return {
    valid: true,
    message: 'Cupom aplicado com sucesso!',
    coupon: {
      code: matched.code,
      type: matched.type,
      value: matched.value,
      description: matched.description || '',
    },
    discountAmount,
  };
}

import fs from 'fs';
import path from 'path';

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

/**
 * Lê os cupons do arquivo JSON garantindo IDs e campos obrigatórios
 */
export function getAllCoupons(): AdminCoupon[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const items = JSON.parse(raw);

    if (!Array.isArray(items)) return [];

    let hasChanges = false;
    const normalized: AdminCoupon[] = items.map((item, index) => {
      let updated = false;
      const id = item.id || `cupom_${item.code?.toLowerCase() || index}_${Date.now()}`;
      if (!item.id) updated = true;

      const coupon: AdminCoupon = {
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

      if (updated) hasChanges = true;
      return coupon;
    });

    if (hasChanges) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(normalized, null, 2), 'utf8');
    }

    return normalized;
  } catch (error) {
    console.error('Erro ao ler cupons:', error);
    return [];
  }
}

/**
 * Salva a lista de cupons no arquivo JSON
 */
export function saveCoupons(coupons: AdminCoupon[]): boolean {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(coupons, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Erro ao salvar cupons:', error);
    return false;
  }
}

/**
 * Cria um novo cupom
 */
export function createCoupon(data: {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description?: string;
  minOrderValue?: number;
  expiresAt?: string | null;
  isActive?: boolean;
}): { success: boolean; coupon?: AdminCoupon; error?: string } {
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

  const existing = getAllCoupons();
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

  const updatedList = [newCoupon, ...existing];
  const saved = saveCoupons(updatedList);

  if (!saved) {
    return { success: false, error: 'Falha ao salvar no banco de cupons.' };
  }

  return { success: true, coupon: newCoupon };
}

/**
 * Atualiza um cupom existente
 */
export function updateCoupon(
  id: string,
  updates: Partial<Omit<AdminCoupon, 'id' | 'createdAt'>>
): { success: boolean; coupon?: AdminCoupon; error?: string } {
  const existing = getAllCoupons();
  const index = existing.findIndex((c) => c.id === id);

  if (index === -1) {
    return { success: false, error: 'Cupom não encontrado.' };
  }

  if (updates.code) {
    const cleanCode = updates.code.trim().toUpperCase();
    if (cleanCode !== existing[index].code && existing.some((c) => c.code === cleanCode && c.id !== id)) {
      return { success: false, error: `Já existe outro cupom com o código "${cleanCode}".` };
    }
    updates.code = cleanCode;
  }

  if (updates.type === 'percentage' && updates.value && updates.value > 100) {
    return { success: false, error: 'A porcentagem de desconto não pode ser superior a 100%.' };
  }

  const updatedCoupon: AdminCoupon = {
    ...existing[index],
    ...updates,
  };

  existing[index] = updatedCoupon;
  const saved = saveCoupons(existing);

  if (!saved) {
    return { success: false, error: 'Falha ao salvar alterações.' };
  }

  return { success: true, coupon: updatedCoupon };
}

/**
 * Deleta um cupom por ID
 */
export function deleteCoupon(id: string): { success: boolean; error?: string } {
  const existing = getAllCoupons();
  const filtered = existing.filter((c) => c.id !== id);

  if (filtered.length === existing.length) {
    return { success: false, error: 'Cupom não encontrado para exclusão.' };
  }

  const saved = saveCoupons(filtered);
  if (!saved) {
    return { success: false, error: 'Falha ao excluir cupom.' };
  }

  return { success: true };
}

/**
 * Valida o cupom para uso no checkout / carrinho
 */
export function validateCoupon(
  rawCode: string,
  subtotal: number
): {
  valid: boolean;
  message: string;
  coupon?: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    description: string;
  };
  discountAmount?: number;
} {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, message: 'Digite o código do cupom.' };
  }

  const coupons = getAllCoupons();
  const matched = coupons.find((c) => c.code === code);

  if (!matched) {
    return { valid: false, message: 'Cupom inválido ou não encontrado.' };
  }

  if (!matched.isActive) {
    return { valid: false, message: 'Este cupom não está mais ativo.' };
  }

  // Verifica data de expiração se houver
  if (matched.expiresAt) {
    const expDate = new Date(matched.expiresAt);
    if (matched.expiresAt.length === 10) {
      // Se for formato YYYY-MM-DD, considera até as 23:59:59 do dia
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

  // Verifica valor mínimo de compra
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

  // Calcula desconto
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

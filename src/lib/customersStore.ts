import fs from 'fs';
import path from 'path';
import { sql, isDbConfigured } from '@/server/db/client';
import type { ProductionOrder } from '@/types';

export interface CustomerPurchase {
  id: string;
  orderId?: string;
  item: string;
  quantity?: number;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone?: string;
  instagram?: string;
  notes?: string;
  purchases: CustomerPurchase[];
  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'customers.json');

function sortPurchasesDesc(purchases: CustomerPurchase[]): CustomerPurchase[] {
  return [...purchases].sort((a, b) => {
    const tA = new Date(a.date || 0).getTime();
    const tB = new Date(b.date || 0).getTime();
    return tB - tA;
  });
}

function normalizePurchase(raw: any, index = 0): CustomerPurchase {
  return {
    id: String(raw?.id || `comp_${Date.now()}_${index}`),
    ...(raw?.orderId ? { orderId: String(raw.orderId) } : {}),
    item: String(raw?.item || '').trim(),
    quantity: raw?.quantity ? Number(raw.quantity) : undefined,
    amount: Math.max(0, Number(raw?.amount) || 0),
    date: String(raw?.date || new Date().toISOString().slice(0, 10)),
    notes: raw?.notes ? String(raw.notes).trim() : '',
  };
}

function normalizeCustomer(raw: any): CustomerRecord {
  const purchases = Array.isArray(raw?.purchases)
    ? sortPurchasesDesc(raw.purchases.map((p: any, i: number) => normalizePurchase(p, i)))
    : [];

  return {
    id: String(raw?.id),
    name: String(raw?.name || '').trim(),
    phone: raw?.phone ? String(raw.phone).trim() : '',
    instagram: raw?.instagram ? String(raw.instagram).trim().replace(/^@/, '') : '',
    notes: raw?.notes ? String(raw.notes).trim() : '',
    purchases,
    createdAt: String(raw?.created_at || raw?.createdAt || new Date().toISOString()),
    updatedAt: String(raw?.updated_at || raw?.updatedAt || new Date().toISOString()),
  };
}

function readLocalCustomers(): CustomerRecord[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeCustomer);
  } catch (err) {
    console.error('Erro ao ler customers.json local:', err);
    return [];
  }
}

function writeLocalCustomers(customers: CustomerRecord[]): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(customers, null, 2), 'utf-8');
  } catch {
    // Em ambientes somente leitura, ignora falha de escrita local
  }
}

export async function listCustomers(): Promise<CustomerRecord[]> {
  if (isDbConfigured()) {
    try {
      const rows = await sql<any>`
        SELECT id, name, phone, instagram, notes, purchases, created_at, updated_at
        FROM public.customers
        ORDER BY updated_at DESC
      `;

      if (rows) {
        const remote = rows.map(normalizeCustomer);
        const local = readLocalCustomers();

        const remoteIds = new Set(remote.map((r) => r.id));
        const unsynced = local.filter((l) => !remoteIds.has(l.id));

        if (unsynced.length > 0) {
          (async () => {
            for (const u of unsynced) {
              try {
                const purchasesJson = JSON.stringify(u.purchases);
                await sql`
                  INSERT INTO public.customers (
                    id, name, phone, instagram, notes, purchases, created_at, updated_at
                  ) VALUES (
                    ${u.id}, ${u.name}, ${u.phone || ''}, ${u.instagram || ''},
                    ${u.notes || ''}, ${purchasesJson}::jsonb, ${u.createdAt}, ${u.updatedAt}
                  )
                  ON CONFLICT (id) DO UPDATE
                  SET name = EXCLUDED.name, purchases = EXCLUDED.purchases, updated_at = EXCLUDED.updated_at
                `;
              } catch (e) {
                console.error('Erro ao sincronizar cliente local para Neon:', e);
              }
            }
          })();
        }

        const merged = [...unsynced, ...remote];
        writeLocalCustomers(merged);
        return merged;
      }
    } catch (err) {
      console.error('Erro ao buscar fichas de clientes no Neon:', err);
    }
  }

  return readLocalCustomers();
}

async function saveCustomerRecord(record: CustomerRecord): Promise<CustomerRecord> {
  if (isDbConfigured()) {
    try {
      const purchasesJson = JSON.stringify(record.purchases);
      await sql`
        INSERT INTO public.customers (
          id, name, phone, instagram, notes, purchases, created_at, updated_at
        ) VALUES (
          ${record.id}, ${record.name}, ${record.phone || ''}, ${record.instagram || ''},
          ${record.notes || ''}, ${purchasesJson}::jsonb, ${record.createdAt}, ${record.updatedAt}
        )
        ON CONFLICT (id) DO UPDATE
        SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          instagram = EXCLUDED.instagram,
          notes = EXCLUDED.notes,
          purchases = EXCLUDED.purchases,
          updated_at = EXCLUDED.updated_at
      `;
    } catch (err) {
      console.error('Erro ao salvar ficha do cliente no Neon:', err);
    }
  }

  const local = readLocalCustomers();
  const idx = local.findIndex((c) => c.id === record.id);
  if (idx >= 0) {
    local[idx] = record;
  } else {
    local.unshift(record);
  }
  writeLocalCustomers(local);
  return record;
}

export async function createCustomer(input: {
  name: string;
  phone?: string;
  instagram?: string;
  notes?: string;
  initialPurchase?: {
    item: string;
    quantity?: number;
    amount: number;
    date: string;
    notes?: string;
  };
}): Promise<{ success: boolean; customer?: CustomerRecord; error?: string }> {
  const cleanName = (input.name || '').trim();
  if (!cleanName) {
    return { success: false, error: 'O nome do cliente é obrigatório.' };
  }

  const nowIso = new Date().toISOString();
  const purchases: CustomerPurchase[] = [];

  if (input.initialPurchase && input.initialPurchase.item.trim()) {
    purchases.push(
      normalizePurchase({
        id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ...input.initialPurchase,
      })
    );
  }

  const record: CustomerRecord = {
    id: `cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    phone: (input.phone || '').trim(),
    instagram: (input.instagram || '').trim().replace(/^@/, ''),
    notes: (input.notes || '').trim(),
    purchases,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const saved = await saveCustomerRecord(record);
  return { success: true, customer: saved };
}

export async function updateCustomer(
  id: string,
  updates: {
    name?: string;
    phone?: string;
    instagram?: string;
    notes?: string;
  }
): Promise<{ success: boolean; customer?: CustomerRecord; error?: string }> {
  const all = await listCustomers();
  const current = all.find((c) => c.id === id);
  if (!current) {
    return { success: false, error: 'Ficha do cliente não encontrada.' };
  }

  const nextName = updates.name !== undefined ? updates.name.trim() : current.name;
  if (!nextName) {
    return { success: false, error: 'O nome do cliente não pode ficar vazio.' };
  }

  const updated: CustomerRecord = {
    ...current,
    name: nextName,
    phone: updates.phone !== undefined ? updates.phone.trim() : current.phone,
    instagram:
      updates.instagram !== undefined
        ? updates.instagram.trim().replace(/^@/, '')
        : current.instagram,
    notes: updates.notes !== undefined ? updates.notes.trim() : current.notes,
    updatedAt: new Date().toISOString(),
  };

  const saved = await saveCustomerRecord(updated);
  return { success: true, customer: saved };
}

export async function addPurchaseToCustomer(
  customerId: string,
  purchaseInput: {
    item: string;
    quantity?: number;
    amount: number;
    date: string;
    notes?: string;
  }
): Promise<{ success: boolean; customer?: CustomerRecord; error?: string }> {
  const cleanItem = (purchaseInput.item || '').trim();
  if (!cleanItem) {
    return { success: false, error: 'Informe o que o cliente comprou.' };
  }

  const all = await listCustomers();
  const current = all.find((c) => c.id === customerId);
  if (!current) {
    return { success: false, error: 'Ficha do cliente não encontrada.' };
  }

  const newPurchase = normalizePurchase({
    id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    item: cleanItem,
    quantity: purchaseInput.quantity,
    amount: purchaseInput.amount,
    date: purchaseInput.date || new Date().toISOString().slice(0, 10),
    notes: purchaseInput.notes,
  });

  const updated: CustomerRecord = {
    ...current,
    purchases: sortPurchasesDesc([newPurchase, ...current.purchases]),
    updatedAt: new Date().toISOString(),
  };

  const saved = await saveCustomerRecord(updated);
  return { success: true, customer: saved };
}

export async function updatePurchaseInCustomer(
  customerId: string,
  purchaseId: string,
  purchaseUpdates: {
    item?: string;
    quantity?: number;
    amount?: number;
    date?: string;
    notes?: string;
  }
): Promise<{ success: boolean; customer?: CustomerRecord; error?: string }> {
  const all = await listCustomers();
  const current = all.find((c) => c.id === customerId);
  if (!current) {
    return { success: false, error: 'Ficha do cliente não encontrada.' };
  }

  const pIndex = current.purchases.findIndex((p) => p.id === purchaseId);
  if (pIndex === -1) {
    return { success: false, error: 'Compra não encontrada na ficha.' };
  }

  const updatedPurchase = normalizePurchase({
    ...current.purchases[pIndex],
    ...purchaseUpdates,
    id: purchaseId,
  });

  if (!updatedPurchase.item) {
    return { success: false, error: 'A descrição do pedido não pode ficar vazia.' };
  }

  const nextPurchases = [...current.purchases];
  nextPurchases[pIndex] = updatedPurchase;

  const updated: CustomerRecord = {
    ...current,
    purchases: sortPurchasesDesc(nextPurchases),
    updatedAt: new Date().toISOString(),
  };

  const saved = await saveCustomerRecord(updated);
  return { success: true, customer: saved };
}

export async function deletePurchaseFromCustomer(
  customerId: string,
  purchaseId: string
): Promise<{ success: boolean; customer?: CustomerRecord; error?: string }> {
  const all = await listCustomers();
  const current = all.find((c) => c.id === customerId);
  if (!current) {
    return { success: false, error: 'Ficha do cliente não encontrada.' };
  }

  const filtered = current.purchases.filter((p) => p.id !== purchaseId);
  if (filtered.length === current.purchases.length) {
    return { success: false, error: 'Compra não encontrada para exclusão.' };
  }

  const updated: CustomerRecord = {
    ...current,
    purchases: filtered,
    updatedAt: new Date().toISOString(),
  };

  const saved = await saveCustomerRecord(updated);
  return { success: true, customer: saved };
}

export async function deleteCustomer(customerId: string): Promise<{ success: boolean; error?: string }> {
  if (isDbConfigured()) {
    try {
      await sql`DELETE FROM public.customers WHERE id = ${customerId}`;
    } catch (error: any) {
      console.error('Erro ao excluir ficha do cliente no Neon:', error);
      return { success: false, error: `Falha ao excluir no Neon: ${error?.message}` };
    }
  }

  const local = readLocalCustomers();
  const filtered = local.filter((c) => c.id !== customerId);
  writeLocalCustomers(filtered);

  return { success: true };
}

function normalizeNameForMatch(name?: string): string {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePhoneForMatch(phone?: string): string {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }
  return digits.length >= 8 ? digits : '';
}

function formatBrazilDateYMD(iso?: string): string {
  try {
    const dt = iso ? new Date(iso) : new Date();
    if (!Number.isNaN(dt.getTime())) {
      return dt.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    }
  } catch {
    // Fallback
  }
  return (iso || new Date().toISOString()).slice(0, 10);
}

function formatEventDateBR(dateStr?: string): string {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  const parts = clean.slice(0, 10).split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return clean;
}

function describeOrderItem(it: any, includeQtyPrefix: boolean): string {
  const prodName = String(
    it?.product?.name || it?.productName || it?.name || 'Produto personalizado'
  ).trim();
  const qty = Number(it?.quantity) || 1;
  const cust = it?.customization || {};
  const details: string[] = [];

  if (cust.variation) details.push(String(cust.variation).trim());
  if (cust.theme) details.push(`Tema: ${String(cust.theme).trim()}`);
  if (cust.childName) details.push(`Nome: ${String(cust.childName).trim()}`);
  if (cust.ageOrDate) details.push(String(cust.ageOrDate).trim());
  if (cust.ribbonColor) details.push(`Fita: ${String(cust.ribbonColor).trim()}`);

  if (cust.customFieldValues && typeof cust.customFieldValues === 'object') {
    for (const [k, v] of Object.entries(cust.customFieldValues)) {
      if (v && String(v).trim()) {
        details.push(`${k}: ${String(v).trim()}`);
      }
    }
  }

  if (cust.notes) details.push(`Obs: ${String(cust.notes).trim()}`);

  const fullName = details.length > 0 ? `${prodName} (${details.join(', ')})` : prodName;
  return includeQtyPrefix ? `${qty}x ${fullName}` : fullName;
}

function buildPurchaseFromOrder(order: ProductionOrder): CustomerPurchase {
  const itemsList = Array.isArray(order.items) ? order.items : [];
  const multipleItems = itemsList.length > 1;
  const itemSummary =
    itemsList.length > 0
      ? itemsList.map((it) => describeOrderItem(it, multipleItems)).join(' • ')
      : 'Pedido realizado no site';

  const noteParts: string[] = [];
  if (order.event_date) {
    noteParts.push(`Evento: ${formatEventDateBR(order.event_date)}`);
  }
  if (order.delivery_method === 'entrega-correios') {
    noteParts.push('Entrega: Correios');
  } else if (order.delivery_method === 'retirada-paraisopolis') {
    noteParts.push('Retirada: Paraisópolis');
  } else if (order.delivery_method === 'retirada-pouso-alegre') {
    noteParts.push('Retirada: Pouso Alegre');
  }
  if (order.general_notes && order.general_notes.trim()) {
    noteParts.push(order.general_notes.trim());
  }

  const totalUnits =
    Number(order.total_units) ||
    itemsList.reduce((acc, it) => acc + (Number(it?.quantity) || 1), 0) ||
    undefined;

  return normalizePurchase({
    id: `comp_ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    orderId: String(order.id),
    item: itemSummary,
    quantity: totalUnits,
    amount: Number(order.total_amount) || 0,
    date: formatBrazilDateYMD(order.created_at),
    notes: noteParts.join(' • '),
  });
}

function findMatchingCustomer(
  customers: CustomerRecord[],
  name?: string,
  phone?: string
): CustomerRecord | undefined {
  const targetPhone = normalizePhoneForMatch(phone);
  if (targetPhone) {
    const byPhone = customers.find(
      (c) => normalizePhoneForMatch(c.phone) === targetPhone
    );
    if (byPhone) return byPhone;
  }

  const targetName = normalizeNameForMatch(name);
  if (targetName) {
    const byName = customers.find(
      (c) => normalizeNameForMatch(c.name) === targetName
    );
    if (byName) return byName;
  }

  return undefined;
}

export async function syncOrderToCustomerCard(order: ProductionOrder): Promise<{
  action: 'created_customer' | 'added_purchase' | 'updated_purchase' | 'skipped';
  customer?: CustomerRecord;
}> {
  const cleanName = String(order.customer_name || '').trim();
  const cleanPhone = String(order.customer_phone || '').trim();
  if (!cleanName && !normalizePhoneForMatch(cleanPhone)) {
    return { action: 'skipped' };
  }

  const allCustomers = await listCustomers();
  const matched = findMatchingCustomer(allCustomers, cleanName, cleanPhone);
  const purchase = buildPurchaseFromOrder(order);
  const nowIso = new Date().toISOString();

  if (matched) {
    const existingIndex = matched.purchases.findIndex((p) => {
      if (p.orderId && p.orderId === String(order.id)) return true;
      const sameDate = p.date === purchase.date;
      const sameAmount = Math.abs((Number(p.amount) || 0) - purchase.amount) < 0.01;
      const sameItem = normalizeNameForMatch(p.item) === normalizeNameForMatch(purchase.item);
      return sameDate && sameAmount && sameItem;
    });

    let nextPurchases: CustomerPurchase[];
    let action: 'created_customer' | 'added_purchase' | 'updated_purchase';

    if (existingIndex >= 0) {
      const existing = matched.purchases[existingIndex];
      const updatedPurchase: CustomerPurchase = {
        ...purchase,
        id: existing.id,
        orderId: String(order.id),
      };
      nextPurchases = [...matched.purchases];
      nextPurchases[existingIndex] = updatedPurchase;
      action = 'updated_purchase';
    } else {
      nextPurchases = [purchase, ...matched.purchases];
      action = 'added_purchase';
    }

    const updatedRecord: CustomerRecord = {
      ...matched,
      phone: matched.phone || cleanPhone,
      purchases: sortPurchasesDesc(nextPurchases),
      updatedAt: nowIso,
    };

    const saved = await saveCustomerRecord(updatedRecord);
    return { action, customer: saved };
  }

  const newRecord: CustomerRecord = {
    id: `cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName || cleanPhone,
    phone: cleanPhone,
    instagram: '',
    notes: '',
    purchases: [purchase],
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const saved = await saveCustomerRecord(newRecord);
  return { action: 'created_customer', customer: saved };
}

export async function syncOrdersBatchToCustomers(orders: ProductionOrder[]): Promise<{
  customers: CustomerRecord[];
  createdCustomers: number;
  addedPurchases: number;
  updatedPurchases: number;
  skippedOrders: number;
}> {
  const workingCustomers = await listCustomers();
  const touchedIds = new Set<string>();
  let createdCustomers = 0;
  let addedPurchases = 0;
  let updatedPurchases = 0;
  let skippedOrders = 0;

  const chronological = [...orders].sort((a, b) => {
    const tA = new Date(a.created_at || 0).getTime();
    const tB = new Date(b.created_at || 0).getTime();
    return tA - tB;
  });

  for (const order of chronological) {
    const cleanName = String(order.customer_name || '').trim();
    const cleanPhone = String(order.customer_phone || '').trim();
    if (!cleanName && !normalizePhoneForMatch(cleanPhone)) {
      skippedOrders++;
      continue;
    }

    const matched = findMatchingCustomer(workingCustomers, cleanName, cleanPhone);
    const purchase = buildPurchaseFromOrder(order);
    const nowIso = new Date().toISOString();

    if (matched) {
      const existingIndex = matched.purchases.findIndex((p) => {
        if (p.orderId && p.orderId === String(order.id)) return true;
        const sameDate = p.date === purchase.date;
        const sameAmount = Math.abs((Number(p.amount) || 0) - purchase.amount) < 0.01;
        const sameItem = normalizeNameForMatch(p.item) === normalizeNameForMatch(purchase.item);
        return sameDate && sameAmount && sameItem;
      });

      if (existingIndex >= 0) {
        const existing = matched.purchases[existingIndex];
        matched.purchases[existingIndex] = {
          ...purchase,
          id: existing.id,
          orderId: String(order.id),
        };
        matched.purchases = sortPurchasesDesc(matched.purchases);
        matched.updatedAt = nowIso;
        touchedIds.add(matched.id);
        updatedPurchases++;
      } else {
        matched.phone = matched.phone || cleanPhone;
        matched.purchases = sortPurchasesDesc([purchase, ...matched.purchases]);
        matched.updatedAt = nowIso;
        touchedIds.add(matched.id);
        addedPurchases++;
      }
    } else {
      const newRecord: CustomerRecord = {
        id: `cli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName || cleanPhone,
        phone: cleanPhone,
        instagram: '',
        notes: '',
        purchases: [purchase],
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      workingCustomers.unshift(newRecord);
      touchedIds.add(newRecord.id);
      createdCustomers++;
    }
  }

  for (const c of workingCustomers) {
    if (touchedIds.has(c.id)) {
      await saveCustomerRecord(c);
    }
  }

  const refreshed = await listCustomers();
  return {
    customers: refreshed,
    createdCustomers,
    addedPurchases,
    updatedPurchases,
    skippedOrders,
  };
}

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ProductionOrder, OrderStatus } from '@/types';
import { sql, isDbConfigured } from '@/server/db/client';

const ORDERS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'orders.json');
const DELETED_ORDERS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'deleted-orders.json');

/**
 * Normaliza status legados ou com variações de escrita para o padrão do Kanban
 */
export function normalizeStatus(status?: string): OrderStatus {
  if (!status) return 'em_analise';
  const s = status.toLowerCase().trim().replace('-', '_');
  if (
    s === 'em_analise' ||
    s === 'analise' ||
    s === 'aguardando_arte' ||
    s === 'arte_pendente' ||
    s === 'arte_aprovada' ||
    s === 'aprovado' ||
    s === 'pendente'
  ) {
    return 'em_analise';
  }
  if (s === 'em_producao' || s === 'producao' || s === 'produzindo') return 'em_producao';
  if (s === 'pronto' || s === 'pronto_envio' || s === 'pronto_retirada') return 'pronto';
  if (s === 'entregue' || s === 'concluido' || s === 'finalizado') return 'entregue';
  return 'em_analise';
}

function readDeletedOrderIds(): Set<string> {
  try {
    if (!fs.existsSync(DELETED_ORDERS_FILE_PATH)) {
      return new Set();
    }
    const content = fs.readFileSync(DELETED_ORDERS_FILE_PATH, 'utf-8');
    const arr = JSON.parse(content) as string[];
    return new Set(arr.map(String));
  } catch {
    return new Set();
  }
}

function addDeletedOrderId(orderId: string): void {
  try {
    const set = readDeletedOrderIds();
    set.add(String(orderId));
    const dir = path.dirname(DELETED_ORDERS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DELETED_ORDERS_FILE_PATH, JSON.stringify(Array.from(set), null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar deleted-orders.json:', err);
  }
}

function readLocalOrders(): ProductionOrder[] {
  try {
    if (!fs.existsSync(ORDERS_FILE_PATH)) {
      return [];
    }
    const content = fs.readFileSync(ORDERS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(content) as any[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((o) => ({
      ...o,
      status: normalizeStatus(o.status),
      created_at: o.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Erro ao ler orders.json local:', err);
    return [];
  }
}

function writeLocalOrders(orders: ProductionOrder[]): void {
  try {
    const dir = path.dirname(ORDERS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ORDERS_FILE_PATH, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao gravar orders.json local:', err);
  }
}

/**
 * Tenta sincronizar pedidos que foram criados localmente para o Neon
 */
async function syncUnsyncedOrdersToNeon(orders: ProductionOrder[]): Promise<void> {
  if (!isDbConfigured() || orders.length === 0) return;

  for (const ord of orders) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ord.id);
      const orderId = isUuid ? ord.id : crypto.randomUUID();
      const itemsJson = JSON.stringify(ord.items || []);
      const nowIso = ord.created_at || new Date().toISOString();

      await sql`
        INSERT INTO public.orders (
          id, customer_name, customer_phone, event_date, delivery_method,
          delivery_address, general_notes, total_units, total_amount,
          coupon_code, discount_amount, subtotal_amount, status, items,
          created_at, updated_at
        ) VALUES (
          ${orderId}::uuid, ${ord.customer_name}, ${ord.customer_phone || null}, ${ord.event_date || null},
          ${ord.delivery_method}, ${ord.delivery_address || null}, ${ord.general_notes || null},
          ${Number(ord.total_units) || 0}, ${Number(ord.total_amount) || 0},
          ${ord.coupon_code || null}, ${ord.discount_amount || null}, ${ord.subtotal_amount || null},
          ${ord.status}, ${itemsJson}::jsonb, ${nowIso}, ${nowIso}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    } catch {
      // Ignora falha silenciosa para não travar a aplicação
    }
  }
}

/**
 * Busca todos os pedidos no Neon (com fallback e espelhamento local)
 */
export async function getAllProductionOrders(): Promise<{ orders: ProductionOrder[]; source: 'neon' | 'local' }> {
  const deletedIds = readDeletedOrderIds();
  const localOrders = readLocalOrders().filter(
    (o) => !deletedIds.has(String(o.id)) && o.status !== ('cancelado' as any)
  );

  if (isDbConfigured()) {
    try {
      const dbOrders = await sql<any>`
        SELECT 
          id, customer_name, customer_phone, event_date, delivery_method,
          delivery_address, general_notes, total_units, total_amount,
          coupon_code, discount_amount, subtotal_amount, status, items,
          created_at, updated_at
        FROM public.orders
        WHERE status != 'cancelado'
        ORDER BY created_at DESC
      `;

      if (Array.isArray(dbOrders)) {
        const normalizedDbOrders: ProductionOrder[] = dbOrders
          .filter((o) => !deletedIds.has(String(o.id)) && o.status !== 'cancelado')
          .map((o) => ({
            id: String(o.id),
            customer_name: o.customer_name || 'Cliente',
            customer_phone: o.customer_phone || '',
            event_date: o.event_date || '',
            delivery_method: o.delivery_method || 'retirada-pouso-alegre',
            delivery_address: o.delivery_address || '',
            general_notes: o.general_notes || '',
            total_units: Number(o.total_units) || 0,
            total_amount: Number(o.total_amount) || 0,
            coupon_code: o.coupon_code || undefined,
            discount_amount: o.discount_amount ? Number(o.discount_amount) : undefined,
            subtotal_amount: o.subtotal_amount ? Number(o.subtotal_amount) : undefined,
            status: normalizeStatus(o.status),
            items: Array.isArray(o.items) ? o.items : [],
            created_at: o.created_at || new Date().toISOString(),
            updated_at: o.updated_at || undefined,
          }));

        // Mescla pedidos locais que ainda não existam no Neon
        const dbIds = new Set(normalizedDbOrders.map((o) => String(o.id)));
        const unsyncedLocal = localOrders.filter((local) => {
          if (dbIds.has(String(local.id))) return false;
          const localTime = new Date(local.created_at).getTime();
          const hasMatchingDb = normalizedDbOrders.some((db) => {
            const dbTime = new Date(db.created_at).getTime();
            return (
              db.customer_name === local.customer_name &&
              Math.abs(db.total_amount - local.total_amount) < 0.01 &&
              Math.abs(dbTime - localTime) < 15000
            );
          });
          return !hasMatchingDb;
        });

        const merged = [...unsyncedLocal, ...normalizedDbOrders].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        writeLocalOrders(merged);

        if (unsyncedLocal.length > 0) {
          syncUnsyncedOrdersToNeon(unsyncedLocal).catch(() => {});
        }

        return { orders: merged, source: 'neon' };
      }
    } catch (err) {
      console.error('Falha ao consultar pedidos no Neon, usando arquivo local como fallback:', err);
    }
  }

  const sorted = [...localOrders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return { orders: sorted, source: 'local' };
}

/**
 * Salva um novo pedido com UUID seguro no Neon e espelho local
 */
export async function createProductionOrder(orderData: {
  customerName: string;
  customerPhone?: string;
  eventDate?: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  generalNotes?: string;
  totalUnits: number;
  totalAmount: number;
  couponCode?: string;
  discountAmount?: number;
  subtotalAmount?: number;
  items: any[];
  status?: OrderStatus;
}): Promise<ProductionOrder> {
  const newId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  const newOrder: ProductionOrder = {
    id: newId,
    customer_name: orderData.customerName,
    customer_phone: orderData.customerPhone || '',
    event_date: orderData.eventDate || '',
    delivery_method: orderData.deliveryMethod || 'retirada-pouso-alegre',
    delivery_address: orderData.deliveryAddress || '',
    general_notes: orderData.generalNotes || '',
    total_units: Number(orderData.totalUnits) || 0,
    total_amount: Number(orderData.totalAmount) || 0,
    coupon_code: orderData.couponCode || undefined,
    discount_amount: orderData.discountAmount !== undefined ? Number(orderData.discountAmount) : undefined,
    subtotal_amount: orderData.subtotalAmount !== undefined ? Number(orderData.subtotalAmount) : undefined,
    status: normalizeStatus(orderData.status),
    items: orderData.items || [],
    created_at: nowIso,
  };

  if (isDbConfigured()) {
    try {
      const itemsJson = JSON.stringify(newOrder.items);
      const inserted = await sql<{ id: string }>`
        INSERT INTO public.orders (
          id, customer_name, customer_phone, event_date, delivery_method,
          delivery_address, general_notes, total_units, total_amount,
          coupon_code, discount_amount, subtotal_amount, status, items,
          created_at, updated_at
        ) VALUES (
          ${newOrder.id}::uuid, ${newOrder.customer_name}, ${newOrder.customer_phone || null},
          ${newOrder.event_date || null}, ${newOrder.delivery_method}, ${newOrder.delivery_address || null},
          ${newOrder.general_notes || null}, ${newOrder.total_units}, ${newOrder.total_amount},
          ${newOrder.coupon_code || null}, ${newOrder.discount_amount || null}, ${newOrder.subtotal_amount || null},
          ${newOrder.status}, ${itemsJson}::jsonb, ${nowIso}, ${nowIso}
        )
        RETURNING id
      `;

      if (inserted && inserted[0]?.id) {
        newOrder.id = String(inserted[0].id);
      }
    } catch (err) {
      console.error('Erro ao salvar pedido no Neon:', err);
    }
  }

  const currentOrders = readLocalOrders().filter((o) => String(o.id) !== String(newOrder.id));
  currentOrders.unshift(newOrder);
  writeLocalOrders(currentOrders);

  return newOrder;
}

/**
 * Atualiza o status e/ou notas de produção de um pedido no Neon
 */
export async function updateProductionOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  generalNotes?: string
): Promise<ProductionOrder | null> {
  const currentOrders = readLocalOrders();
  const index = currentOrders.findIndex((o) => String(o.id) === String(orderId));
  const normalized = normalizeStatus(newStatus);
  const nowIso = new Date().toISOString();

  let updatedOrder: ProductionOrder | null = null;

  if (index >= 0) {
    currentOrders[index] = {
      ...currentOrders[index],
      status: normalized,
      ...(generalNotes !== undefined ? { general_notes: generalNotes } : {}),
      updated_at: nowIso,
    };
    updatedOrder = currentOrders[index];
    writeLocalOrders(currentOrders);
  }

  if (isDbConfigured()) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      if (isUuid) {
        let rows: any[] = [];
        if (generalNotes !== undefined) {
          rows = await sql`
            UPDATE public.orders
            SET status = ${normalized}, general_notes = ${generalNotes}, updated_at = ${nowIso}
            WHERE id = ${orderId}::uuid
            RETURNING *
          `;
        } else {
          rows = await sql`
            UPDATE public.orders
            SET status = ${normalized}, updated_at = ${nowIso}
            WHERE id = ${orderId}::uuid
            RETURNING *
          `;
        }

        if (rows.length > 0) {
          const data = rows[0];
          updatedOrder = {
            id: String(data.id),
            customer_name: data.customer_name,
            customer_phone: data.customer_phone || '',
            event_date: data.event_date || '',
            delivery_method: data.delivery_method || 'retirada-pouso-alegre',
            delivery_address: data.delivery_address || '',
            general_notes: data.general_notes || '',
            total_units: Number(data.total_units) || 0,
            total_amount: Number(data.total_amount) || 0,
            status: normalizeStatus(data.status),
            items: Array.isArray(data.items) ? data.items : [],
            created_at: data.created_at || nowIso,
            updated_at: data.updated_at || nowIso,
          };
        }
      }
    } catch (err) {
      console.error('Erro ao sincronizar status do pedido no Neon:', err);
    }
  }

  return updatedOrder;
}

/**
 * Remove permanentemente um pedido do painel, do arquivo local e do Neon
 */
export async function deleteProductionOrder(orderId: string): Promise<boolean> {
  addDeletedOrderId(orderId);

  const currentOrders = readLocalOrders();
  const filtered = currentOrders.filter((o) => String(o.id) !== String(orderId));
  if (filtered.length !== currentOrders.length) {
    writeLocalOrders(filtered);
  }

  if (isDbConfigured()) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      if (isUuid) {
        await sql`
          UPDATE public.orders
          SET status = 'cancelado', updated_at = NOW()
          WHERE id = ${orderId}::uuid
        `;
        await sql`DELETE FROM public.orders WHERE id = ${orderId}::uuid`;
      }
    } catch (err) {
      console.error('Erro ao deletar pedido no Neon:', err);
    }
  }

  return true;
}

export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits.slice(2);
  }
  return digits;
}

export async function hasCustomerCompletedOrders(phone: string): Promise<boolean> {
  const cleanTarget = cleanPhoneNumber(phone);
  if (!cleanTarget || cleanTarget.length < 8) return false;

  const { orders } = await getAllProductionOrders();
  const lastTargetDigits = cleanTarget.slice(-8);

  return orders.some((order) => {
    const cleanOrderPhone = cleanPhoneNumber(order.customer_phone);
    if (!cleanOrderPhone || cleanOrderPhone.length < 8) return false;
    return (
      cleanOrderPhone === cleanTarget ||
      cleanOrderPhone.endsWith(lastTargetDigits) ||
      cleanTarget.endsWith(cleanOrderPhone.slice(-8))
    );
  });
}

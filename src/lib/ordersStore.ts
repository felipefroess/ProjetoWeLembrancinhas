import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ProductionOrder, OrderStatus } from '@/types';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

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
 * Tenta sincronizar pedidos que foram criados localmente para o Supabase
 */
async function syncUnsyncedOrdersToSupabase(orders: ProductionOrder[]): Promise<void> {
  if (!isSupabaseConfigured() || orders.length === 0) return;
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  for (const ord of orders) {
    try {
      const payload: any = {
        customer_name: ord.customer_name,
        customer_phone: ord.customer_phone || null,
        event_date: ord.event_date || null,
        delivery_method: ord.delivery_method,
        delivery_address: ord.delivery_address || null,
        general_notes: ord.general_notes || null,
        total_units: ord.total_units,
        total_amount: ord.total_amount,
        status: ord.status,
        items: ord.items,
      };

      // Se o ID já for UUID válido, preserva no banco
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ord.id);
      if (isUuid) {
        payload.id = ord.id;
      }

      const { data, error } = await supabase
        .from('orders')
        .insert(payload)
        .select('id')
        .maybeSingle();

      if (!error && data?.id && data.id !== ord.id) {
        ord.id = String(data.id);
      }
    } catch {
      // Ignora falha silenciosa para não travar a aplicação
    }
  }
}

/**
 * Busca todos os pedidos com redundância dupla (Supabase + Local),
 * espelhando automaticamente os dados para nunca perder pedidos.
 */
export async function getAllProductionOrders(): Promise<{ orders: ProductionOrder[]; source: 'supabase' | 'local' }> {
  const deletedIds = readDeletedOrderIds();
  const localOrders = readLocalOrders().filter(
    (o) => !deletedIds.has(String(o.id)) && o.status !== ('cancelado' as any)
  );

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: dbOrders, error } = await supabase
          .from('orders')
          .select('*')
          .neq('status', 'cancelado')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(dbOrders)) {
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
              status: normalizeStatus(o.status),
              items: Array.isArray(o.items) ? o.items : [],
              created_at: o.created_at || new Date().toISOString(),
              updated_at: o.updated_at || undefined,
            }));

          // Mescla pedidos locais que ainda não existam no Supabase
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

          // Espelho local: mantém orders.json sempre sincronizado com o Supabase
          writeLocalOrders(merged);

          // Se houver pedidos locais não salvos no Supabase, sincroniza em segundo plano
          if (unsyncedLocal.length > 0) {
            syncUnsyncedOrdersToSupabase(unsyncedLocal).catch(() => {});
          }

          return { orders: merged, source: 'supabase' };
        }
      }
    } catch (err) {
      console.error('Falha ao consultar pedidos no Supabase, usando arquivo local como fallback:', err);
    }
  }

  // Ordena por data de criação descrescente (fallback local)
  const sorted = [...localOrders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return { orders: sorted, source: 'local' };
}

/**
 * Salva um novo pedido com UUID seguro no arquivo local e no Supabase
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
    status: normalizeStatus(orderData.status),
    items: orderData.items || [],
    created_at: nowIso,
  };

  // Se Supabase estiver configurado, salva no banco com o mesmo UUID
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: inserted, error } = await supabase
          .from('orders')
          .insert({
            id: newOrder.id,
            customer_name: newOrder.customer_name,
            customer_phone: newOrder.customer_phone || null,
            event_date: newOrder.event_date || null,
            delivery_method: newOrder.delivery_method,
            delivery_address: newOrder.delivery_address || null,
            general_notes: newOrder.general_notes || null,
            total_units: newOrder.total_units,
            total_amount: newOrder.total_amount,
            status: newOrder.status,
            items: newOrder.items,
          })
          .select('id')
          .maybeSingle();

        if (error) {
          console.error('Erro retornado pelo Supabase ao inserir pedido:', error);
        } else if (inserted?.id) {
          newOrder.id = String(inserted.id);
        }
      }
    } catch (err) {
      console.error('Erro ao sincronizar pedido criado com Supabase:', err);
    }
  }

  // Salva no arquivo local imediatamente (evita duplicações)
  const currentOrders = readLocalOrders().filter((o) => String(o.id) !== String(newOrder.id));
  currentOrders.unshift(newOrder);
  writeLocalOrders(currentOrders);

  return newOrder;
}

/**
 * Atualiza o status e/ou notas de produção de um pedido
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

  // Sincroniza atualização com o Supabase se configurado
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const updatePayload: any = {
          status: normalized,
          updated_at: nowIso,
        };
        if (generalNotes !== undefined) {
          updatePayload.general_notes = generalNotes;
        }

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
        if (isUuid) {
          const { data, error } = await supabase
            .from('orders')
            .update(updatePayload)
            .eq('id', orderId)
            .select('*')
            .maybeSingle();

          if (!error && data) {
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
      }
    } catch (err) {
      console.error('Erro ao sincronizar status do pedido no Supabase:', err);
    }
  }

  return updatedOrder;
}

/**
 * Remove permanentemente um pedido do painel, do arquivo local e do Supabase
 */
export async function deleteProductionOrder(orderId: string): Promise<boolean> {
  // 1. Registra o ID como excluído permanentemente
  addDeletedOrderId(orderId);

  // 2. Remove do arquivo local
  const currentOrders = readLocalOrders();
  const filtered = currentOrders.filter((o) => String(o.id) !== String(orderId));
  if (filtered.length !== currentOrders.length) {
    writeLocalOrders(filtered);
  }

  // 3. Marca como cancelado e tenta deletar no Supabase
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
        if (isUuid) {
          // Marca como cancelado
          await supabase
            .from('orders')
            .update({ 
              status: 'cancelado',
              updated_at: new Date().toISOString() 
            })
            .eq('id', orderId);

          // Tenta também a remoção física
          await supabase.from('orders').delete().eq('id', orderId);
        }
      }
    } catch (err) {
      console.error('Erro ao deletar pedido no Supabase:', err);
    }
  }

  return true;
}

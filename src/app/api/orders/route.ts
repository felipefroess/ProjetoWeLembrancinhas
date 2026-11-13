import { NextResponse } from 'next/server';
import { 
  getAllProductionOrders, 
  createProductionOrder, 
  updateProductionOrderStatus, 
  deleteProductionOrder 
} from '@/lib/ordersStore';
import { syncOrderToCustomerCard } from '@/lib/customersStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { OrderStatus } from '@/types';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
};

// GET: Buscar pedidos para o painel Admin e Kanban
export async function GET(request: Request) {
  try {
    const { orders, source } = await getAllProductionOrders();
    return NextResponse.json(
      { 
        success: true, 
        orders, 
        configured: isSupabaseConfigured(),
        source 
      },
      {
        headers: NO_CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar pedidos' }, 
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// POST: Salvar pedido gerado no checkout ou cadastrado manualmente
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customerName,
      customerPhone,
      eventDate,
      deliveryMethod,
      deliveryAddress,
      generalNotes,
      totalUnits,
      totalAmount,
      couponCode,
      discountAmount,
      subtotalAmount,
      items,
      status,
    } = body;

    if (!customerName) {
      return NextResponse.json(
        { success: false, error: 'Nome do cliente é obrigatório' }, 
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const created = await createProductionOrder({
      customerName,
      customerPhone,
      eventDate,
      deliveryMethod,
      deliveryAddress,
      generalNotes,
      totalUnits: Number(totalUnits) || 0,
      totalAmount: Number(totalAmount) || 0,
      couponCode: couponCode ? String(couponCode).trim() : undefined,
      discountAmount: discountAmount !== undefined ? Number(discountAmount) : undefined,
      subtotalAmount: subtotalAmount !== undefined ? Number(subtotalAmount) : undefined,
      items: items || [],
      status: status as OrderStatus,
    });

    // Se o pedido já nascer ou for cadastrado como entregue, arquiva na ficha do cliente
    let customerSyncResult: any = null;
    if (created.status === 'entregue') {
      try {
        customerSyncResult = await syncOrderToCustomerCard(created);
      } catch (syncError) {
        console.error('Aviso: falha ao sincronizar pedido na ficha do cliente:', syncError);
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        orderId: created.id, 
        order: created,
        saved: true,
        customerSynced: Boolean(customerSyncResult && customerSyncResult.action !== 'skipped'),
        customerAction: customerSyncResult?.action,
        customerName: customerSyncResult?.customer?.name || created.customer_name,
      },
      {
        headers: NO_CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error('Erro ao processar pedido:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno' }, 
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// PATCH: Atualizar status ou observações de um pedido no Kanban
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, generalNotes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID e status são obrigatórios para atualização' 
        }, 
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const updated = await updateProductionOrderStatus(id, status as OrderStatus, generalNotes);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Pedido não encontrado' }, 
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    // Se o pedido foi colocado como ENTREGUE, envia e salva permanentemente na ficha do cliente
    let customerSyncResult: {
      action: 'created_customer' | 'added_purchase' | 'updated_purchase' | 'skipped';
      customer?: any;
    } | null = null;

    if (updated.status === 'entregue') {
      try {
        customerSyncResult = await syncOrderToCustomerCard(updated);
      } catch (syncErr) {
        console.error('Erro ao sincronizar pedido entregue na ficha do cliente:', syncErr);
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        order: updated,
        customerSynced: Boolean(customerSyncResult && customerSyncResult.action !== 'skipped'),
        customerAction: customerSyncResult?.action,
        customerName: customerSyncResult?.customer?.name || updated.customer_name,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar pedido' }, 
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// DELETE: Remover um pedido
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do pedido não informado' }, 
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    await deleteProductionOrder(id);
    return NextResponse.json(
      { success: true },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('Erro ao remover pedido:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao remover pedido' }, 
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

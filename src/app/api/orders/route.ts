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

// GET: Buscar pedidos para o painel Admin e Kanban
export async function GET() {
  try {
    const { orders, source } = await getAllProductionOrders();
    return NextResponse.json({ 
      success: true, 
      orders, 
      configured: isSupabaseConfigured(),
      source 
    });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar pedidos' }, { status: 500 });
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
      items,
      status,
    } = body;

    if (!customerName) {
      return NextResponse.json({ success: false, error: 'Nome do cliente é obrigatório' }, { status: 400 });
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
      items: items || [],
      status: status as OrderStatus,
    });

    // Registra ou atualiza automaticamente a ficha do cliente (por telefone ou nome)
    try {
      await syncOrderToCustomerCard(created);
    } catch (syncError) {
      console.error('Aviso: falha ao sincronizar pedido na ficha do cliente:', syncError);
    }

    return NextResponse.json({ 
      success: true, 
      orderId: created.id, 
      order: created,
      saved: true 
    });
  } catch (error) {
    console.error('Erro ao processar pedido:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

// PATCH: Atualizar status ou observações de um pedido no Kanban
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, generalNotes } = body;

    if (!id || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID e status são obrigatórios para atualização' 
      }, { status: 400 });
    }

    const updated = await updateProductionOrderStatus(id, status as OrderStatus, generalNotes);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Pedido não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar pedido' }, { status: 500 });
  }
}

// DELETE: Remover um pedido
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do pedido não informado' }, { status: 400 });
    }

    await deleteProductionOrder(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover pedido:', error);
    return NextResponse.json({ success: false, error: 'Erro ao remover pedido' }, { status: 500 });
  }
}

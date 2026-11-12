import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  addPurchaseToCustomer,
  updatePurchaseInCustomer,
  deletePurchaseFromCustomer,
  deleteCustomer,
  syncOrdersBatchToCustomers,
} from '@/lib/customersStore';
import { getAllProductionOrders } from '@/lib/ordersStore';

export async function GET() {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const customers = await listCustomers();
    return NextResponse.json({ success: true, customers });
  } catch (error) {
    console.error('Erro ao listar fichas de clientes:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar fichas de clientes.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.action === 'sync_orders') {
      const { orders } = await getAllProductionOrders();
      const summary = await syncOrdersBatchToCustomers(orders);
      return NextResponse.json({
        success: true,
        ...summary,
      });
    }

    if (body.action === 'add_purchase') {
      const result = await addPurchaseToCustomer(body.customerId, {
        item: body.item,
        quantity: body.quantity ? Number(body.quantity) : undefined,
        amount: Number(body.amount) || 0,
        date: body.date,
        notes: body.notes,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Erro ao registrar compra.' },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, customer: result.customer });
    }

    const result = await createCustomer({
      name: body.name,
      phone: body.phone,
      instagram: body.instagram,
      notes: body.notes,
      initialPurchase: body.initialPurchase,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Erro ao criar ficha do cliente.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, customer: result.customer });
  } catch (error) {
    console.error('Erro ao cadastrar cliente/compra:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar cadastro do cliente.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.action === 'update_purchase') {
      const result = await updatePurchaseInCustomer(body.customerId, body.purchaseId, {
        item: body.item,
        quantity: body.quantity !== undefined ? Number(body.quantity) : undefined,
        amount: body.amount !== undefined ? Number(body.amount) : undefined,
        date: body.date,
        notes: body.notes,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Erro ao atualizar compra.' },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, customer: result.customer });
    }

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID do cliente não informado.' },
        { status: 400 }
      );
    }

    const result = await updateCustomer(body.id, {
      name: body.name,
      phone: body.phone,
      instagram: body.instagram,
      notes: body.notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Erro ao atualizar ficha.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, customer: result.customer });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar ficha do cliente.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const purchaseId = searchParams.get('purchaseId');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do cliente não informado.' },
        { status: 400 }
      );
    }

    if (purchaseId) {
      const result = await deletePurchaseFromCustomer(id, purchaseId);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Erro ao excluir compra.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, customer: result.customer });
    }

    const result = await deleteCustomer(id);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Erro ao excluir ficha.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir cliente/compra:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir registro.' },
      { status: 500 }
    );
  }
}

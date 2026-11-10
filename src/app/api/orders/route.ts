import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// POST: Salvar pedido gerado no checkout
export async function POST(request: Request) {
  try {
    const orderData = await request.json();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ 
        success: true, 
        message: 'Supabase ainda não configurado, pedido processado apenas localmente.',
        saved: false 
      });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: true, saved: false });
    }

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
    } = orderData;

    const { data, error } = await supabase.from('orders').insert({
      customer_name: customerName,
      customer_phone: customerPhone || null,
      event_date: eventDate || null,
      delivery_method: deliveryMethod || 'retirada-pouso-alegre',
      delivery_address: deliveryAddress || null,
      general_notes: generalNotes || null,
      total_units: Number(totalUnits) || 0,
      total_amount: Number(totalAmount) || 0,
      status: 'pendente',
      items: items || [],
    }).select('id').single();

    if (error) {
      console.error('Erro ao salvar pedido no Supabase:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, orderId: data?.id, saved: true });
  } catch (error) {
    console.error('Erro ao processar pedido:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

// GET: Buscar pedidos para o painel Admin
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ orders: [], configured: false });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ orders: [], configured: false });
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pedidos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [], configured: true });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

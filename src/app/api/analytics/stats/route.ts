import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { AnalyticsPeriod } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  try {
    const period = (request.nextUrl.searchParams.get('period') || 'mes') as AnalyticsPeriod;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ configured: false, hasRealData: false });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ configured: false, hasRealData: false });
    }

    // Define data de corte
    const now = new Date();
    let startDate: Date;
    if (period === 'semana') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'ano') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    const isoStart = startDate.toISOString();

    // 1. Visitas
    const { count: visitsCount } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', isoStart);

    // 2. Pedidos
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', isoStart)
      .neq('status', 'cancelado');

    const totalRevenue = (orders || []).reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
    const unitsSold = (orders || []).reduce((acc, o) => acc + (Number(o.total_units) || 0), 0);
    const ordersCount = (orders || []).length;

    // 3. Cliques em produtos
    const { data: clicks } = await supabase
      .from('product_clicks')
      .select('product_id, product_name, category')
      .gte('created_at', isoStart);

    const clicksByProduct: Record<string, { count: number; name?: string; category?: string }> = {};
    (clicks || []).forEach((c) => {
      if (!clicksByProduct[c.product_id]) {
        clicksByProduct[c.product_id] = { count: 0, name: c.product_name, category: c.category };
      }
      clicksByProduct[c.product_id].count += 1;
    });

    let mostClickedId: string | null = null;
    let maxClicks = 0;
    Object.entries(clicksByProduct).forEach(([pId, data]) => {
      if (data.count > maxClicks) {
        maxClicks = data.count;
        mostClickedId = pId;
      }
    });

    // 4. Produtos mais vendidos a partir dos itens dos pedidos
    const salesByProduct: Record<string, { units: number; revenue: number; name: string }> = {};
    (orders || []).forEach((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((item: any) => {
        const pId = item.product?.id || item.productId || 'item';
        const pName = item.product?.name || item.name || 'Lembrancinha';
        const qty = Number(item.quantity) || 1;
        const subtotal = Number(item.subtotal) || (qty * (Number(item.product?.price) || 0));

        if (!salesByProduct[pId]) {
          salesByProduct[pId] = { units: 0, revenue: 0, name: pName };
        }
        salesByProduct[pId].units += qty;
        salesByProduct[pId].revenue += subtotal;
      });
    });

    const hasRealData = Boolean(
      (visitsCount && visitsCount > 0) ||
      ordersCount > 0 ||
      (clicks && clicks.length > 0)
    );

    return NextResponse.json({
      configured: true,
      hasRealData,
      period,
      totalRevenue,
      unitsSold,
      visits: visitsCount || 0,
      ordersCount,
      mostClicked: mostClickedId ? {
        productId: mostClickedId,
        clicks: maxClicks,
        name: clicksByProduct[mostClickedId]?.name,
      } : null,
      salesByProduct,
      clicksByProduct,
    });
  } catch (error) {
    console.error('Erro ao calcular analytics reais:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

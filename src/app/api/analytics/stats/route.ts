import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { AnalyticsPeriod, TopProductStat } from '@/lib/analytics';
import { getAllProductionOrders } from '@/lib/ordersStore';

function formatGrowth(current: number, previous: number): string | null {
  if (previous <= 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

function aggregateOrders(
  orders: any[],
  clicksByProduct: Record<string, { count: number; name?: string; category?: string }>
) {
  const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
  const unitsSold = orders.reduce((acc, o) => acc + (Number(o.total_units) || 0), 0);
  const ordersCount = orders.length;

  const salesByProduct: Record<
    string,
    { units: number; revenue: number; name: string; category: string; image: string; price: number }
  > = {};

  orders.forEach((o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach((item: any) => {
      const pId = String(item.product?.id || item.productId || 'item');
      const pName = item.product?.name || item.name || 'Lembrancinha';
      const pCategory = item.product?.category || 'geral';
      const pImage = item.product?.image || '/images/placeholder.jpg';
      const pPrice = Number(item.product?.price) || 0;
      const qty = Number(item.quantity) || 1;
      const subtotal = Number(item.subtotal) || qty * pPrice;

      if (!salesByProduct[pId]) {
        salesByProduct[pId] = {
          units: 0,
          revenue: 0,
          name: pName,
          category: pCategory,
          image: pImage,
          price: pPrice,
        };
      }
      salesByProduct[pId].units += qty;
      salesByProduct[pId].revenue += subtotal;
    });
  });

  const topSellingProducts: TopProductStat[] = Object.entries(salesByProduct)
    .map(([id, data]) => ({
      id,
      name: data.name,
      category: data.category,
      image: data.image,
      price: data.price > 0 ? data.price : data.units > 0 ? data.revenue / data.units : 0,
      unitsSold: data.units,
      revenue: data.revenue,
      sharePercentage: unitsSold > 0 ? Math.round((data.units / unitsSold) * 100) : 0,
      clicks: clicksByProduct[id]?.count || 0,
    }))
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  return { totalRevenue, unitsSold, ordersCount, salesByProduct, topSellingProducts };
}

export async function GET(request: NextRequest) {
  try {
    const period = (request.nextUrl.searchParams.get('period') || 'mes') as AnalyticsPeriod;

    const now = new Date();
    const durationMs =
      period === 'semana'
        ? 7 * 24 * 60 * 60 * 1000
        : period === 'ano'
          ? 365 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;

    const startDate = new Date(now.getTime() - durationMs);
    const prevStartDate = new Date(startDate.getTime() - durationMs);
    const isoStart = startDate.toISOString();
    const prevIsoStart = prevStartDate.toISOString();

    if (!isSupabaseConfigured()) {
      const { orders: allLocalOrders } = await getAllProductionOrders();
      const currentOrders = allLocalOrders.filter(
        (o) => new Date(o.created_at).getTime() >= startDate.getTime()
      );
      const prevOrders = allLocalOrders.filter((o) => {
        const t = new Date(o.created_at).getTime();
        return t >= prevStartDate.getTime() && t < startDate.getTime();
      });

      const { totalRevenue, unitsSold, ordersCount, salesByProduct, topSellingProducts } =
        aggregateOrders(currentOrders, {});
      const prevRevenue = prevOrders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
      const prevUnits = prevOrders.reduce((acc, o) => acc + (Number(o.total_units) || 0), 0);

      return NextResponse.json({
        configured: false,
        hasRealData: ordersCount > 0,
        period,
        totalRevenue,
        unitsSold,
        visits: 0,
        ordersCount,
        growthRevenue: formatGrowth(totalRevenue, prevRevenue),
        growthUnits: formatGrowth(unitsSold, prevUnits),
        growthVisits: null,
        mostClicked: null,
        salesByProduct,
        topSellingProducts,
        clicksByProduct: {},
      });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ configured: false, hasRealData: false });
    }

    // Executa todas as consultas de métricas no Supabase em paralelo
    const [
      { count: visitsCount },
      { count: prevVisitsCount },
      { data: orders },
      { data: prevOrders },
      { data: clicks },
    ] = await Promise.all([
      supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', isoStart),
      supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', prevIsoStart)
        .lt('created_at', isoStart),
      supabase
        .from('orders')
        .select('*')
        .gte('created_at', isoStart)
        .neq('status', 'cancelado'),
      supabase
        .from('orders')
        .select('total_amount, total_units')
        .gte('created_at', prevIsoStart)
        .lt('created_at', isoStart)
        .neq('status', 'cancelado'),
      supabase
        .from('product_clicks')
        .select('product_id, product_name, category')
        .gte('created_at', isoStart),
    ]);

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

    const { totalRevenue, unitsSold, ordersCount, salesByProduct, topSellingProducts } =
      aggregateOrders(orders || [], clicksByProduct);

    const prevRevenue = (prevOrders || []).reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
    const prevUnits = (prevOrders || []).reduce((acc, o) => acc + (Number(o.total_units) || 0), 0);

    const mostClickedUnits = mostClickedId ? salesByProduct[mostClickedId]?.units || 0 : 0;

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
      growthRevenue: formatGrowth(totalRevenue, prevRevenue),
      growthUnits: formatGrowth(unitsSold, prevUnits),
      growthVisits: formatGrowth(visitsCount || 0, prevVisitsCount || 0),
      mostClicked: mostClickedId
        ? {
            productId: mostClickedId,
            clicks: maxClicks,
            name: clicksByProduct[mostClickedId]?.name,
            unitsSold: mostClickedUnits,
          }
        : null,
      salesByProduct,
      topSellingProducts,
      clicksByProduct,
    });
  } catch (error) {
    console.error('Erro ao calcular analytics reais:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

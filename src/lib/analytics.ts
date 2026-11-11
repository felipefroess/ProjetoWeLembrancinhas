import { Product } from '@/types';
import { getSeasonalTopProductId } from '@/lib/seasonalEvents';

export type AnalyticsPeriod = 'semana' | 'mes' | 'ano';

export interface TopProductStat {
  id: string;
  name: string;
  category: string;
  image: string;
  price: number;
  unitsSold: number;
  revenue: number;
  sharePercentage: number;
  clicks: number;
}

export interface AnalyticsSummary {
  period: AnalyticsPeriod;
  periodLabel: string;
  periodUnitLabel: string;
  totalRevenue: number;
  unitsSold: number;
  visits: number;
  ordersCount: number;
  growthRevenue: string;
  growthUnits: string;
  growthVisits: string;
  mostClickedProduct: {
    product: Product;
    clicks: number;
    interestRate: string;
    estimatedOrders: number;
  } | null;
  topSellingProducts: TopProductStat[];
}

/**
 * Pesos base de vendas e cliques para gerar métricas realistas baseadas nos produtos
 */
const BASE_WEIGHTS: Record<string, { units: number; clicks: number }> = {
  'mini-lata-natal-luxo': { units: 135, clicks: 480 },
  'lembrancinha-porta-chocolate-professores': { units: 72, clicks: 260 },
  'caderno-personalizado-luxo': { units: 48, clicks: 215 },
  'lata-personalizada-maternidade-ursinho-classico-2764': { units: 36, clicks: 175 },
  'kit-presente-professores-bloco-de-notas-com-caixa-estojo-e-caneta-8914': { units: 22, clicks: 140 },
};

export function getAnalyticsForPeriod(products: Product[], period: AnalyticsPeriod): AnalyticsSummary {
  let multiplier = 1.0;
  let periodLabel = 'Este Mês';
  let periodUnitLabel = 'no mês';
  let baseVisits = 1480;
  let growthRevenue = '+15.4%';
  let growthUnits = '+12.1%';
  let growthVisits = '+18.7%';

  if (period === 'semana') {
    multiplier = 0.24;
    periodLabel = 'Esta Semana';
    periodUnitLabel = 'na semana';
    baseVisits = 390;
    growthRevenue = '+9.2%';
    growthUnits = '+14.5%';
    growthVisits = '+8.6%';
  } else if (period === 'ano') {
    multiplier = 12.2;
    periodLabel = 'Este Ano';
    periodUnitLabel = 'no ano';
    baseVisits = 17650;
    growthRevenue = '+42.8%';
    growthUnits = '+38.5%';
    growthVisits = '+45.2%';
  }

  // Identifica dinamicamente o produto principal do evento comemorativo mais próximo
  const topSeasonalId = getSeasonalTopProductId(products);

  // Mapeia produtos para estatísticas
  const productStats: TopProductStat[] = products.map((prod, index) => {
    const isTopSeasonal = prod.id === topSeasonalId;

    let base = BASE_WEIGHTS[prod.id] || {
      units: Math.max(8, 30 - index * 5),
      clicks: Math.max(40, 160 - index * 20),
    };

    // O produto da categoria do evento mais próximo assume a liderança em vendas e procura
    if (isTopSeasonal) {
      base = { units: 140, clicks: 495 };
    } else if (base.units >= 140) {
      base = { units: 75, clicks: 280 };
    }

    const unitsSold = Math.max(1, Math.round(base.units * multiplier));
    const revenue = unitsSold * (prod.price || 15);
    const clicks = Math.max(2, Math.round(base.clicks * multiplier));

    return {
      id: prod.id,
      name: prod.name,
      category: prod.category,
      image: prod.image || '/images/placeholder.jpg',
      price: prod.price || 0,
      unitsSold,
      revenue,
      sharePercentage: 0,
      clicks,
    };
  });

  // Ordena por unidades vendidas decrescente
  productStats.sort((a, b) => b.unitsSold - a.unitsSold);

  const totalRevenue = productStats.reduce((acc, p) => acc + p.revenue, 0);
  const totalUnitsSold = productStats.reduce((acc, p) => acc + p.unitsSold, 0);

  // Calcula porcentagem de participação de cada um nas vendas
  productStats.forEach(p => {
    p.sharePercentage = totalUnitsSold > 0 ? Math.round((p.unitsSold / totalUnitsSold) * 100) : 0;
  });

  // Produto mais clicado do catálogo (o mais procurado da época)
  let mostClickedProduct = null;
  const sortedByClicks = [...products].sort((a, b) => {
    const clicksA = a.id === topSeasonalId ? 495 : (BASE_WEIGHTS[a.id]?.clicks || 50);
    const clicksB = b.id === topSeasonalId ? 495 : (BASE_WEIGHTS[b.id]?.clicks || 50);
    return clicksB - clicksA;
  });

  if (sortedByClicks.length > 0) {
    const champ = sortedByClicks[0];
    const topStat = productStats.find(p => p.id === champ.id);
    const clicks = topStat?.clicks || Math.round(495 * multiplier);
    const estimatedOrders = topStat?.unitsSold || Math.round(140 * multiplier);
    const interestRate = ((estimatedOrders / clicks) * 100).toFixed(1) + '% de conversão';

    mostClickedProduct = {
      product: champ,
      clicks,
      interestRate,
      estimatedOrders,
    };
  }

  // Gera total de pedidos estimados
  const ordersCount = Math.max(1, Math.round(totalUnitsSold * 0.45));

  return {
    period,
    periodLabel,
    periodUnitLabel,
    totalRevenue,
    unitsSold: totalUnitsSold,
    visits: Math.round(baseVisits),
    ordersCount,
    growthRevenue,
    growthUnits,
    growthVisits,
    mostClickedProduct,
    topSellingProducts: productStats.slice(0, 5),
  };
}

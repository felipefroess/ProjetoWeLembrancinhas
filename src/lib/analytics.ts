import { Product } from '@/types';

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
  'mini-lata-natal-luxo': { units: 68, clicks: 342 },
  'lembrancinha-porta-chocolate-professores': { units: 115, clicks: 438 },
  'caderno-personalizado-luxo': { units: 42, clicks: 285 },
  'lata-personalizada-maternidade-ursinho-classico-2764': { units: 26, clicks: 194 },
  'kit-presente-professores-bloco-de-notas-com-caixa-estojo-e-caneta-8914': { units: 18, clicks: 146 },
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

  // Mapeia produtos para estatísticas
  const productStats: TopProductStat[] = products.map((prod, index) => {
    // Busca dados base ou cria padrão realista caso seja produto novo cadastrado
    const base = BASE_WEIGHTS[prod.id] || {
      units: Math.max(8, 30 - index * 5),
      clicks: Math.max(40, 160 - index * 20),
    };

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

  // Calcula porcentagem de participação
  productStats.forEach((p) => {
    p.sharePercentage = totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0;
  });

  // Produto com mais cliques
  let mostClickedProduct: AnalyticsSummary['mostClickedProduct'] = null;
  if (products.length > 0) {
    const mostClickedStat = [...productStats].sort((a, b) => b.clicks - a.clicks)[0];
    const originalProd = products.find((p) => p.id === mostClickedStat.id) || products[0];

    const interestRate = baseVisits > 0 
      ? ((mostClickedStat.clicks / baseVisits) * 100).toFixed(1) + '%' 
      : '0%';

    mostClickedProduct = {
      product: originalProd,
      clicks: mostClickedStat.clicks,
      interestRate,
      estimatedOrders: mostClickedStat.unitsSold,
    };
  }

  const ordersCount = Math.max(1, Math.round(totalUnitsSold / 5.2));

  return {
    period,
    periodLabel,
    periodUnitLabel,
    totalRevenue,
    unitsSold: totalUnitsSold,
    visits: baseVisits,
    ordersCount,
    growthRevenue,
    growthUnits,
    growthVisits,
    mostClickedProduct,
    topSellingProducts: productStats.slice(0, 5), // Top 5
  };
}

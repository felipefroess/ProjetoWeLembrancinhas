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
  growthRevenue: string | null;
  growthUnits: string | null;
  growthVisits: string | null;
  mostClickedProduct: {
    product: Product;
    clicks: number;
    interestRate: string;
    estimatedOrders: number;
  } | null;
  topSellingProducts: TopProductStat[];
}

export function getAnalyticsForPeriod(_products: Product[], period: AnalyticsPeriod): AnalyticsSummary {
  let periodLabel = 'Este Mês';
  let periodUnitLabel = 'no mês';

  if (period === 'semana') {
    periodLabel = 'Esta Semana';
    periodUnitLabel = 'na semana';
  } else if (period === 'ano') {
    periodLabel = 'Este Ano';
    periodUnitLabel = 'no ano';
  }

  return {
    period,
    periodLabel,
    periodUnitLabel,
    totalRevenue: 0,
    unitsSold: 0,
    visits: 0,
    ordersCount: 0,
    growthRevenue: null,
    growthUnits: null,
    growthVisits: null,
    mostClickedProduct: null,
    topSellingProducts: [],
  };
}

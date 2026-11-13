import { Product } from '@/types';

/**
 * Registra uma visualização de página
 */
export function trackPageView(path = window.location.pathname) {
  if (typeof window === 'undefined') return;

  // Evita registrar múltiplos pageviews idênticos no mesmo segundo
  const lastTracked = sessionStorage.getItem('last_tracked_pv');
  const now = Date.now();
  if (lastTracked && now - Number(lastTracked) < 15000) {
    return;
  }
  sessionStorage.setItem('last_tracked_pv', String(now));

  // Obtém ou cria um sessionId anônimo no sessionStorage
  let sessionId = sessionStorage.getItem('we_session_id');
  if (!sessionId) {
    sessionId = 's_' + Math.random().toString(36).substring(2, 11);
    sessionStorage.setItem('we_session_id', sessionId);
  }

  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'pageview',
      path,
      sessionId,
      userAgent: navigator.userAgent,
    }),
  }).catch(() => {});
}

/**
 * Registra um clique de interesse em produto
 */
export function trackProductClick(product: { id: string; name: string; category?: string }) {
  if (typeof window === 'undefined' || !product?.id) return;

  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'click',
      productId: product.id,
      productName: product.name,
      category: product.category || 'Geral',
    }),
  }).catch(() => {});
}

/**
 * Envia o pedido para persistência no banco Supabase
 */
export async function trackOrderToDatabase(orderData: {
  customerName: string;
  customerPhone?: string;
  eventDate?: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  generalNotes?: string;
  totalUnits: number;
  totalAmount: number;
  couponCode?: string;
  discountAmount?: number;
  subtotalAmount?: number;
  items: any[];
}) {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
      keepalive: true,
    });
    return await res.json();
  } catch (err) {
    console.error('Falha ao registrar pedido no banco:', err);
    return { success: false };
  }
}

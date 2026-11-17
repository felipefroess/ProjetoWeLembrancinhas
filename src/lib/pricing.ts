import { Product, QuantityDiscount } from '@/types';

/**
 * Retorna os descontos por quantidade ordenados decrescentemente pela quantidade mínima
 */
export function getSortedQuantityDiscounts(product: Product): QuantityDiscount[] {
  if (!product.quantityDiscounts || !Array.isArray(product.quantityDiscounts)) {
    return [];
  }
  return [...product.quantityDiscounts]
    .filter((d) => typeof d.minQuantity === 'number' && d.minQuantity > 1 && typeof d.price === 'number' && d.price > 0)
    .sort((a, b) => b.minQuantity - a.minQuantity);
}

/**
 * Retorna o preço unitário efetivo considerando variação e tabela de quantidade (promoção de volume/atacado)
 */
export function calculateUnitPrice(
  product: Product,
  quantity: number,
  variationPrice?: number
): number {
  const basePrice = typeof variationPrice === 'number' && variationPrice > 0 ? variationPrice : product.price;

  const discounts = getSortedQuantityDiscounts(product);
  if (discounts.length === 0) {
    return basePrice;
  }

  // Encontra a faixa aplicável (maior minQuantity que seja <= quantity)
  const applicable = discounts.find((d) => quantity >= d.minQuantity);
  if (applicable && applicable.price > 0) {
    // Se houver variação com preço específico e desconto percentual/relativo, ou desconto direto
    return applicable.price;
  }

  return basePrice;
}

/**
 * Retorna a próxima faixa de desconto para incentivar o cliente a adicionar mais unidades
 */
export function getNextDiscountTier(
  product: Product,
  currentQuantity: number
): { neededQty: number; discountPrice: number; savingsPct: number } | null {
  const discounts = [...getSortedQuantityDiscounts(product)].sort((a, b) => a.minQuantity - b.minQuantity);
  const nextTier = discounts.find((d) => d.minQuantity > currentQuantity);

  if (!nextTier) return null;

  const currentPrice = calculateUnitPrice(product, currentQuantity);
  const savingsPct = Math.round(((currentPrice - nextTier.price) / currentPrice) * 100);

  return {
    neededQty: nextTier.minQuantity - currentQuantity,
    discountPrice: nextTier.price,
    savingsPct: Math.max(1, savingsPct),
  };
}

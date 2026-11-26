import { Product, QuantityDiscount } from '@/types';

export function getSortedQuantityDiscounts(product: Product): QuantityDiscount[] {
  if (!product.quantityDiscounts || !Array.isArray(product.quantityDiscounts)) {
    return [];
  }
  return [...product.quantityDiscounts]
    .filter((d) => typeof d.minQuantity === 'number' && d.minQuantity > 1 && typeof d.price === 'number' && d.price > 0)
    .sort((a, b) => b.minQuantity - a.minQuantity);
}

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

  const applicable = discounts.find((d) => quantity >= d.minQuantity);
  if (applicable && applicable.price > 0 && (basePrice <= 0 || applicable.price <= basePrice)) {
    return applicable.price;
  }

  return basePrice;
}

export function getNextDiscountTier(
  product: Product,
  currentQuantity: number,
  variationPrice?: number
): { neededQty: number; discountPrice: number; savingsPct: number } | null {
  const discounts = [...getSortedQuantityDiscounts(product)].sort((a, b) => a.minQuantity - b.minQuantity);
  const nextTier = discounts.find((d) => d.minQuantity > currentQuantity);

  if (!nextTier) return null;

  const currentPrice = calculateUnitPrice(product, currentQuantity, variationPrice);
  if (currentPrice <= 0 || nextTier.price >= currentPrice) {
    return null;
  }
  const savingsPct = Math.round(((currentPrice - nextTier.price) / currentPrice) * 100);

  return {
    neededQty: nextTier.minQuantity - currentQuantity,
    discountPrice: nextTier.price,
    savingsPct: Math.max(1, savingsPct),
  };
}

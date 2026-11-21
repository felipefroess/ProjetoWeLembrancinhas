'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, CustomizationOptions, CustomerOrderData, AppliedCoupon } from '@/types';
import { STORE_CONFIG } from '@/data/products';
import { trackProductClick } from '@/lib/tracking';
import { calculateUnitPrice } from '@/lib/pricing';
import { useStoreSettings } from './StoreSettingsContext';

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  isCustomizingModalOpen: boolean;
  isCheckoutOpen: boolean;
  selectedProductForCustomization: Product | null;
  totalItems: number;
  subtotalAmount: number;
  appliedCoupon: AppliedCoupon | null;
  discountAmount: number;
  finalTotal: number;
  hasWholesaleInCart: boolean;
  eligibleSubtotal: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  openCart: () => void;
  closeCart: () => void;
  openCustomizationModal: (product: Product, initialVariationId?: string) => void;
  closeCustomizationModal: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  addToCart: (product: Product, quantity: number, customization: CustomizationOptions) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;
  generateWhatsAppOrderUrl: (orderData: CustomerOrderData) => string;
  selectedVariationIdForCustomization?: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'welembrancinhas_cart_v1';
const COUPON_STORAGE_KEY = 'welembrancinhas_coupon_v1';

/**
 * Identifica se um item do carrinho é de atacado (possui tabela progressiva ou recebeu preço com desconto de atacado)
 */
export function isWholesaleCartItem(item: CartItem): boolean {
  const hasWholesaleTiers = Boolean(
    item.product.quantityDiscounts &&
    Array.isArray(item.product.quantityDiscounts) &&
    item.product.quantityDiscounts.length > 0
  );
  const hasVolumeDiscount = typeof item.unitPrice === 'number' && item.unitPrice < item.product.price;
  return hasWholesaleTiers || hasVolumeDiscount;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { settings: storeSettings } = useStoreSettings();
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomizingModalOpen, setIsCustomizingModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProductForCustomization, setSelectedProductForCustomization] = useState<Product | null>(null);
  const [selectedVariationIdForCustomization, setSelectedVariationIdForCustomization] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Carregar do localStorage ao montar o componente
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
      const storedCoupon = localStorage.getItem(COUPON_STORAGE_KEY);
      if (storedCoupon) {
        setAppliedCoupon(JSON.parse(storedCoupon));
      }
    } catch (e) {
      console.error('Falha ao ler carrinho do localStorage:', e);
    }
    setIsHydrated(true);
  }, []);

  // Salvar no localStorage ao alterar itens
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Falha ao salvar carrinho no localStorage:', e);
    }
  }, [items, isHydrated]);

  // Salvar cupom no localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (appliedCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Falha ao salvar cupom no localStorage:', e);
    }
  }, [appliedCoupon, isHydrated]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const openCustomizationModal = (product: Product, initialVariationId?: string) => {
    setSelectedProductForCustomization(product);
    setSelectedVariationIdForCustomization(initialVariationId || null);
    setIsCustomizingModalOpen(true);
    trackProductClick(product);
  };

  const closeCustomizationModal = () => {
    setSelectedProductForCustomization(null);
    setSelectedVariationIdForCustomization(null);
    setIsCustomizingModalOpen(false);
  };

  const openCheckout = () => {
    setIsOpen(false);
    setIsCheckoutOpen(true);
  };

  const closeCheckout = () => setIsCheckoutOpen(false);

  const getEffectiveUnitPrice = (
    product: Product,
    quantity: number,
    customization?: CustomizationOptions
  ): number => {
    let variationPrice: number | undefined;
    if (customization?.variation && product.variations) {
      const v = product.variations.find((item) => item.name === customization.variation);
      if (v && typeof v.price === 'number' && v.price > 0) {
        variationPrice = v.price;
      }
    }
    return calculateUnitPrice(product, quantity, variationPrice);
  };

  const addToCart = (product: Product, quantity: number, customization: CustomizationOptions) => {
    // Cria um identificador único considerando as opções de personalização
    const customKey = `${product.id}_${customization.variation || ''}_${customization.theme || ''}_${customization.childName || ''}_${customization.ribbonColor || ''}`;

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.cartItemId === customKey);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        const unitPrice = getEffectiveUnitPrice(updated[existingIndex].product, newQty, updated[existingIndex].customization);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          unitPrice,
          subtotal: unitPrice * newQty,
        };
        return updated;
      }

      const unitPrice = getEffectiveUnitPrice(product, quantity, customization);
      return [
        ...prev,
        {
          cartItemId: customKey,
          product,
          quantity,
          customization,
          unitPrice,
          subtotal: unitPrice * quantity,
        },
      ];
    });

    closeCustomizationModal();
    setIsOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          const unitPrice = getEffectiveUnitPrice(item.product, newQuantity, item.customization);
          return {
            ...item,
            quantity: newQuantity,
            unitPrice,
            subtotal: unitPrice * newQuantity,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotalAmount = items.reduce((acc, item) => acc + item.subtotal, 0);

  // Verifica se o cupom atual exclui produtos de atacado (que já possuem desconto por volume)
  const isCouponExcludedFromWholesale = Boolean(
    appliedCoupon?.firstPurchaseOnly ||
    appliedCoupon?.code === 'PRIMEIRACOMPRA' ||
    appliedCoupon?.excludeWholesale !== false
  );

  // Itens elegíveis para o desconto do cupom
  const eligibleItems = items.filter((item) => {
    if (isCouponExcludedFromWholesale && isWholesaleCartItem(item)) {
      return false;
    }
    return true;
  });

  const eligibleSubtotal = eligibleItems.reduce((acc, item) => acc + item.subtotal, 0);
  const hasWholesaleInCart = items.some(isWholesaleCartItem);

  // Calcula desconto dinamicamente sobre a base de produtos elegíveis
  const discountAmount = appliedCoupon
    ? isCouponExcludedFromWholesale && eligibleSubtotal <= 0
      ? 0
      : appliedCoupon.type === 'percentage'
        ? Number((((isCouponExcludedFromWholesale ? eligibleSubtotal : subtotalAmount) * appliedCoupon.value) / 100).toFixed(2))
        : Math.min(appliedCoupon.value, isCouponExcludedFromWholesale ? eligibleSubtotal : subtotalAmount)
    : 0;

  const finalTotal = Math.max(0, subtotalAmount - discountAmount);

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Digite o código do cupom.' };
    }

    const onlyWholesale = items.length > 0 && items.every(isWholesaleCartItem);
    const nonWholesaleSubtotal = items
      .filter((i) => !isWholesaleCartItem(i))
      .reduce((acc, i) => acc + i.subtotal, 0);

    // Validação preventiva imediata para o cupom de primeira compra
    if (onlyWholesale && (cleanCode === 'PRIMEIRACOMPRA' || cleanCode.includes('PRIMEIR'))) {
      return {
        success: false,
        message: 'O cupom de 1ª compra não é aplicável em produtos de atacado (que já possuem desconto progressivo).',
      };
    }

    // 1. Verifica se o cupom já foi utilizado anteriormente neste aparelho
    try {
      const usedCoupons = JSON.parse(localStorage.getItem('we_used_coupons') || '[]');
      if (Array.isArray(usedCoupons) && usedCoupons.includes(cleanCode)) {
        return {
          success: false,
          message: 'Este cupom é exclusivo para a 1ª compra e já foi utilizado neste aparelho.',
        };
      }
    } catch {
      // Ignora erro de localStorage
    }

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          subtotal: subtotalAmount,
          eligibleSubtotal: nonWholesaleSubtotal,
          hasOnlyWholesale: onlyWholesale,
        }),
      });
      const data = await res.json();

      if ((data.valid || data.success) && data.coupon) {
        if (data.coupon.firstPurchaseOnly && onlyWholesale) {
          return {
            success: false,
            message: 'O cupom de 1ª compra não é aplicável em produtos de atacado (que já possuem desconto progressivo).',
          };
        }
        setAppliedCoupon(data.coupon);
        return { success: true, message: data.message || 'Cupom aplicado com sucesso!' };
      } else {
        return { success: false, message: data.message || 'Cupom inválido ou expirado.' };
      }
    } catch {
      return { success: false, message: 'Erro ao validar cupom. Tente novamente.' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Formata o pedido em Markdown limpo para WhatsApp
  const generateWhatsAppOrderUrl = (orderData: CustomerOrderData): string => {
    let message = `Olá, Wê! Tudo bem?\n`;
    message += `Gostaria de fazer um pedido pela sua loja online:\n\n`;

    items.forEach((item, index) => {
      message += `*${index + 1}. ${item.product.name}*\n`;
      const rawUnit = item.product.unit?.toLowerCase() || '';
      const unitLabel = rawUnit.includes('un') || !rawUnit ? 'unidade(s)' : `${item.product.unit}(s)`;
      message += `   • ${item.quantity} ${unitLabel}\n`;
      
      if (item.customization.variation) {
        message += `   • Modelo: *${item.customization.variation}*\n`;
      }
      if (item.customization.ribbonColor) {
        const ribbon = item.customization.ribbonColor.trim();
        const formattedRibbon = ribbon.toLowerCase().startsWith('laço') ? ribbon : `Laço ${ribbon}`;
        message += `   • *${formattedRibbon}*\n`;
      }
      if (item.customization.theme) {
        message += `   • Tema: *${item.customization.theme}*\n`;
      }
      if (item.customization.childName) {
        message += `   • Nome na arte: *${item.customization.childName}*\n`;
      }
      if (item.customization.ageOrDate) {
        message += `   • Idade / Data: *${item.customization.ageOrDate}*\n`;
      }
      if (item.customization.customFieldValues) {
        Object.entries(item.customization.customFieldValues).forEach(([k, val]) => {
          if (val && String(val).trim()) {
            message += `   • ${k}: *${String(val).trim()}*\n`;
          }
        });
      }
      if (item.customization.notes) {
        message += `   • Obs: _${item.customization.notes}_\n`;
      }
      message += `   • Subtotal: *R$ ${item.subtotal.toFixed(2).replace('.', ',')}*\n\n`;
    });

    const shippingValue =
      orderData.deliveryMethod === 'entrega-correios' &&
      orderData.shippingPrice &&
      orderData.shippingPrice > 0
        ? orderData.shippingPrice
        : 0;
    const totalWithShipping = finalTotal + shippingValue;

    if (appliedCoupon && discountAmount > 0) {
      const descText =
        appliedCoupon.type === 'percentage'
          ? `${appliedCoupon.value}% OFF`
          : `R$ ${appliedCoupon.value.toFixed(2).replace('.', ',')} OFF`;
      message += `*SUBTOTAL:* R$ ${subtotalAmount.toFixed(2).replace('.', ',')}\n`;
      message += `*CUPOM:* ${appliedCoupon.code} (${descText}${hasWholesaleInCart ? ' - itens participantes' : ''})\n`;
      message += `*DESCONTO:* -R$ ${discountAmount.toFixed(2).replace('.', ',')}\n`;
    }

    if (shippingValue > 0) {
      const serviceLabel = [orderData.shippingCompany, orderData.shippingServiceName]
        .filter(Boolean)
        .join(' - ');
      const daysLabel = orderData.shippingDeliveryDays
        ? ` (${orderData.shippingDeliveryDays} dias úteis)`
        : '';
      message += `*FRETE (${serviceLabel || 'Correios'}):* R$ ${shippingValue.toFixed(2).replace('.', ',')}${daysLabel}\n`;
      message += `*TOTAL COM FRETE:* R$ ${totalWithShipping.toFixed(2).replace('.', ',')}\n\n`;
    } else {
      message += `*TOTAL ESTIMADO:* R$ ${finalTotal.toFixed(2).replace('.', ',')}\n\n`;
    }

    const effectiveTotal = shippingValue > 0 ? totalWithShipping : finalTotal;
    const halfTotal = effectiveTotal / 2;
    const isPickup = orderData.deliveryMethod !== 'entrega-correios';

    message += `💳 *CONDIÇÃO DE PAGAMENTO:*\n`;
    if (isPickup) {
      message += `Para iniciar a produção, é necessário o pagamento de 50% de entrada e o restante no dia da retirada.\n`;
      message += `• Entrada (50%): R$ ${halfTotal.toFixed(2).replace('.', ',')}\n`;
      message += `• Na retirada (50%): R$ ${halfTotal.toFixed(2).replace('.', ',')}\n\n`;
    } else {
      message += `Para iniciar a produção, é necessário o pagamento de 50% de entrada e o restante no dia da entrega.\n`;
      message += `• Entrada (50%): R$ ${halfTotal.toFixed(2).replace('.', ',')}\n\n`;
    }

    message += `Fico no aguardo para confirmar a data de produção e os detalhes da arte. Agradeço desde já!`;

    const encoded = encodeURIComponent(message);
    const activePhone = storeSettings?.whatsappNumber || STORE_CONFIG.whatsappNumber;
    return `https://wa.me/${activePhone}?text=${encoded}`;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        isCustomizingModalOpen,
        isCheckoutOpen,
        selectedProductForCustomization,
        selectedVariationIdForCustomization,
        totalItems,
        subtotalAmount,
        appliedCoupon,
        discountAmount,
        finalTotal,
        hasWholesaleInCart,
        eligibleSubtotal,
        applyCoupon,
        removeCoupon,
        openCart,
        closeCart,
        openCustomizationModal,
        closeCustomizationModal,
        openCheckout,
        closeCheckout,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        generateWhatsAppOrderUrl,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser utilizado dentro de um CartProvider');
  }
  return context;
}

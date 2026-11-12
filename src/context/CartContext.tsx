'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, CustomizationOptions, CustomerOrderData, AppliedCoupon } from '@/types';
import { STORE_CONFIG } from '@/data/products';
import { trackProductClick } from '@/lib/tracking';
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
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  openCart: () => void;
  closeCart: () => void;
  openCustomizationModal: (product: Product) => void;
  closeCustomizationModal: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  addToCart: (product: Product, quantity: number, customization: CustomizationOptions) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;
  generateWhatsAppOrderUrl: (orderData: CustomerOrderData) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'welembrancinhas_cart_v1';
const COUPON_STORAGE_KEY = 'welembrancinhas_coupon_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { settings: storeSettings } = useStoreSettings();
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomizingModalOpen, setIsCustomizingModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProductForCustomization, setSelectedProductForCustomization] = useState<Product | null>(null);
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

  const openCustomizationModal = (product: Product) => {
    setSelectedProductForCustomization(product);
    setIsCustomizingModalOpen(true);
    trackProductClick(product);
  };

  const closeCustomizationModal = () => {
    setSelectedProductForCustomization(null);
    setIsCustomizingModalOpen(false);
  };

  const openCheckout = () => {
    setIsOpen(false);
    setIsCheckoutOpen(true);
  };

  const closeCheckout = () => setIsCheckoutOpen(false);

  const addToCart = (product: Product, quantity: number, customization: CustomizationOptions) => {
    // Cria um identificador único considerando as opções de personalização
    const customKey = `${product.id}_${customization.variation || ''}_${customization.theme || ''}_${customization.childName || ''}_${customization.ribbonColor || ''}`;
    const subtotal = product.price * quantity;

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.cartItemId === customKey);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal: updated[existingIndex].product.price * newQty,
        };
        return updated;
      }

      return [
        ...prev,
        {
          cartItemId: customKey,
          product,
          quantity,
          customization,
          subtotal,
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
          return {
            ...item,
            quantity: newQuantity,
            subtotal: item.product.price * newQuantity,
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

  // Calcula desconto dinamicamente de acordo com o subtotal atual
  const discountAmount = appliedCoupon
    ? appliedCoupon.type === 'percentage'
      ? Number(((subtotalAmount * appliedCoupon.value) / 100).toFixed(2))
      : Math.min(appliedCoupon.value, subtotalAmount)
    : 0;

  const finalTotal = Math.max(0, subtotalAmount - discountAmount);

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Digite o código do cupom.' };
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
        body: JSON.stringify({ code: cleanCode, subtotal: subtotalAmount }),
      });
      const data = await res.json();

      if ((data.valid || data.success) && data.coupon) {
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
    const deliveryLabels: Record<string, string> = {
      'retirada-pouso-alegre': 'Retirada em Pouso Alegre - MG',
      'retirada-paraisopolis': 'Retirada em Paraisópolis - MG',
      'entrega-correios': 'Envio por Correios / Transportadora',
    };

    let message = `Olá, Wê! Tudo bem?\n`;
    message += `Gostaria de fazer um pedido pela sua loja online (*Wê Lembrancinhas*):\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `*ITENS DO PEDIDO:*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    items.forEach((item, index) => {
      message += `*${index + 1}. ${item.product.name}*\n`;
      message += `   • Quantidade: ${item.quantity} ${item.product.unit}\n`;
      message += `   • Valor unitário: R$ ${item.product.price.toFixed(2).replace('.', ',')}\n`;
      
      if (item.customization.variation) {
        message += `   • Modelo / Variação: *${item.customization.variation}*\n`;
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
      if (item.customization.ribbonColor) {
        message += `   • Cor dos laços/detalhes: *${item.customization.ribbonColor}*\n`;
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

    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    if (appliedCoupon && discountAmount > 0) {
      const descText =
        appliedCoupon.type === 'percentage'
          ? `${appliedCoupon.value}% OFF`
          : `R$ ${appliedCoupon.value.toFixed(2).replace('.', ',')} OFF`;
      message += `*SUBTOTAL:* R$ ${subtotalAmount.toFixed(2).replace('.', ',')}\n`;
      message += `*CUPOM APLICADO:* ${appliedCoupon.code} (${descText})\n`;
      message += `*DESCONTO:* -R$ ${discountAmount.toFixed(2).replace('.', ',')}\n`;
    } else if (shippingValue > 0) {
      message += `*PRODUTOS:* R$ ${finalTotal.toFixed(2).replace('.', ',')}\n`;
    }

    if (shippingValue > 0) {
      const serviceLabel = [orderData.shippingCompany, orderData.shippingServiceName]
        .filter(Boolean)
        .join(' - ');
      const daysLabel = orderData.shippingDeliveryDays
        ? ` (${orderData.shippingDeliveryDays} dias úteis)`
        : '';
      message += `*FRETE (${serviceLabel || 'Melhor Envio'}):* R$ ${shippingValue.toFixed(2).replace('.', ',')}${daysLabel}\n`;
      message += `*TOTAL COM FRETE:* R$ ${totalWithShipping.toFixed(2).replace('.', ',')}\n`;
    } else {
      message += `*TOTAL ESTIMADO:* R$ ${finalTotal.toFixed(2).replace('.', ',')}\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    message += `*DADOS PARA COMBINAR A ENTREGA:*\n`;
    message += `• *Cliente:* ${orderData.customerName}\n`;
    if (orderData.customerPhone) {
      message += `• *Contato:* ${orderData.customerPhone}\n`;
    }
    if (orderData.eventDate) {
      message += `• *Data do Evento:* ${orderData.eventDate}\n`;
    }
    message += `• *Entrega/Retirada:* ${deliveryLabels[orderData.deliveryMethod] || orderData.deliveryMethod}\n`;
    if (orderData.shippingCep) {
      message += `• *CEP:* ${orderData.shippingCep}\n`;
    }
    if (orderData.deliveryAddress) {
      message += `• *Endereço/Cidade:* ${orderData.deliveryAddress}\n`;
    }
    if (orderData.generalNotes) {
      message += `• *Observações adicionais:* ${orderData.generalNotes}\n`;
    }

    message += `\nFico no aguardo para confirmar a data de produção e os detalhes da arte! Obrigada!`;

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
        totalItems,
        subtotalAmount,
        appliedCoupon,
        discountAmount,
        finalTotal,
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

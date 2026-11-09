'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, CustomizationOptions, CustomerOrderData } from '@/types';
import { STORE_CONFIG } from '@/data/products';

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  isCustomizingModalOpen: boolean;
  isCheckoutOpen: boolean;
  selectedProductForCustomization: Product | null;
  totalItems: number;
  subtotalAmount: number;
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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
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

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const openCustomizationModal = (product: Product) => {
    setSelectedProductForCustomization(product);
    setIsCustomizingModalOpen(true);
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
    const customKey = `${product.id}_${customization.theme || ''}_${customization.childName || ''}_${customization.ribbonColor || ''}`;
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
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotalAmount = items.reduce((acc, item) => acc + item.subtotal, 0);

  // Formata o pedido em Markdown limpo para WhatsApp
  const generateWhatsAppOrderUrl = (orderData: CustomerOrderData): string => {
    const deliveryLabels: Record<string, string> = {
      'retirada-pouso-alegre': '📍 Retirada em Pouso Alegre - MG',
      'retirada-paraisopolis': '📍 Retirada em Paraisópolis - MG',
      'entrega-correios': '🚚 Envio por Correios / Transportadora',
    };

    let message = `Olá, Wenilze! Tudo bem? 💕\n`;
    message += `Gostaria de fazer um pedido pela sua loja online (*Wê Lembrancinhas*):\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🛍️ *ITENS DO PEDIDO:*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    items.forEach((item, index) => {
      message += `*${index + 1}. ${item.product.name}*\n`;
      message += `   • Quantidade: ${item.quantity} ${item.product.unit}\n`;
      message += `   • Valor unitário: R$ ${item.product.price.toFixed(2).replace('.', ',')}\n`;
      
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
      if (item.customization.notes) {
        message += `   • Obs: _${item.customization.notes}_\n`;
      }
      message += `   • Subtotal: *R$ ${item.subtotal.toFixed(2).replace('.', ',')}*\n\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💰 *TOTAL ESTIMADO:* R$ ${subtotalAmount.toFixed(2).replace('.', ',')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    message += `📋 *DADOS PARA COMBINAR A ENTREGA:*\n`;
    message += `• *Cliente:* ${orderData.customerName}\n`;
    if (orderData.customerPhone) {
      message += `• *Contato:* ${orderData.customerPhone}\n`;
    }
    if (orderData.eventDate) {
      message += `• *Data do Evento:* ${orderData.eventDate}\n`;
    }
    message += `• *Entrega/Retirada:* ${deliveryLabels[orderData.deliveryMethod] || orderData.deliveryMethod}\n`;
    if (orderData.deliveryAddress) {
      message += `• *Endereço/Cidade:* ${orderData.deliveryAddress}\n`;
    }
    if (orderData.generalNotes) {
      message += `• *Observações adicionais:* ${orderData.generalNotes}\n`;
    }

    message += `\nFico no aguardo para confirmar a data de produção e os detalhes da arte! ✨ Obrigada!`;

    const encoded = encodeURIComponent(message);
    return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encoded}`;
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

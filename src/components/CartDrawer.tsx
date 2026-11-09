'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    totalItems,
    subtotalAmount,
    openCheckout,
  } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-slide-left border-l border-[#DACFBF]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-[#E8DFD5] bg-[#FAF7F2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-[#6D4C3D]" size={20} />
            <h3 className="font-serif font-bold text-lg text-[#2D231E]">
              Meu Pedido ({totalItems})
            </h3>
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 rounded-full bg-white border border-[#DACFBF] text-[#7C6E64] hover:text-[#2D231E] flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#DACFBF] flex items-center justify-center mx-auto mb-4 text-[#8C7A6B]">
                <ShoppingBag size={28} />
              </div>
              <h4 className="font-serif font-bold text-base text-[#2D231E] mb-1">
                Seu carrinho está vazio
              </h4>
              <p className="text-xs text-[#7C6E64] max-w-xs mx-auto mb-6">
                Escolha uma lembrancinha linda do catálogo e personalize com o tema do seu evento!
              </p>
              <button
                onClick={closeCart}
                className="px-5 py-2.5 rounded-full bg-[#6D4C3D] text-white text-xs font-bold hover:bg-[#5A3E31] transition"
              >
                Explorar Lembrancinhas
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.cartItemId}
                className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD5] flex flex-col gap-3"
              >
                <div className="flex gap-3">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-xl border border-[#DACFBF] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-serif font-bold text-sm text-[#2D231E] truncate">
                      {item.product.name}
                    </h5>
                    <p className="text-xs font-semibold text-[#6D4C3D]">
                      {item.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-[11px] text-[#8C7A6B]">
                      {item.quantity} x {item.product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.cartItemId)}
                    className="text-[#9E9084] hover:text-[#D97762] p-1 self-start transition"
                    title="Remover item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Detalhes de Personalização */}
                <div className="text-[11px] bg-white p-2.5 rounded-xl border border-[#DACFBF]/80 space-y-1 text-[#52443C]">
                  {item.customization.variation && (
                    <p>
                      <strong>Modelo:</strong> {item.customization.variation}
                    </p>
                  )}
                  {item.customization.theme && (
                    <p>
                      <strong>Tema:</strong> {item.customization.theme}
                    </p>
                  )}
                  {item.customization.childName && (
                    <p>
                      <strong>Nome:</strong> {item.customization.childName}
                    </p>
                  )}
                  {item.customization.ageOrDate && (
                    <p>
                      <strong>Idade/Data:</strong> {item.customization.ageOrDate}
                    </p>
                  )}
                  {item.customization.ribbonColor && (
                    <p>
                      <strong>Fita:</strong> {item.customization.ribbonColor}
                    </p>
                  )}
                  {item.customization.notes && (
                    <p className="italic text-[#7C6E64]">
                      &quot;{item.customization.notes}&quot;
                    </p>
                  )}
                </div>

                {/* Controle de Quantidade */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#8C7A6B] font-medium">Quantidade:</span>
                  <div className="flex items-center border border-[#DACFBF] rounded-lg bg-white overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      className="w-7 h-7 text-xs font-bold text-[#4A3B32] hover:bg-[#FAF7F2] transition"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-[#2D231E]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      className="w-7 h-7 text-xs font-bold text-[#4A3B32] hover:bg-[#FAF7F2] transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé do Carrinho com Total e Ação */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#E8DFD5] bg-[#FAF7F2] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#8C7A6B] font-semibold">
                Total Estimado
              </span>
              <span className="font-serif font-bold text-2xl text-[#6D4C3D]">
                {subtotalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>

            <p className="text-[11px] text-[#7C6E64] bg-white p-2 rounded-lg border border-[#DACFBF]">
              O pedido será enviado diretamente para a Wenilze no WhatsApp com todos os detalhes prontos!
            </p>

            <button
              onClick={openCheckout}
              className="w-full py-3.5 rounded-full bg-[#6D4C3D] hover:bg-[#5A3E31] text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>Avançar para Concluir</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

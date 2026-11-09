'use client';

import React from 'react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Sparkles, Clock, Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { openCustomizationModal } = useCart();

  const formattedPrice = product.price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-[#E8DFD5] hover:border-[#C89B6D] transition-all duration-300 shadow-xs hover:shadow-xl flex flex-col justify-between">
      {/* Container da Imagem com Tag */}
      <div className="relative aspect-square overflow-hidden bg-[#F5EDE4]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges superiores */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {product.popular && (
            <span className="inline-flex items-center gap-1 bg-[#D4AF37] text-[#2D231E] text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full shadow-sm">
              <Sparkles size={11} /> Mais Pedido
            </span>
          )}
          {product.minQuantity > 1 && (
            <span className="bg-[#4A3B32]/90 backdrop-blur-xs text-[#FAF7F2] text-[10px] font-medium px-2 py-0.5 rounded-md">
              Mínimo: {product.minQuantity} un.
            </span>
          )}
        </div>

        {/* Prazo de Produção */}
        <div className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-xs text-[#52443C] text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
          <Clock size={11} className="text-[#C89B6D]" />
          <span>{product.leadTimeDays} dias úteis</span>
        </div>
      </div>

      {/* Conteúdo do Card */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-serif font-bold text-base text-[#2D231E] group-hover:text-[#6D4C3D] transition line-clamp-1 mb-1">
            {product.name}
          </h3>
          <p className="text-xs text-[#7C6E64] line-clamp-2 leading-relaxed mb-3">
            {product.description}
          </p>
        </div>

        {/* Preço e Botão */}
        <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#9E9084] block font-semibold">
              Valor por {product.unit}
            </span>
            <span className="font-bold text-lg text-[#6D4C3D]">
              {formattedPrice}
            </span>
          </div>

          <button
            onClick={() => openCustomizationModal(product)}
            className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#6D4C3D] text-[#6D4C3D] hover:text-white border border-[#DACFBF] hover:border-[#6D4C3D] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
          >
            <Heart size={13} className="text-[#D97762] group-hover:text-white" />
            <span>Personalizar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

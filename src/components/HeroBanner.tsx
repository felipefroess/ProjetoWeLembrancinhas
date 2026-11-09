'use client';

import React from 'react';
import { Heart, Sparkles, Clock, Truck, ShieldCheck } from 'lucide-react';
import { STORE_CONFIG } from '@/data/products';

export function HeroBanner() {
  const scrollToCatalog = () => {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F5EDE4] via-[#FAF7F2] to-[#FAF7F2] py-12 sm:py-16 border-b border-[#E8DFD5]">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#E8DFD5]/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge de boas-vindas */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EFE6DC] border border-[#DACFBF] text-[#6D4C3D] text-xs sm:text-sm font-medium mb-5 shadow-xs">
            <Heart size={14} className="text-[#D97762] fill-[#D97762]" />
            <span>Papelaria Afetiva & Lembrancinhas com Amor</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#2D231E] leading-tight sm:leading-tight mb-4">
            Transformando momentos únicos em memórias inesquecíveis.
          </h1>

          <p className="text-sm sm:text-base text-[#6B5E55] leading-relaxed mb-8 max-w-2xl mx-auto">
            Topos de bolo 3D, caixas cenário de luxo, kits festa e papelaria personalizada com o nome e tema do seu evento. Feito à mão com afeto por <strong>{STORE_CONFIG.artisanName}</strong>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10">
            <button
              onClick={scrollToCatalog}
              className="px-6 py-3 rounded-full bg-[#6D4C3D] hover:bg-[#5A3E31] text-white text-sm font-semibold tracking-wide shadow-md hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              🌸 Ver Catálogo & Montar Pedido
            </button>
            <a
              href={`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent('Olá, Wenilze! Gostaria de tirar uma dúvida sobre lembrancinhas personalizadas.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-white hover:bg-[#F5EDE4] text-[#6D4C3D] border border-[#DACFBF] text-sm font-semibold tracking-wide transition shadow-xs"
            >
              💬 Falar no WhatsApp
            </a>
          </div>

          {/* Destaques de confiança (Value Props) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-[#E8DFD5]/80 text-left">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/60">
              <Sparkles size={18} className="text-[#C89B6D] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#2D231E]">100% Personalizado</p>
                <p className="text-[11px] text-[#7C6E64]">Com o tema e nome</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/60">
              <Clock size={18} className="text-[#C89B6D] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#2D231E]">Produção Rápida</p>
                <p className="text-[11px] text-[#7C6E64]">A partir de 5 dias úteis</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/60">
              <Truck size={18} className="text-[#C89B6D] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#2D231E]">Retirada ou Envio</p>
                <p className="text-[11px] text-[#7C6E64]">Pouso Alegre, Paraisópolis e BR</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/60">
              <ShieldCheck size={18} className="text-[#C89B6D] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#2D231E]">Acabamento Luxo</p>
                <p className="text-[11px] text-[#7C6E64]">Papéis 230g e laços nobres</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

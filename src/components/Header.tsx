'use client';

import React from 'react';
import { ShoppingBag, Search, X } from 'lucide-react';
import { InstagramIcon } from '@/components/InstagramIcon';
import { useCart } from '@/context/CartContext';
import { STORE_CONFIG } from '@/data/products';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function Header({ searchQuery, setSearchQuery }: HeaderProps) {
  const { totalItems, openCart } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E8DFD5] transition-all">
      {/* Barra de Notificação Superior */}
      <div className="bg-[#4A3B32] text-[#F5EDE4] text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span>Produção artesanal e afetiva em <strong>Pouso Alegre & Paraisópolis - MG</strong> • Envio para todo o Brasil</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo e Nome da Loja */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#EFE6DC] border-2 border-[#D4AF37]/50 flex items-center justify-center shadow-inner relative group cursor-pointer">
              <span className="font-serif italic font-bold text-[#6D4C3D] text-lg select-none">
                Wê
              </span>
            </div>
            <div>
              <a href="#" className="flex flex-col">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#3E2E25]">
                  Wê Lembrancinhas
                </span>
              </a>
            </div>
          </div>

          {/* Campo de Busca (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar topo de bolo, caixa milk, batizado..."
                className="w-full bg-white/80 border border-[#DACFBF] rounded-full pl-10 pr-4 py-2 text-sm text-[#3E2E25] placeholder-[#9E9084] focus:outline-none focus:ring-2 focus:ring-[#C89B6D] focus:border-transparent transition"
              />
              <Search className="absolute left-3.5 top-2.5 text-[#9E9084]" size={16} />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-[#9E9084] hover:text-[#3E2E25]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Ações da Direita (Instagram e Carrinho) */}
          <div className="flex items-center gap-3">
            <a
              href={STORE_CONFIG.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-[#6D4C3D] hover:bg-[#EFE6DC] border border-[#DACFBF] transition"
              title="Ver nosso Instagram oficial"
            >
              <InstagramIcon size={15} className="text-[#C89B6D]" />
              <span>@{STORE_CONFIG.instagram}</span>
            </a>

            {/* Botão do Carrinho */}
            <button
              onClick={openCart}
              className="relative flex items-center gap-2 bg-[#6D4C3D] hover:bg-[#5A3E31] text-white px-4 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95"
              aria-label="Abrir carrinho de compras"
            >
              <ShoppingBag size={18} />
              <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider">
                Meu Pedido
              </span>
              {totalItems > 0 && (
                <span className="bg-[#D4AF37] text-[#2D231E] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Campo de Busca (Mobile) */}
        <div className="pb-3 md:hidden">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar topo de bolo, caixa milk, batizado..."
              className="w-full bg-white border border-[#DACFBF] rounded-full pl-10 pr-4 py-2 text-sm text-[#3E2E25] placeholder-[#9E9084] focus:outline-none focus:ring-2 focus:ring-[#C89B6D]"
            />
            <Search className="absolute left-3.5 top-2.5 text-[#9E9084]" size={16} />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-[#9E9084] hover:text-[#3E2E25]"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

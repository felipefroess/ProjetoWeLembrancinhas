'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { InstagramIcon } from '@/components/InstagramIcon';
import { STORE_CONFIG } from '@/data/products';

export function Footer() {
  return (
    <footer className="bg-[#2D231E] text-[#D8CDC4] pt-12 pb-8 border-t border-[#4A3B32]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10 border-b border-[#4A3B32]">
          
          {/* Coluna 1: Sobre a Loja */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-serif italic font-bold text-white text-xl">
                Wê Lembrancinhas
              </span>
            </div>
            <p className="text-xs text-[#B5A89E] leading-relaxed mb-4">
              Lembrancinhas personalizadas e papelaria afetiva criadas à mão com amor e precisão por <strong>{STORE_CONFIG.artisanName}</strong>. Cada detalhe é planejado para tornar a sua celebração inesquecível.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#D8CDC4]">
              <MapPin size={14} className="text-[#D4AF37]" />
              <span>Atendimento em Pouso Alegre - MG & Paraisópolis - MG</span>
            </div>
          </div>

          {/* Coluna 2: Redes & Contato */}
          <div>
            <h4 className="font-serif font-bold text-white text-sm mb-3">
              Conecte-se Conosco
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href={STORE_CONFIG.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#D8CDC4] hover:text-white transition"
                >
                  <InstagramIcon size={14} className="text-[#D4AF37]" />
                  <span>Instagram: @{STORE_CONFIG.instagram}</span>
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${STORE_CONFIG.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#D8CDC4] hover:text-white transition"
                >
                  <span>WhatsApp para Encomendas</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Rodapé inferior */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#8C7A6B]">
          <p>© 2026 Wê Lembrancinhas. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

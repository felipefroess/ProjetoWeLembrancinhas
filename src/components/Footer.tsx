'use client';

import React from 'react';
import { MapPin, Heart, Code, Sparkles } from 'lucide-react';
import { InstagramIcon } from '@/components/InstagramIcon';
import { STORE_CONFIG } from '@/data/products';

export function Footer() {
  return (
    <footer className="bg-[#2D231E] text-[#D8CDC4] pt-12 pb-8 border-t border-[#4A3B32]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-[#4A3B32]">
          
          {/* Coluna 1: Sobre a Loja */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-serif italic font-bold text-white text-xl">
                Wê Lembrancinhas
              </span>
              <Sparkles size={16} className="text-[#D4AF37]" />
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
                  <span>💬 WhatsApp para Encomendas</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Créditos de Engenharia de Software (Inatel) */}
          <div className="bg-[#3E2E25] p-4 rounded-2xl border border-[#52443C]">
            <div className="flex items-center gap-2 mb-2 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
              <Code size={14} />
              <span>Engenharia de Software</span>
            </div>
            <p className="text-xs text-[#D8CDC4] leading-relaxed mb-3">
              Site projetado e desenvolvido por <strong>Felipe Fróes</strong>, estudante de <strong>Engenharia de Software no Inatel</strong> (Instituto Nacional de Telecomunicações).
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11px] text-[#A69588] bg-[#2D231E] px-2.5 py-1 rounded-full border border-[#52443C]">
              <Heart size={11} className="text-[#D97762] fill-[#D97762]" />
              <span>Desenvolvido com carinho para a mãe</span>
            </div>
          </div>
        </div>

        {/* Rodapé inferior */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#8C7A6B]">
          <p>© 2026 Wê Lembrancinhas. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Next.js • TypeScript • Tailwind CSS • App Router
          </p>
        </div>
      </div>
    </footer>
  );
}

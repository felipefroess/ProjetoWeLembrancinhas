'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { STORE_CONFIG } from '@/data/products';

export function WhatsappButton() {
  const whatsappUrl = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent('Olá, Wenilze! Visitei o seu site Wê Lembrancinhas e gostaria de tirar uma dúvida!')}`;

  return (
    <aside aria-label="Atendimento via WhatsApp" className="fixed bottom-6 right-6 z-40">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:translate-y-0"
        title="Falar direto no WhatsApp"
      >
        <MessageCircle size={22} className="animate-pulse" />
        <span className="text-xs font-bold tracking-wide hidden sm:inline">
          Dúvidas? Fale Conosco
        </span>
      </a>
    </aside>
  );
}

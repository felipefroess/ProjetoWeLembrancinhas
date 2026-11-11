'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { STORE_CONFIG } from '@/data/products';
import styles from './WhatsappButton.module.css';

export function WhatsappButton() {
  const { settings } = useStoreSettings();
  const phone = settings.whatsappNumber || STORE_CONFIG.whatsappNumber;
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent('Olá, Wê! Visitei o seu site Wê Lembrancinhas e gostaria de tirar uma dúvida!')}`;

  return (
    <aside aria-label="Atendimento via WhatsApp" className={styles.floatingContainer}>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.whatsappLink}
        title="Falar direto no WhatsApp"
      >
        <MessageCircle size={22} className={styles.whatsappIcon} />
        <span className={styles.buttonText}>
          Fale Conosco
        </span>
      </a>
    </aside>
  );
}

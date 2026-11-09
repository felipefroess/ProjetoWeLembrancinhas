'use client';

import React from 'react';
import { Clock, Truck, Gift } from 'lucide-react';
import { STORE_CONFIG } from '@/data/products';
import styles from './HeroBanner.module.css';

export function HeroBanner() {
  const scrollToCatalog = () => {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className={styles.heroSection}>
      {/* Elementos decorativos de fundo */}
      <div className={styles.decorCircleTop} />
      <div className={styles.decorCircleBottom} />

      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Transformando momentos únicos em memórias inesquecíveis.
          </h1>

          <p className={styles.heroSubtitle}>
            Lembrancinhas, Topos de bolo 3D, e papelaria personalizada com o nome e tema do seu evento.
          </p>

          <div className={styles.buttonGroup}>
            <button
              onClick={scrollToCatalog}
              className={styles.primaryButton}
            >
              Ver Catálogo & Montar Pedido
            </button>
            <a
              href={`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent('Olá, Wenilze! Gostaria de tirar uma dúvida sobre lembrancinhas personalizadas.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappButton}
            >
              Falar no WhatsApp
            </a>
          </div>

          {/* Destaques de confiança (Value Props) */}
          <div className={styles.valuePropsGrid}>
            <div className={styles.valuePropCard}>
              <Gift size={18} className={styles.propIcon} />
              <div>
                <p className={styles.propTitle}>100% Personalizado</p>
                <p className={styles.propSubtitle}>Com o tema e nome</p>
              </div>
            </div>

            <div className={styles.valuePropCard}>
              <Clock size={18} className={styles.propIcon} />
              <div>
                <p className={styles.propTitle}>Produção Rápida</p>
                <p className={styles.propSubtitle}>A partir de 5 dias úteis</p>
              </div>
            </div>

            <div className={styles.valuePropCard}>
              <Truck size={18} className={styles.propIcon} />
              <div>
                <p className={styles.propTitle}>Retirada ou Envio</p>
                <p className={styles.propSubtitle}>Pouso Alegre e para todo o Brasil</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

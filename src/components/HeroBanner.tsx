'use client';

import React from 'react';
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
            <span>+7 anos de empresa</span>
            <span className={styles.bulletDot} aria-hidden="true" />
            <span>Produção 100% artesanal</span>
            <span className={styles.bulletDot} aria-hidden="true" />
            <span>Envio seguro para todo o Brasil.</span>
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
        </div>
      </div>
    </section>
  );
}

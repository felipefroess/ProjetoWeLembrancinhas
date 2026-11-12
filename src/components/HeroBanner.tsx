'use client';

import React from 'react';
import { Gift, SlidersHorizontal, MessageCircle } from 'lucide-react';
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
            <span><span className={styles.plusSign}>+</span>7 anos de empresa</span>
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
          </div>

          {/* 3 Passos Simples Didáticos */}
          <div className={styles.stepsSection}>
            <div className={styles.stepsHeader}>
              <span className={styles.stepsTag}>Como funciona</span>
              <h3 className={styles.stepsTitle}>Fazer seu pedido é simples e rápido:</h3>
            </div>

            <div className={styles.stepsGrid}>
              {/* Passo 1 */}
              <div className={styles.stepCard}>
                <div className={styles.stepIconWrap}>
                  <span className={styles.stepNumber}>1</span>
                  <Gift size={20} className={styles.stepIcon} />
                </div>
                <h4 className={styles.stepHeading}>1. Escolha seu Mimo</h4>
                <p className={styles.stepText}>
                  Navegue pelo catálogo e escolha a lembrancinha ou tema desejado.
                </p>
              </div>

              {/* Passo 2 */}
              <div className={styles.stepCard}>
                <div className={styles.stepIconWrap}>
                  <span className={styles.stepNumber}>2</span>
                  <SlidersHorizontal size={20} className={styles.stepIcon} />
                </div>
                <h4 className={styles.stepHeading}>2. Personalize Tudo</h4>
                <p className={styles.stepText}>
                  Defina modelos, cores de laço, nomes e frases direto na tela.
                </p>
              </div>

              {/* Passo 3 */}
              <div className={styles.stepCard}>
                <div className={styles.stepIconWrap}>
                  <span className={styles.stepNumber}>3</span>
                  <MessageCircle size={20} className={styles.stepIcon} />
                </div>
                <h4 className={styles.stepHeading}>3. Combine no WhatsApp</h4>
                <p className={styles.stepText}>
                  Seu pedido chega formatado para alinharmos fotos, arte e entrega com carinho!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

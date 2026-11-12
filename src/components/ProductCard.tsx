'use client';

import React from 'react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Clock, Heart } from 'lucide-react';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  isMostRequested?: boolean;
}

export function ProductCard({ product, isMostRequested }: ProductCardProps) {
  const { openCustomizationModal } = useCart();

  const variationPrices = (product.variations || [])
    .map((v) => v.price)
    .filter((p): p is number => typeof p === 'number' && p > 0);
  
  const minPrice = variationPrices.length > 0 ? Math.min(product.price, ...variationPrices) : product.price;
  const hasVaryingPrices = variationPrices.length > 0 && (Math.min(...variationPrices) !== Math.max(...variationPrices, product.price));

  const formattedPrice = minPrice.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });


  return (
    <div className={styles.productCard}>
      {/* Container da Imagem com Tag - Clicável para abrir personalização */}
      <div 
        className={styles.imageContainer}
        onClick={() => openCustomizationModal(product)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openCustomizationModal(product);
          }
        }}
        title={`Clique para personalizar ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          className={styles.mainImage}
          loading="lazy"
        />

        {/* Badges superiores */}
        <div className={styles.badgesWrapper}>
          {isMostRequested && (
            <span className={styles.popularBadge}>
              Mais Vendido
            </span>
          )}
          {product.minQuantity > 1 && (
            <span className={styles.minQtyBadge}>
              Mínimo: {product.minQuantity} un.
            </span>
          )}
        </div>

        {/* Prazo de Produção */}
        <div className={styles.leadTimeBadge}>
          <Clock size={11} className={styles.leadTimeIcon} />
          <span>{product.leadTimeDays} dias úteis</span>
        </div>
      </div>

      {/* Conteúdo do Card */}
      <div className={styles.cardContent}>
        <div>
          <h3 className={styles.productName}>
            {product.name}
          </h3>
          <p className={styles.productDescription}>
            {product.description}
          </p>

          {/* Miniaturas de variação estilo Mercado Livre */}
          {product.variations && product.variations.length > 0 && (
            <div className={styles.variationsRow}>
              <span className={styles.variationsLabel}>Modelos:</span>
              <div className={styles.variationsList}>
                {product.variations.map((v) => (
                  <div
                    key={v.id}
                    className={styles.variationThumb}
                    title={v.name}
                  >
                    <img src={v.image} alt={v.name} loading="lazy" decoding="async" width={36} height={36} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preço e Botão */}
        <div className={styles.cardFooter}>
          <div>
            <span className={styles.unitLabel}>
              {hasVaryingPrices ? `A partir de / ${product.unit}` : `Valor por ${product.unit}`}
            </span>
            <span className={styles.priceValue}>
              {formattedPrice}
            </span>
          </div>

          <button
            onClick={() => openCustomizationModal(product)}
            className={styles.customizeButton}
          >
            <Heart size={13} className={styles.heartIcon} />
            <span>Personalizar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

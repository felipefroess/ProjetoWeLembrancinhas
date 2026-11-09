'use client';

import React from 'react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Clock, Heart } from 'lucide-react';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { openCustomizationModal } = useCart();

  const formattedPrice = product.price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const hasMultipleImages = product.images && product.images.length > 1;

  return (
    <div className={styles.productCard}>
      {/* Container da Imagem com Tag */}
      <div className={styles.imageContainer}>
        <img
          src={product.image}
          alt={product.name}
          className={`${styles.mainImage} ${hasMultipleImages ? styles.mainImageFade : styles.mainImageScale}`}
          loading="lazy"
        />
        {hasMultipleImages && (
          <img
            src={product.images![1]}
            alt={`${product.name} verso`}
            className={styles.hoverImage}
            loading="lazy"
          />
        )}

        {/* Badges superiores */}
        <div className={styles.badgesWrapper}>
          {product.popular && (
            <span className={styles.popularBadge}>
              Mais Pedido
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
                    <img src={v.image} alt={v.name} />
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
              Valor por {product.unit}
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

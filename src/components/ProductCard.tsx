'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductVariation } from '@/types';
import { useCart } from '@/context/CartContext';
import { Clock, Heart } from 'lucide-react';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  isMostRequested?: boolean;
}

export function ProductCard({ product, isMostRequested }: ProductCardProps) {
  const { openCustomizationModal } = useCart();
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [currentImage, setCurrentImage] = useState<string>(product.image);

  // Mantém a imagem atualizada caso as propriedades do produto mudem
  useEffect(() => {
    setCurrentImage(product.image);
    setSelectedVariation(null);
  }, [product.image]);

  const variationPrices = (product.variations || [])
    .map((v) => v.price)
    .filter((p): p is number => typeof p === 'number' && p > 0);
  
  const minPrice = variationPrices.length > 0 ? Math.min(product.price, ...variationPrices) : product.price;
  const hasVaryingPrices = variationPrices.length > 0 && (Math.min(...variationPrices) !== Math.max(...variationPrices, product.price));

  const displayPrice = selectedVariation && typeof selectedVariation.price === 'number' && selectedVariation.price > 0
    ? selectedVariation.price
    : minPrice;

  const formattedPrice = displayPrice.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const displayDescription =
    selectedVariation && selectedVariation.description && selectedVariation.description.trim()
      ? selectedVariation.description.trim()
      : product.description;

  const handleSelectVariation = (e: React.MouseEvent, v: ProductVariation) => {
    e.stopPropagation();
    setSelectedVariation(v);
    const targetImage = (v.images && v.images.length > 0) ? v.images[0] : v.image;
    if (targetImage) {
      setCurrentImage(targetImage);
    }
  };

  const handleOpenModal = () => {
    openCustomizationModal(product, selectedVariation?.id);
  };

  return (
    <div className={styles.productCard}>
      {/* Container da Imagem com Tag - Clicável para abrir personalização */}
      <div 
        className={styles.imageContainer}
        onClick={handleOpenModal}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpenModal();
          }
        }}
        title={`Clique para personalizar ${product.name}`}
      >
        <img
          src={currentImage}
          alt={selectedVariation ? `${product.name} - ${selectedVariation.name}` : product.name}
          className={styles.mainImage}
          loading="lazy"
        />

        {/* Badges superiores */}
        <div className={styles.badgesWrapper}>
          {(isMostRequested || product.isBestSeller) && (
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
            {displayDescription}
          </p>

          {/* Miniaturas de variação estilo Mercado Livre */}
          {product.variations && product.variations.length > 0 && (
            <div className={styles.variationsRow}>
              <span className={styles.variationsLabel}>Modelos:</span>
              <div className={styles.variationsList}>
                {product.variations.map((v) => {
                  const isSelected = selectedVariation?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      className={`${styles.variationThumb} ${isSelected ? styles.variationThumbActive : ''}`}
                      title={`Modelo: ${v.name}`}
                      onClick={(e) => handleSelectVariation(e, v)}
                      aria-label={`Selecionar modelo ${v.name}`}
                    >
                      <img src={v.image} alt={v.name} loading="lazy" decoding="async" width={36} height={36} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Preço e Botão */}
        <div className={styles.cardFooter}>
          <div>
            <span className={styles.unitLabel}>
              {selectedVariation && typeof selectedVariation.price === 'number' && selectedVariation.price > 0
                ? `Valor por ${product.unit}`
                : (hasVaryingPrices ? `A partir de / ${product.unit}` : `Valor por ${product.unit}`)}
            </span>
            <span className={styles.priceValue}>
              {formattedPrice}
            </span>
          </div>

          <button
            onClick={handleOpenModal}
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

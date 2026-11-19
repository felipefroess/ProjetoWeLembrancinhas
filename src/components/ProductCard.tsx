'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductVariation } from '@/types';
import { useCart } from '@/context/CartContext';
import { Tag, Heart } from 'lucide-react';
import { CATEGORIES } from '@/data/categories';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  isMostRequested?: boolean;
  categoryName?: string;
}

export function ProductCard({ product, isMostRequested, categoryName }: ProductCardProps) {
  const { openCustomizationModal } = useCart();
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [currentImage, setCurrentImage] = useState<string>(product.image);

  // Nome da categoria legível para exibição na caixa do produto
  const resolvedCategoryName =
    categoryName ||
    CATEGORIES.find((c) => c.id === product.category)?.name ||
    (product.category && product.category !== 'todos'
      ? (product.category.includes('anivers')
          ? 'Aniversário Infantil'
          : product.category.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
      : '');

  // Mantém a imagem atualizada caso as propriedades do produto mudem
  useEffect(() => {
    setCurrentImage(product.image);
    setSelectedVariation(null);
  }, [product.image]);

  const rawProductPrice = typeof product.price === 'number' ? product.price : parseFloat(String(product.price || 0)) || 0;

  const variationPrices = (product.variations || [])
    .map((v) => (typeof v.price === 'number' ? v.price : parseFloat(String(v.price || 0))))
    .filter((p): p is number => typeof p === 'number' && !isNaN(p) && p > 0);
  
  const minPrice = variationPrices.length > 0 ? Math.min(rawProductPrice, ...variationPrices) : rawProductPrice;
  const hasVaryingPrices = variationPrices.length > 0 && (Math.min(...variationPrices) !== Math.max(...variationPrices, rawProductPrice));

  const displayPrice = selectedVariation && typeof selectedVariation.price === 'number' && selectedVariation.price > 0
    ? selectedVariation.price
    : minPrice;

  const validDiscounts = (product.quantityDiscounts || []).filter(
    (d) => typeof d.price === 'number' && d.price > 0 && typeof d.minQuantity === 'number' && d.minQuantity > 1
  );
  const lowestTierPrice = validDiscounts.length > 0
    ? Math.min(...validDiscounts.map((d) => d.price))
    : null;
  const hasQuantityDiscounts = validDiscounts.length > 0;

  const formattedPrice = (Number(displayPrice) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const displayDescription =
    selectedVariation && selectedVariation.description && selectedVariation.description.trim()
      ? selectedVariation.description.trim()
      : (product.description || '');

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
          {hasQuantityDiscounts && (
            <span style={{
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              padding: '2px 7px',
              borderRadius: '9999px',
              fontSize: '0.68rem',
              fontWeight: 700,
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
            }}>
              Atacado
            </span>
          )}
          {product.minQuantity > 1 && (
            <span className={styles.minQtyBadge}>
              Mínimo: {product.minQuantity} un.
            </span>
          )}
        </div>

        {/* Categoria do Produto (substituiu o antigo "5 dias úteis") */}
        {resolvedCategoryName && (
          <div className={styles.categoryBadge} title={`Categoria: ${resolvedCategoryName}`}>
            <Tag size={10} className={styles.categoryIcon} />
            <span>{resolvedCategoryName}</span>
          </div>
        )}
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
            {Boolean(product.originalPrice && product.originalPrice > displayPrice) && (
              <span style={{ display: 'block', fontSize: '0.72rem', textDecoration: 'line-through', color: '#9ca3af', lineHeight: 1.1 }}>
                De {product.originalPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            )}
            <span className={styles.unitLabel}>
              {selectedVariation && typeof selectedVariation.price === 'number' && selectedVariation.price > 0
                ? `Valor por ${product.unit}`
                : (hasVaryingPrices ? `A partir de / ${product.unit}` : `Valor por ${product.unit}`)}
            </span>
            <span className={styles.priceValue}>
              {formattedPrice}
            </span>
            {Boolean(lowestTierPrice && lowestTierPrice < displayPrice) && (
              <span style={{ display: 'block', fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginTop: 2 }}>
                Até {lowestTierPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} no atacado
              </span>
            )}
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

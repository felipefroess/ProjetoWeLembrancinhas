'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { ProductVariation } from '@/types';
import { X, Check, Clock, AlertCircle } from 'lucide-react';
import styles from './ProductModal.module.css';

export function ProductModal() {
  const {
    isCustomizingModalOpen,
    closeCustomizationModal,
    selectedProductForCustomization: product,
    addToCart,
  } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [theme, setTheme] = useState('');
  const [childName, setChildName] = useState('');
  const [ageOrDate, setAgeOrDate] = useState('');
  const [ribbonColor, setRibbonColor] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);

  // Reseta os campos ao abrir o modal para um novo produto
  useEffect(() => {
    if (product) {
      setQuantity(product.minQuantity || 1);
      setTheme('');
      setChildName('');
      setAgeOrDate('');
      setRibbonColor(product.availableRibbonColors?.[0] || '');
      setNotes('');
      const initialVariation = product.variations?.[0] || null;
      setSelectedVariation(initialVariation);
      setSelectedImage(initialVariation ? initialVariation.image : product.image);
    }
  }, [product]);

  if (!isCustomizingModalOpen || !product) {
    return null;
  }

  const subtotal = product.price * quantity;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    addToCart(product, quantity, {
      variation: selectedVariation ? selectedVariation.name : undefined,
      theme: theme.trim() || undefined,
      childName: childName.trim() || undefined,
      ageOrDate: ageOrDate.trim() || undefined,
      ribbonColor: ribbonColor || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className={styles.modalOverlay}>
      <div 
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            Personalize seu Pedido
          </h3>
          <button
            onClick={closeCustomizationModal}
            className={styles.closeButton}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className={styles.modalBody}>
          
          {/* Resumo do Produto Selecionado */}
          <div className={styles.productSummary}>
            <div className={styles.productImagesWrapper}>
              <img
                src={selectedImage || product.image}
                alt={product.name}
                className={styles.productMainImg}
              />
              {product.images && product.images.length > 1 && (
                <div className={styles.thumbnailsRow}>
                  {product.images.map((img, idx) => {
                    const isCurrent = (selectedImage || product.image) === img;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImage(img)}
                        className={isCurrent ? styles.thumbnailButtonActive : styles.thumbnailButton}
                      >
                        <img src={img} alt="Foto adicional" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={styles.productDetails}>
              <div>
                <h4 className={styles.summaryTitle}>
                  {product.name}
                </h4>
                <p className={styles.summaryDescription}>
                  {product.description}
                </p>
              </div>
              <div className={styles.summaryMeta}>
                <span className={styles.summaryPrice}>
                  {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {product.unit}
                </span>
                <span className={styles.summaryLeadTime}>
                  <Clock size={12} /> Produção: {product.leadTimeDays} dias úteis
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleConfirm} id="customization-form" className={styles.formSpace}>
            
            {/* Aviso sobre personalização artesanal */}
            <div className={styles.craftAlert}>
              <AlertCircle size={16} className={styles.alertIcon} />
              <span>
                A Wenilze prepara cada detalhe exclusivamente para a sua comemoração. Preencha os campos abaixo para elaboração da arte.
              </span>
            </div>

            {/* Seletor de Variações com Imagem (Estilo Mercado Livre) */}
            {product.variations && product.variations.length > 0 && (
              <div className={styles.variationsCard}>
                <div className={styles.variationsHeader}>
                  <label className={styles.variationsTitle}>
                    Escolha o Modelo:
                  </label>
                  {selectedVariation && (
                    <span className={styles.selectedVariationPill}>
                      {selectedVariation.name}
                    </span>
                  )}
                </div>

                <div className={styles.variationsGrid}>
                  {product.variations.map((v) => {
                    const isSelected = selectedVariation?.id === v.id;

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariation(v);
                          setSelectedImage(v.image);
                        }}
                        className={isSelected ? styles.variationItemSelected : styles.variationItem}
                        title={v.name}
                      >
                        <div className={styles.variationImageWrap}>
                          <img
                            src={v.image}
                            alt={v.name}
                          />
                        </div>
                        <span className={styles.variationName}>
                          {v.name}
                        </span>
                        {isSelected && (
                          <span className={styles.variationCheck}>
                            <Check size={12} className="stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedVariation?.description && (
                  <p className={styles.variationDescNote}>
                    {selectedVariation.description}
                  </p>
                )}
              </div>
            )}

            {/* Linha 1: Tema e Nome */}
            <div className={styles.twoColsGrid}>
              <div>
                <label className={styles.formLabel}>
                  Tema / Detalhes da Arte <span className={styles.reqStar}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corujinha, Frase Especial, Papai Noel..."
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div>
                <label className={styles.formLabel}>
                  Nome na Lembrancinha <span className={styles.reqStar}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Professora Leandra, Tia Amanda, Luís..."
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className={styles.formInput}
                />
              </div>
            </div>

            {/* Linha 2: Idade/Data e Cor de Laço */}
            <div className={styles.twoColsGrid}>
              <div>
                <label className={styles.formLabel}>
                  Ano ou Mensagem Curta
                </label>
                <input
                  type="text"
                  placeholder="Ex: Natal 2026, Boas Festas..."
                  value={ageOrDate}
                  onChange={(e) => setAgeOrDate(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              {product.availableRibbonColors && product.availableRibbonColors.length > 0 && (
                <div>
                  <label className={styles.formLabel}>
                    Cor dos Laços / Fitas
                  </label>
                  <select
                    value={ribbonColor}
                    onChange={(e) => setRibbonColor(e.target.value)}
                    className={styles.formInput}
                  >
                    {product.availableRibbonColors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Observações livres */}
            <div>
              <label className={styles.formLabel}>
                Observações Especiais (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Gostaria de tons pastéis, glitter prateado, frase bíblica específica..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={styles.formTextarea}
              />
            </div>

            {/* Controle de Quantidade */}
            <div className={styles.qtySection}>
              <div>
                <span className={styles.qtyLabel}>
                  Quantidade ({product.unit})
                </span>
                {product.minQuantity > 1 && (
                  <span className={styles.minQtyNote}>
                    Pedido mínimo: {product.minQuantity} unidades
                  </span>
                )}
              </div>

              <div className={styles.qtyControl}>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(product.minQuantity, q - 1))}
                  disabled={quantity <= product.minQuantity}
                  className={styles.qtyBtn}
                >
                  -
                </button>
                <span className={styles.qtyValue}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className={styles.qtyBtn}
                >
                  +
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Rodapé com Subtotal e Ação de Adicionar */}
        <div className={styles.modalFooter}>
          <div>
            <span className={styles.subtotalLabel}>
              Subtotal do Item
            </span>
            <span className={styles.subtotalValue}>
              {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          <button
            type="submit"
            form="customization-form"
            className={styles.submitBtn}
          >
            <Check size={18} />
            <span>Adicionar ao Pedido</span>
          </button>
        </div>
      </div>
    </div>
  );
}

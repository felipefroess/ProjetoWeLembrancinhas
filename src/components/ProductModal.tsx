'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { ProductVariation } from '@/types';
import { 
  X, 
  Check, 
  Clock, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  RotateCcw 
} from 'lucide-react';
import styles from './ProductModal.module.css';

export function ProductModal() {
  const {
    isCustomizingModalOpen,
    closeCustomizationModal,
    selectedProductForCustomization: product,
    addToCart,
  } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [childName, setChildName] = useState('');
  const [ribbonColor, setRibbonColor] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);

  // Estados e referências para controle de Zoom interativo
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ dist: number; scale: number; x: number; y: number; posX: number; posY: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({ x: 0, y: 0, posX: 0, posY: 0 });

  // Reseta os campos ao abrir o modal para um novo produto
  useEffect(() => {
    if (product) {
      setQuantity(product.minQuantity || 1);
      setChildName('');
      setRibbonColor(product.availableRibbonColors?.[0] || '');
      setNotes('');
      const initialVariation = product.variations?.[0] || null;
      setSelectedVariation(initialVariation);
      const initialImg = initialVariation?.images?.[0] || initialVariation?.image || product.image;
      setSelectedImage(initialImg);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [product]);

  // Reseta o zoom sempre que a imagem selecionada mudar
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [selectedImage]);

  // Zoom pelo scroll do mouse (com passive: false para prevenir scroll do modal)
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container || !isCustomizingModalOpen) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomStep = 0.25;
      setScale((prevScale) => {
        const nextScale = e.deltaY < 0 
          ? Math.min(3.5, prevScale + zoomStep) 
          : Math.max(1, prevScale - zoomStep);
        if (nextScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
        return Number(nextScale.toFixed(2));
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isCustomizingModalOpen]);

  if (!isCustomizingModalOpen || !product) {
    return null;
  }

  const hasVariations = Boolean(product.variations && product.variations.length > 1);
  const subtotal = product.price * quantity;

  // Lista de imagens para navegação por setas:
  // Se a variação selecionada tiver suas próprias fotos (ex: modelo com foto fechado e aberto), usa elas!
  const imagesList = (selectedVariation?.images && selectedVariation.images.length > 0)
    ? selectedVariation.images
    : (product.images && product.images.length > 0 ? product.images : [product.image]);
  const currentImageIndex = imagesList.indexOf(selectedImage || product.image);
  const validIndex = currentImageIndex >= 0 ? currentImageIndex : 0;

  // Navegação: Foto anterior
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = validIndex <= 0 ? imagesList.length - 1 : validIndex - 1;
    const targetImage = imagesList[newIndex];
    setSelectedImage(targetImage);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Navegação: Próxima foto
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = validIndex >= imagesList.length - 1 ? 0 : validIndex + 1;
    const targetImage = imagesList[newIndex];
    setSelectedImage(targetImage);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom no mobile via pinça de 2 dedos (Pinch-to-zoom) e arrasto com 1 dedo
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = {
        dist,
        scale,
        x: 0,
        y: 0,
        posX: position.x,
        posY: position.y,
      };
    } else if (e.touches.length === 1 && scale > 1) {
      touchStartRef.current = {
        dist: 0,
        scale,
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        posX: position.x,
        posY: position.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    if (e.touches.length === 2) {
      if (e.cancelable) e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStartRef.current.dist;
      const nextScale = Math.min(3.5, Math.max(1, touchStartRef.current.scale * ratio));
      setScale(Number(nextScale.toFixed(2)));
      if (nextScale === 1) setPosition({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && scale > 1) {
      if (e.cancelable) e.preventDefault();
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      setPosition({
        x: touchStartRef.current.posX + dx,
        y: touchStartRef.current.posY + dy,
      });
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  // Arrasto no Desktop quando a imagem está com zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current && scale > 1) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPosition({
        x: dragStartRef.current.posX + dx,
        y: dragStartRef.current.posY + dy,
      });
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Duplo clique alterna entre zoom 2.2x e 1x
  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.2);
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    addToCart(product, quantity, {
      variation: selectedVariation ? selectedVariation.name : undefined,
      childName: childName.trim() || undefined,
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

        {/* Corpo com scroll em layout de 2 colunas */}
        <div className={styles.modalBody}>
          <div className={styles.modalGrid}>
            
            {/* ========================================================
                COLUNA DA ESQUERDA: Foto Inteira com Zoom e Setas
               ======================================================== */}
            <div className={styles.leftColumn}>
              <div className={styles.imageGalleryWrapper}>
                
                {/* Container Principal com Suporte a Zoom (Scroll e Pinça) */}
                <div 
                  ref={imageContainerRef}
                  className={styles.mainImageContainer}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onDoubleClick={handleDoubleClick}
                  style={{
                    cursor: scale > 1 ? (isDraggingRef.current ? 'grabbing' : 'grab') : 'zoom-in'
                  }}
                >
                  <img
                    src={selectedImage || product.image}
                    alt={product.name}
                    className={styles.productMainImg}
                    style={{
                      transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                      transition: scale === 1 ? 'transform 0.25s ease' : 'none',
                    }}
                    draggable={false}
                  />

                  {/* Setas de Navegação (Exibidas quando há mais de 1 foto) */}
                  {imagesList.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        className={styles.navArrowLeft}
                        aria-label="Foto anterior"
                        title="Foto anterior"
                      >
                        <ChevronLeft size={22} />
                      </button>

                      <button
                        type="button"
                        onClick={handleNextImage}
                        className={styles.navArrowRight}
                        aria-label="Próxima foto"
                        title="Próxima foto"
                      >
                        <ChevronRight size={22} />
                      </button>

                      {/* Contador de Fotos */}
                      <div className={styles.imageCounterBadge}>
                        <span>{validIndex + 1} / {imagesList.length}</span>
                      </div>
                    </>
                  )}

                  {/* Indicador de Zoom ou Botão para Redefinir */}
                  {scale > 1 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setScale(1);
                        setPosition({ x: 0, y: 0 });
                      }}
                      className={styles.zoomResetButton}
                      title="Clique para voltar ao tamanho original"
                    >
                      <RotateCcw size={12} />
                      <span>{Math.round(scale * 100)}% • Redefinir</span>
                    </button>
                  ) : (
                    <div className={styles.zoomHintPill}>
                      <ZoomIn size={12} />
                      <span>Scroll ou pinça para zoom</span>
                    </div>
                  )}
                </div>

                {/* 
                  Miniaturas de fotos adicionais:
                  APENAS para produtos de modelo único que possuem múltiplos ângulos/fotos.
                  Para produtos com múltiplos modelos, não exibe miniaturas aqui.
                */}
                {!hasVariations && product.images && product.images.length > 1 && (
                  <div className={styles.thumbnailsRow}>
                    {product.images.map((img, idx) => {
                      const isCurrent = (selectedImage || product.image) === img;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedImage(img);
                            setScale(1);
                            setPosition({ x: 0, y: 0 });
                          }}
                          className={isCurrent ? styles.thumbnailButtonActive : styles.thumbnailButton}
                          title="Ver outra foto do produto"
                        >
                          <img src={img} alt="Foto adicional" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Informações: Título, Descrição, Preço e Prazo */}
              <div className={styles.productInfoBlock}>
                <h4 className={styles.productTitle}>
                  {product.name}
                </h4>

                <p className={styles.productDescription}>
                  {product.description}
                </p>

                <div className={styles.metaRow}>
                  <span className={styles.productPrice}>
                    {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {product.unit}
                  </span>
                  <span className={styles.productLeadTime}>
                    <Clock size={13} /> Produção: {product.leadTimeDays} dias úteis
                  </span>
                </div>

                {/* Aviso afetivo */}
                <div className={styles.craftAlert}>
                  <AlertCircle size={16} className={styles.alertIcon} />
                  <span>
                    A Wenilze prepara cada detalhe exclusivamente para a sua comemoração.
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================
                COLUNA DA DIREITA: Modelos (se houver), Formulário e Quantidade
               ======================================================== */}
            <div className={styles.rightColumn}>
              <form onSubmit={handleConfirm} id="customization-form" className={styles.formSpace}>
                
                {/* Seletor de Modelo com Imagem (Estilo Mercado Livre) - APENAS para produtos com mais de um modelo */}
                {hasVariations && product.variations && (
                  <div className={styles.variationsCard}>
                    <div className={styles.variationsHeader}>
                      <label className={styles.variationsTitle}>
                        Modelos:
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
                              const defaultImg = (v.images && v.images.length > 0) ? v.images[0] : v.image;
                              setSelectedImage(defaultImg);
                              setScale(1);
                              setPosition({ x: 0, y: 0 });
                            }}
                            className={isSelected ? styles.variationItemSelected : styles.variationItem}
                            title={`Modelo: ${v.name}`}
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

                {/* Campos de Personalização */}
                <div className={styles.fieldsContainer}>
                  {/* Nome na Lembrancinha */}
                  <div>
                    <label className={styles.formLabel}>
                      Nome na Lembrancinha <span className={styles.reqStar}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Professora Leandra, Luís..."
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>

                  {/* Cor do Laço (se aplicável ao produto) */}
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

                  {/* Observações livres */}
                  <div>
                    <label className={styles.formLabel}>
                      Observações Especiais (opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Tons pastéis, glitter prateado, frase específica..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className={styles.formTextarea}
                    />
                  </div>
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

          </div>
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

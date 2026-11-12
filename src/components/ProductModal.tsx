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
  RotateCcw,
  Camera 
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
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [missingFields, setMissingFields] = useState<Record<string, boolean>>({});
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
      const defaultRibbon = product.customizationSettings?.ribbonColors?.[0] || product.availableRibbonColors?.[0] || '';
      setRibbonColor(defaultRibbon);
      setNotes('');
      setCustomFieldValues({});
      setMissingFields({});
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
  const currentPrice = (selectedVariation?.price && selectedVariation.price > 0)
    ? selectedVariation.price
    : product.price;
  const subtotal = currentPrice * quantity;

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

  const clearFieldError = (key: string) => {
    setMissingFields((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const renderRequiredPing = (key: string) => {
    if (!missingFields[key]) return null;
    return (
      <div className={styles.requiredPingBadge} role="alert">
        <span className={styles.pingDotWrap}>
          <span className={styles.pingDotRing} />
          <span className={styles.pingDotCore} />
        </span>
        <span>Informação obrigatória</span>
      </div>
    );
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, boolean> = {};
    let firstMissingKey: string | null = null;

    const markMissing = (key: string) => {
      errors[key] = true;
      if (!firstMissingKey) {
        firstMissingKey = key;
      }
    };

    if (
      product.customizationSettings?.allowChildName !== false &&
      product.customizationSettings?.childNameRequired !== false &&
      !childName.trim()
    ) {
      markMissing('childName');
    }

    const ribbonList =
      product.customizationSettings?.ribbonColors && product.customizationSettings.ribbonColors.length > 0
        ? product.customizationSettings.ribbonColors
        : product.availableRibbonColors;
    const shouldShowRibbon =
      product.customizationSettings?.allowRibbonColors ?? Boolean(ribbonList && ribbonList.length > 0);
    const isRibbonReq = Boolean(product.customizationSettings?.ribbonColorRequired);
    if (shouldShowRibbon && ribbonList && ribbonList.length > 0 && isRibbonReq && !ribbonColor.trim()) {
      markMissing('ribbonColor');
    }

    if (product.customizationSettings?.customFields) {
      for (const field of product.customizationSettings.customFields) {
        if (field.required !== false) {
          const fieldKey = field.label && field.label.trim() ? field.label.trim() : field.id;
          const val = customFieldValues[fieldKey];
          if (!val || !val.trim()) {
            markMissing(`custom_${field.id}`);
          }
        }
      }
    }

    if (firstMissingKey) {
      setMissingFields(errors);
      const targetKey = firstMissingKey;
      requestAnimationFrame(() => {
        fieldRefs.current[targetKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    addToCart(product, quantity, {
      variation: selectedVariation ? selectedVariation.name : undefined,
      childName: childName.trim() || undefined,
      ribbonColor: ribbonColor || undefined,
      notes: notes.trim() || undefined,
      customFieldValues: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
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
                  {(selectedVariation?.description && selectedVariation.description.trim())
                    ? selectedVariation.description.trim()
                    : product.description}
                </p>

                <div className={styles.metaRow}>
                  <span className={styles.productPrice}>
                    {currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {product.unit}
                  </span>
                  <span className={styles.productLeadTime}>
                    <Clock size={13} /> Produção: {product.leadTimeDays} dias úteis
                  </span>
                </div>

                {/* Aviso afetivo */}
                <div className={styles.craftAlert}>
                  <AlertCircle size={16} className={styles.alertIcon} />
                  <span>
                    A Wê prepara cada detalhe exclusivamente para a sua comemoração.
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

                    {(product.variationsNote || product.customizationSettings?.variationsNote) && (
                      <div className={styles.variationsNoticeBox}>
                        <Camera size={14} className={styles.variationsNoticeIcon} />
                        <span>{product.variationsNote || product.customizationSettings?.variationsNote}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Campos de Personalização com base nas configurações do produto */}
                <div className={styles.fieldsContainer}>
                  {/* Nome na Lembrancinha (exibido se allowChildName !== false) */}
                  {(product.customizationSettings?.allowChildName !== false) && (
                    <div ref={(el) => { fieldRefs.current['childName'] = el; }}>
                      {renderRequiredPing('childName')}
                      <label className={styles.formLabel}>
                        {product.customizationSettings?.childNameLabel || 'Nome na Lembrancinha'}{' '}
                        {product.customizationSettings?.childNameRequired !== false ? (
                          <span className={styles.reqStar}>*</span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#8C7A6B' }}>(opcional)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          product.customizationSettings?.childNamePlaceholder && product.customizationSettings.childNamePlaceholder.trim()
                            ? product.customizationSettings.childNamePlaceholder.trim()
                            : "Ex: Professora Leandra, Luís..."
                        }
                        value={childName}
                        onChange={(e) => {
                          setChildName(e.target.value);
                          if (e.target.value.trim()) clearFieldError('childName');
                        }}
                        className={`${styles.formInput} ${missingFields['childName'] ? styles.inputError : ''}`}
                      />
                    </div>
                  )}

                  {/* Cor do Laço/Fita (se ativado nas configurações do produto) */}
                  {(() => {
                    const ribbonList = product.customizationSettings?.ribbonColors && product.customizationSettings.ribbonColors.length > 0
                      ? product.customizationSettings.ribbonColors
                      : product.availableRibbonColors;
                    const shouldShow = product.customizationSettings?.allowRibbonColors ?? Boolean(ribbonList && ribbonList.length > 0);

                    if (!shouldShow || !ribbonList || ribbonList.length === 0) return null;

                    const isRibbonReq = Boolean(product.customizationSettings?.ribbonColorRequired);

                    return (
                      <div ref={(el) => { fieldRefs.current['ribbonColor'] = el; }}>
                        {renderRequiredPing('ribbonColor')}
                        <label className={styles.formLabel}>
                          Cor dos Laços / Fitas{' '}
                          {isRibbonReq ? (
                            <span className={styles.reqStar}>*</span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#8C7A6B' }}>(opcional)</span>
                          )}
                        </label>
                        <select
                          value={ribbonColor}
                          onChange={(e) => {
                            setRibbonColor(e.target.value);
                            if (e.target.value.trim()) clearFieldError('ribbonColor');
                          }}
                          className={`${styles.formInput} ${styles.formSelect} ${missingFields['ribbonColor'] ? styles.inputError : ''}`}
                        >
                          {isRibbonReq && <option value="">Selecione a cor do laço...</option>}
                          {ribbonList.map((color) => (
                            <option key={color} value={color}>
                              {color}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}

                  {/* Campos Extras Dinâmicos cadastrados no painel administrativo */}
                  {product.customizationSettings?.customFields && product.customizationSettings.customFields.map((field) => {
                    const fieldKey = field.label && field.label.trim() ? field.label.trim() : field.id;
                    const isReq = field.required !== false;
                    const inputPlaceholder = field.placeholder && field.placeholder.trim()
                      ? field.placeholder.trim()
                      : (field.label ? `Ex: ${field.label}...` : 'Digite aqui...');
                    const fieldErrKey = `custom_${field.id}`;
                    const hasErr = Boolean(missingFields[fieldErrKey]);

                    return (
                      <div key={field.id} ref={(el) => { fieldRefs.current[fieldErrKey] = el; }}>
                        {renderRequiredPing(fieldErrKey)}
                        <label className={styles.formLabel}>
                          {field.label}{' '}
                          {isReq ? (
                            <span className={styles.reqStar}>*</span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#8C7A6B' }}>(opcional)</span>
                          )}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            rows={2}
                            placeholder={inputPlaceholder}
                            value={customFieldValues[fieldKey] || ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCustomFieldValues((prev) => ({ ...prev, [fieldKey]: v }));
                              if (v.trim()) clearFieldError(fieldErrKey);
                            }}
                            className={`${styles.formTextarea} ${hasErr ? styles.inputError : ''}`}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={customFieldValues[fieldKey] || ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCustomFieldValues((prev) => ({ ...prev, [fieldKey]: v }));
                              if (v.trim()) clearFieldError(fieldErrKey);
                            }}
                            className={`${styles.formSelect} ${hasErr ? styles.inputError : ''}`}
                          >
                            <option value="">
                              {field.placeholder?.trim() || `Selecione ${field.label || 'uma opção'}...`}
                            </option>
                            {field.options && field.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder={inputPlaceholder}
                            value={customFieldValues[fieldKey] || ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCustomFieldValues((prev) => ({ ...prev, [fieldKey]: v }));
                              if (v.trim()) clearFieldError(fieldErrKey);
                            }}
                            className={`${styles.formInput} ${hasErr ? styles.inputError : ''}`}
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* Observações livres */}
                  {(product.customizationSettings?.allowNotes !== false) && (
                    <div>
                      <label className={styles.formLabel}>
                        Observações Especiais (opcional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder={
                          product.customizationSettings?.notesPlaceholder && product.customizationSettings.notesPlaceholder.trim()
                            ? product.customizationSettings.notesPlaceholder.trim()
                            : "Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial..."
                        }
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className={styles.formTextarea}
                      />
                    </div>
                  )}
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

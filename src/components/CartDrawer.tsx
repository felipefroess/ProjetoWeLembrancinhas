'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Trash2, ShoppingBag, ArrowRight, MessageCircle, Tag, Check } from 'lucide-react';
import styles from './CartDrawer.module.css';

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    totalItems,
    subtotalAmount,
    appliedCoupon,
    discountAmount,
    finalTotal,
    applyCoupon,
    removeCoupon,
    openCheckout,
  } = useCart();

  const [isStoreOnline, setIsStoreOnline] = useState<boolean>(true);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = couponInput.trim();
    if (!clean) return;

    setIsApplyingCoupon(true);
    setCouponError(null);
    setCouponSuccess(null);

    const res = await applyCoupon(clean);
    setIsApplyingCoupon(false);

    if (res.success) {
      setCouponSuccess(res.message);
      setCouponInput('');
      setTimeout(() => setCouponSuccess(null), 3500);
    } else {
      setCouponError(res.message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetch('/api/store-status')
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.isOnline === 'boolean') {
            setIsStoreOnline(data.isOnline);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.drawerOverlay}>
      <div 
        className={styles.drawerPanel}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className={styles.drawerHeader}>
          <div className={styles.headerTitleWrapper}>
            <ShoppingBag className={styles.headerIcon} size={20} />
            <h3 className={styles.headerTitle}>
              Meu Pedido ({totalItems})
            </h3>
          </div>
          <button
            onClick={closeCart}
            className={styles.closeButton}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lista de Itens */}
        <div className={styles.itemsList}>
          {items.length === 0 ? (
            <div className={styles.emptyCart}>
              <div className={styles.emptyIconCircle}>
                <ShoppingBag size={28} />
              </div>
              <h4 className={styles.emptyTitle}>
                Seu carrinho está vazio
              </h4>
              <p className={styles.emptySubtitle}>
                Escolha uma lembrancinha linda do catálogo e personalize com o tema do seu evento!
              </p>
              <button
                onClick={closeCart}
                className={styles.exploreButton}
              >
                Explorar Lembrancinhas
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.cartItemId}
                className={styles.cartItemCard}
              >
                <div className={styles.itemTopRow}>
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className={styles.itemThumbnail}
                  />
                  <div className={styles.itemInfo}>
                    <h5 className={styles.itemTitle}>
                      {item.product.name}
                    </h5>
                    <p className={styles.itemSubtotal}>
                      {item.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className={styles.itemUnitCalc}>
                      {item.quantity} x {item.product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.cartItemId)}
                    className={styles.removeButton}
                    title="Remover item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Detalhes de Personalização (renderiza apenas se houver dados) */}
                {Boolean(
                  (item.customization.variation && item.customization.variation.trim()) ||
                  (item.customization.theme && item.customization.theme.trim()) ||
                  (item.customization.childName && item.customization.childName.trim()) ||
                  (item.customization.ageOrDate && item.customization.ageOrDate.trim()) ||
                  (item.customization.ribbonColor && item.customization.ribbonColor.trim()) ||
                  (item.customization.notes && item.customization.notes.trim()) ||
                  (item.customization.customFieldValues &&
                    Object.values(item.customization.customFieldValues).some((v) => v && v.trim()))
                ) && (
                <div className={styles.customizationBox}>
                  {item.customization.variation && (
                    <p>
                      <strong>Modelo:</strong> {item.customization.variation}
                    </p>
                  )}
                  {item.customization.theme && (
                    <p>
                      <strong>Tema:</strong> {item.customization.theme}
                    </p>
                  )}
                  {item.customization.childName && (
                    <p>
                      <strong>Nome:</strong> {item.customization.childName}
                    </p>
                  )}
                  {item.customization.ageOrDate && (
                    <p>
                      <strong>Idade/Data:</strong> {item.customization.ageOrDate}
                    </p>
                  )}
                  {item.customization.ribbonColor && (
                    <p>
                      <strong>Fita:</strong> {item.customization.ribbonColor}
                    </p>
                  )}
                  {item.customization.notes && (
                    <p className={styles.notesQuote}>
                      &quot;{item.customization.notes}&quot;
                    </p>
                  )}
                  {item.customization.customFieldValues &&
                    Object.entries(item.customization.customFieldValues).map(([k, val]) =>
                      val && String(val).trim() ? (
                        <p key={k}>
                          <strong>{k}:</strong> {String(val)}
                        </p>
                      ) : null
                    )}
                </div>
                )}

                {/* Controle de Quantidade */}
                <div className={styles.quantityRow}>
                  <span className={styles.quantityLabel}>Quantidade:</span>
                  <div className={styles.quantityControls}>
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      className={styles.qtyButton}
                    >
                      -
                    </button>
                    <span className={styles.qtyDisplay}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      className={styles.qtyButton}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé do Carrinho com Total e Ação */}
        {items.length > 0 && (
          <div className={styles.drawerFooter}>
            {/* Seção de Cupom de Desconto */}
            <div className={styles.couponContainer}>
              {appliedCoupon ? (
                <div className={styles.appliedCouponCard}>
                  <div className={styles.appliedCouponInfo}>
                    <span className={styles.appliedCouponBadge}>
                      <Tag size={13} />
                      <strong>{appliedCoupon.code}</strong>
                    </span>
                    <span className={styles.appliedDiscountText}>
                      {appliedCoupon.type === 'percentage'
                        ? `-${appliedCoupon.value}% OFF`
                        : `-R$ ${appliedCoupon.value.toFixed(2).replace('.', ',')}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className={styles.removeCouponBtn}
                    title="Remover cupom"
                  >
                    <X size={14} />
                    <span>Remover</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className={styles.couponForm}>
                  <div className={styles.couponInputWrapper}>
                    <Tag size={15} className={styles.couponInputIcon} />
                    <input
                      type="text"
                      placeholder="Ex: PRIMEIRACOMPRA"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        if (couponError) setCouponError(null);
                      }}
                      className={styles.couponInput}
                      maxLength={25}
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                    <button
                      type="submit"
                      disabled={!couponInput.trim() || isApplyingCoupon}
                      className={styles.couponApplyButton}
                    >
                      {isApplyingCoupon ? '...' : 'Aplicar'}
                    </button>
                  </div>
                  {couponError && (
                    <span className={styles.couponErrorText}>
                      {couponError}
                    </span>
                  )}
                  {couponSuccess && (
                    <span className={styles.couponSuccessText}>
                      {couponSuccess}
                    </span>
                  )}
                </form>
              )}
            </div>

            {/* Linhas de Valores / Total */}
            {appliedCoupon && discountAmount > 0 ? (
              <div className={styles.pricingSummary}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Subtotal</span>
                  <span className={styles.summaryValue}>
                    {subtotalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className={styles.discountRow}>
                  <span className={styles.discountLabel}>
                    Desconto ({appliedCoupon.code})
                  </span>
                  <span className={styles.discountValue}>
                    - {discountAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Total Estimado</span>
                  <span className={styles.totalAmount}>
                    {finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            ) : (
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>
                  Total Estimado
                </span>
                <span className={styles.totalAmount}>
                  {subtotalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            )}

            {/* Aviso de loja offline */}
            {!isStoreOnline ? (
              <div className={styles.storeOfflineNotice}>
                <span className={styles.storeOfflineDot} />
                <div>
                  <strong>Recebimento de pedidos pausado</strong>
                  <p>A loja está temporariamente offline para novos pedidos. Você ainda pode navegar pelo catálogo!</p>
                </div>
              </div>
            ) : (
              <p className={styles.whatsappHint}>
                O pedido será enviado diretamente para a Wê no WhatsApp com todos os detalhes prontos!
              </p>
            )}

            <button
              onClick={() => {
                if (!isStoreOnline) return;
                openCheckout();
              }}
              disabled={!isStoreOnline}
              className={`${styles.checkoutButton} ${!isStoreOnline ? styles.checkoutButtonDisabled : ''}`}
            >
              <span>{isStoreOnline ? 'Avançar para Concluir' : 'Loja Offline para Pedidos'}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

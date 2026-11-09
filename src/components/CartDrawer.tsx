'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
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
    openCheckout,
  } = useCart();

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

                {/* Detalhes de Personalização */}
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
                </div>

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
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>
                Total Estimado
              </span>
              <span className={styles.totalAmount}>
                {subtotalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>

            <p className={styles.whatsappHint}>
              O pedido será enviado diretamente para a Wenilze no WhatsApp com todos os detalhes prontos!
            </p>

            <button
              onClick={openCheckout}
              className={styles.checkoutButton}
            >
              <span>Avançar para Concluir</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

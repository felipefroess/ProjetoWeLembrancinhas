'use client';

import React from 'react';
import { ShoppingBag, Search, X } from 'lucide-react';
import { InstagramIcon } from '@/components/InstagramIcon';
import { useCart } from '@/context/CartContext';
import { STORE_CONFIG } from '@/data/products';
import styles from './Header.module.css';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function Header({ searchQuery, setSearchQuery }: HeaderProps) {
  const { totalItems, openCart } = useCart();

  return (
    <header className={styles.headerSticky}>
      {/* Barra de Notificação Superior */}
      <div className={styles.topBanner}>
        <span>Produção artesanal feito <strong>com carinho</strong> • Envio para todo o Brasil</span>
      </div>

      <div className={styles.headerContainer}>
        <div className={styles.headerRow}>
          
          {/* Logo e Nome da Loja */}
          <div className={styles.logoWrapper}>
            <div className={styles.logoCircle}>
              <span className={styles.logoText}>
                Wê
              </span>
            </div>
            <div>
              <a href="#" className={styles.brandLink}>
                <span className={styles.brandTitle}>
                  Wê Lembrancinhas
                </span>
              </a>
            </div>
          </div>

          {/* Campo de Busca (Desktop) */}
          <div className={styles.searchWrapperDesktop}>
            <div className={styles.searchRelative}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="O que você procura?"
                className={styles.searchInput}
              />
              <Search className={styles.searchIcon} size={16} />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={styles.searchClearButton}
                  aria-label="Limpar busca"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Ações da Direita (Instagram e Carrinho) */}
          <div className={styles.actionsWrapper}>
            <a
              href={STORE_CONFIG.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.instagramLink}
              title="Ver nosso Instagram oficial"
            >
              <InstagramIcon size={15} className={styles.instagramIcon} />
              <span>@{STORE_CONFIG.instagram}</span>
            </a>

            {/* Botão do Carrinho */}
            <button
              onClick={openCart}
              className={styles.cartButton}
              aria-label="Abrir carrinho de compras"
            >
              <ShoppingBag size={18} />
              <span className={styles.cartText}>
                Meu Pedido
              </span>
              {totalItems > 0 && (
                <span className={styles.cartBadge}>
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Campo de Busca (Mobile) */}
        <div className={styles.searchWrapperMobile}>
          <div className={styles.searchRelative}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar topo de bolo, caixa milk, batizado..."
              className={styles.searchInput}
            />
            <Search className={styles.searchIcon} size={16} />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={styles.searchClearButton}
                aria-label="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

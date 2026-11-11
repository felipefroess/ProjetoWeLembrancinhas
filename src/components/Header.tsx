'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  X, 
  ArrowRight, 
  CornerDownLeft, 
  FolderHeart 
} from 'lucide-react';
import { InstagramIcon } from '@/components/InstagramIcon';
import { useCart } from '@/context/CartContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { STORE_CONFIG, PRODUCTS } from '@/data/products';
import { CATEGORIES } from '@/data/categories';
import { Product, Category, CategoryId } from '@/types';
import styles from './Header.module.css';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  products?: Product[];
  categories?: Category[];
  onSelectCategory?: (categoryId: CategoryId) => void;
}

function formatProductPrice(product: Product): string {
  const variationPrices = product.variations
    ?.map((v) => v.price)
    .filter((p): p is number => typeof p === 'number' && p > 0);
  const hasVariations = variationPrices && variationPrices.length > 0;
  const minPrice = hasVariations ? Math.min(...variationPrices) : product.price;
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(minPrice);
  return hasVariations && variationPrices.length > 1 ? `A partir de ${formatted}` : formatted;
}

export function Header({
  searchQuery,
  setSearchQuery,
  products = PRODUCTS,
  categories = CATEGORIES,
  onSelectCategory,
}: HeaderProps) {
  const { totalItems, openCart, openCustomizationModal } = useCart();
  const { settings } = useStoreSettings();
  const topBanner = settings.topBanner;
  const currentInstagram = settings.instagram || STORE_CONFIG.instagram;
  const currentInstagramUrl = settings.instagramUrl || STORE_CONFIG.instagramUrl;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Mapeia categorias por id para obter seus nomes rapidamente
  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  // Filtra produtos relacionados em tempo real
  const { matchedProducts, totalMatches } = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return { matchedProducts: [], totalMatches: 0 };
    }

    const matches = products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(q);
      const descMatch = p.description.toLowerCase().includes(q);
      const categoryName = categoryNameMap.get(p.category) || '';
      const categoryMatch = categoryName.toLowerCase().includes(q);
      const variationsMatch = p.variations?.some((v) => v.name.toLowerCase().includes(q));

      return nameMatch || descMatch || categoryMatch || variationsMatch;
    });

    return {
      matchedProducts: matches.slice(0, 5),
      totalMatches: matches.length,
    };
  }, [products, searchQuery, categoryNameMap]);

  // Filtra categorias relacionadas que batem com o termo
  const matchedCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return categories
      .filter((c) => c.id !== 'todos' && c.name.toLowerCase().includes(q))
      .slice(0, 3);
  }, [categories, searchQuery]);

  // Fecha dropdown ao clicar fora do componente
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedDesktop = desktopSearchRef.current?.contains(target);
      const clickedMobile = mobileSearchRef.current?.contains(target);

      if (!clickedDesktop && !clickedMobile) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Direciona direto para a seção de resultados no catálogo
  const handleGoToResults = () => {
    setIsDropdownOpen(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const catalogElement = document.getElementById('catalogo');
    if (catalogElement) {
      const yOffset = -90; // compensa a altura do cabeçalho fixo
      const y = catalogElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Trata teclado (Enter vai para resultados, Escape fecha menu)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGoToResults();
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  // Seleciona produto diretamente para personalização
  const handleProductClick = (product: Product) => {
    setIsDropdownOpen(false);
    openCustomizationModal(product);
  };

  // Seleciona categoria no menu
  const handleCategoryClick = (catId: CategoryId) => {
    setIsDropdownOpen(false);
    setSearchQuery('');
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
    const catalogElement = document.getElementById('catalogo');
    if (catalogElement) {
      const yOffset = -90;
      const y = catalogElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Renderizador do campo de busca e menu
  const renderSearchBox = (isMobile: boolean) => {
    const containerRef = isMobile ? mobileSearchRef : desktopSearchRef;
    const showDropdown = isDropdownOpen && searchQuery.trim().length > 0;

    return (
      <div className={styles.searchRelative} ref={containerRef}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.trim().length > 0) {
              setIsDropdownOpen(true);
            }
          }}
          onFocus={() => {
            if (searchQuery.trim().length > 0) {
              setIsDropdownOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={isMobile ? 'Buscar produto, caixa, modelo...' : 'O que você procura?'}
          className={styles.searchInput}
        />

        <button
          type="button"
          onClick={handleGoToResults}
          className={styles.searchIconButton}
          title="Buscar no catálogo"
          aria-label="Buscar"
        >
          <Search size={16} />
        </button>

        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setIsDropdownOpen(false);
            }}
            className={styles.searchClearButton}
            aria-label="Limpar busca"
          >
            <X size={14} />
          </button>
        )}

        {/* Menu Suspenso de Resultados Relacionados */}
        {showDropdown && (
          <div className={styles.dropdownMenu}>
            {/* Categorias Sugeridas (se houver correspondência) */}
            {matchedCategories.length > 0 && (
              <div className={styles.dropdownSection}>
                <div className={styles.dropdownSectionLabel}>Categorias Sugeridas</div>
                <div className={styles.dropdownTagsList}>
                  {matchedCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryClick(cat.id as CategoryId)}
                      className={styles.dropdownCategoryTag}
                    >
                      <FolderHeart size={12} />
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Produtos Relacionados */}
            {matchedProducts.length > 0 ? (
              <div className={styles.dropdownProductsList}>
                <div className={styles.dropdownSectionHeader}>
                  <span>Lembrancinhas Encontradas</span>
                  <span className={styles.dropdownCountBadge}>
                    {totalMatches} {totalMatches === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {matchedProducts.map((p) => {
                  const categoryName = categoryNameMap.get(p.category) || p.category;
                  const priceFormatted = formatProductPrice(p);

                  return (
                    <div
                      key={p.id}
                      className={styles.dropdownItem}
                      onClick={() => handleProductClick(p)}
                      role="button"
                      tabIndex={0}
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        className={styles.dropdownThumb}
                        loading="lazy"
                      />
                      <div className={styles.dropdownInfo}>
                        <h4 className={styles.dropdownTitle}>{p.name}</h4>
                        <div className={styles.dropdownMeta}>
                          <span className={styles.dropdownCategory}>{categoryName}</span>
                          <span className={styles.dropdownPrice}>{priceFormatted}</span>
                        </div>
                      </div>
                      <span className={styles.dropdownAction}>
                        <span>Personalizar</span>
                        <ArrowRight size={12} />
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.dropdownEmpty}>
                <p className={styles.dropdownEmptyTitle}>
                  Nenhum produto com &quot;{searchQuery}&quot;
                </p>
                <p className={styles.dropdownEmptyText}>
                  Pressione <strong>Enter</strong> para ver todos os resultados no catálogo.
                </p>
              </div>
            )}

            {/* Rodapé: Atalho para ir direto aos resultados */}
            <div
              className={styles.dropdownFooter}
              onClick={handleGoToResults}
              role="button"
              tabIndex={0}
            >
              <div className={styles.dropdownFooterContent}>
                <Search size={14} />
                <span>
                  Ver todos os {totalMatches} resultados para &quot;<strong>{searchQuery}</strong>&quot;
                </span>
              </div>
              <span className={styles.enterKeyBadge}>
                <span>Enter</span>
                <CornerDownLeft size={11} />
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <header className={styles.headerSticky}>
      {/* Barra de Notificação Superior */}
      {topBanner?.enabled && topBanner?.text ? (
        <div 
          className={styles.topBanner}
          style={{
            backgroundColor: topBanner.bgColor || '#6D4C3D',
            color: topBanner.textColor || '#FFFFFF',
          }}
        >
          {topBanner.link ? (
            <a href={topBanner.link} className={styles.topBannerLink}>
              <span>{topBanner.text}</span>
            </a>
          ) : (
            <span>{topBanner.text}</span>
          )}
        </div>
      ) : null}

      <div className={styles.headerContainer}>
        <div className={styles.headerRow}>
          {/* Logo e Nome da Loja */}
          <div className={styles.logoWrapper}>
            <div className={styles.logoCircle}>
              <span className={styles.logoText}>Wê</span>
            </div>
            <div>
              <a href="#" className={styles.brandLink}>
                <span className={styles.brandTitle}>Lembrancinhas</span>
              </a>
            </div>
          </div>

          {/* Campo de Busca (Desktop) */}
          <div className={styles.searchWrapperDesktop}>
            {renderSearchBox(false)}
          </div>

          {/* Ações da Direita (Instagram e Carrinho) */}
          <div className={styles.actionsWrapper}>
            <a
              href={currentInstagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.instagramLink}
              title="Ver nosso Instagram oficial"
            >
              <InstagramIcon size={15} className={styles.instagramIcon} />
              <span>@{currentInstagram}</span>
            </a>

            {/* Botão do Carrinho */}
            <button
              onClick={openCart}
              className={styles.cartButton}
              aria-label="Abrir carrinho de compras"
            >
              <ShoppingBag size={18} />
              <span className={styles.cartText}>Meu Pedido</span>
              {totalItems > 0 && (
                <span className={styles.cartBadge}>{totalItems}</span>
              )}
            </button>
          </div>
        </div>

        {/* Campo de Busca (Mobile) */}
        <div className={styles.searchWrapperMobile}>
          {renderSearchBox(true)}
        </div>
      </div>
    </header>
  );
}

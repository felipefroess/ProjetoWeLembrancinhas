'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { CATEGORIES } from '@/data/categories';
import { Category, CategoryId } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './CategoryFilter.module.css';

interface CategoryFilterProps {
  selectedCategory: CategoryId;
  onSelectCategory: (categoryId: CategoryId) => void;
  categories?: Category[];
}

export function CategoryFilter({ 
  selectedCategory, 
  onSelectCategory,
  categories = CATEGORIES 
}: CategoryFilterProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Verifica se há conteúdo para rolar à esquerda ou à direita
  const checkScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // Tolerância de 4px para lidar com arredondamentos de zoom/subpixel
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = listRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    // Revalidação após renderização e layout
    const timer = setTimeout(checkScroll, 120);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer);
    };
  }, [checkScroll, categories]);

  // Rola para a direção desejada de forma suave
  const handleScroll = (direction: 'left' | 'right') => {
    const el = listRef.current;
    if (!el) return;
    const scrollAmount = Math.max(260, Math.floor(el.clientWidth * 0.65));
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleCategoryClick = (catId: CategoryId, e: React.MouseEvent<HTMLButtonElement>) => {
    onSelectCategory(catId);
    // Centraliza o botão clicado na área visível
    e.currentTarget.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  };

  return (
    <div className={styles.filterSection}>
      <div className={styles.container}>
        
        {/* Título de seção */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Categorias em Destaque
          </h2>
          <span className={styles.sectionCount}>
            {categories.length} coleções
          </span>
        </div>

        {/* Wrapper do Carrossel com Botões de Navegação */}
        <div className={styles.carouselWrapper}>
          
          {/* Efeito de fade suave na borda esquerda */}
          <div className={`${styles.fadeEdge} ${styles.fadeEdgeLeft} ${canScrollLeft ? styles.fadeVisible : ''}`} />

          {/* Botão de Rolar para Esquerda */}
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className={`${styles.navButton} ${styles.navButtonLeft} ${canScrollLeft ? styles.navButtonVisible : ''}`}
            aria-label="Ver categorias anteriores"
            title="Categorias anteriores"
            disabled={!canScrollLeft}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          {/* Lista com scroll horizontal */}
          <div ref={listRef} className={styles.categoriesList}>
            {categories.map((cat, index) => {
              const isSelected = selectedCategory === cat.id;
              // A 1ª categoria temática após "Todos os Mimos" é o evento comemorativo mais próximo do ano
              const isUpcomingHighlight = index === 1 && cat.id !== 'todos';
              const isNatal = cat.id === 'natal';

              return (
                <button
                  key={cat.id}
                  onClick={(e) => handleCategoryClick(cat.id, e)}
                  className={`${isSelected ? styles.categoryButtonSelected : styles.categoryButton} ${isUpcomingHighlight && !isSelected ? styles.categoryButtonHighlight : ''} ${isNatal ? styles.categoryButtonNatal : ''}`}
                  title={isNatal ? 'Coleção Especial de Natal' : isUpcomingHighlight ? 'Evento comemorativo em destaque!' : undefined}
                >
                  <span>{cat.name}</span>
                  {isNatal && (
                    <img
                      src="/images/natal/touca-natal.png"
                      alt="Touca de Natal"
                      className={styles.natalSantaHat}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Efeito de fade suave na borda direita */}
          <div className={`${styles.fadeEdge} ${styles.fadeEdgeRight} ${canScrollRight ? styles.fadeVisible : ''}`} />

          {/* Botão de Rolar para Direita */}
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className={`${styles.navButton} ${styles.navButtonRight} ${canScrollRight ? styles.navButtonVisible : ''}`}
            aria-label="Ver mais categorias"
            title="Mais categorias"
            disabled={!canScrollRight}
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>

        </div>
      </div>
    </div>
  );
}

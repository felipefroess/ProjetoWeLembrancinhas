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
    // Se o scroll estiver em 2px ou menos, considera que está 100% no início absoluto
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = listRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    // Revalidação após renderização e layout
    const timer = setTimeout(checkScroll, 100);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer);
    };
  }, [checkScroll, categories]);

  // Rola para a direção desejada garantindo ir até o limite absoluto (0 na esquerda)
  const handleScroll = (direction: 'left' | 'right') => {
    const el = listRef.current;
    if (!el) return;
    const scrollAmount = Math.max(280, Math.floor(el.clientWidth * 0.7));

    if (direction === 'left') {
      // Se estiver próximo do início, crava exatamente no 0 para que "Todos os Mimos" fique 100% visível
      if (el.scrollLeft <= scrollAmount + 40) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollTo({
          left: Math.max(0, el.scrollLeft - scrollAmount),
          behavior: 'smooth',
        });
      }
    } else {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll - el.scrollLeft <= scrollAmount + 40) {
        el.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        el.scrollTo({
          left: Math.min(maxScroll, el.scrollLeft + scrollAmount),
          behavior: 'smooth',
        });
      }
    }
  };

  const handleCategoryClick = (catId: CategoryId) => {
    onSelectCategory(catId);
    const el = listRef.current;
    if (!el) return;

    // Se clicar em "Todos os Mimos", rola 100% para o início absoluto
    if (catId === 'todos') {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.filterSection}>
      <div className={styles.container}>
        
        {/* Título de seção com controles de navegação opcionais no cabeçalho */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Categorias em Destaque
          </h2>
          <div className={styles.headerRight}>
            <span className={styles.sectionCount}>
              {categories.length} coleções
            </span>
            <div className={styles.headerNavButtons}>
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className={`${styles.headerNavBtn} ${canScrollLeft ? styles.headerNavBtnActive : ''}`}
                aria-label="Ver categorias anteriores"
                title="Categorias anteriores"
                disabled={!canScrollLeft}
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className={`${styles.headerNavBtn} ${canScrollRight ? styles.headerNavBtnActive : ''}`}
                aria-label="Ver mais categorias"
                title="Mais categorias"
                disabled={!canScrollRight}
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Wrapper do Carrossel com Botões de Navegação */}
        <div className={styles.carouselWrapper}>

          {/* Botão de Rolar para Esquerda - Só aparece quando rolado para a direita */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className={`${styles.navButton} ${styles.navButtonLeft}`}
              aria-label="Ver categorias anteriores"
              title="Voltar para o início das categorias"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
          )}

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
                  onClick={() => handleCategoryClick(cat.id)}
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

          {/* Botão de Rolar para Direita - Só aparece quando há mais categorias à direita */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className={`${styles.navButton} ${styles.navButtonRight}`}
              aria-label="Ver mais categorias"
              title="Ver mais categorias"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          )}

        </div>
      </div>
    </div>
  );
}

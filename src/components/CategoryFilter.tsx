'use client';

import React from 'react';
import { CATEGORIES } from '@/data/categories';
import { Category, CategoryId } from '@/types';
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

        {/* Lista com scroll horizontal */}
        <div className={styles.categoriesList}>
          {categories.map((cat, index) => {
            const isSelected = selectedCategory === cat.id;
            // A 1ª categoria temática após "Todos os Mimos" é o evento comemorativo mais próximo do ano
            const isUpcomingHighlight = index === 1 && cat.id !== 'todos';
            const isNatal = cat.id === 'natal';

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
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
      </div>
    </div>
  );
}

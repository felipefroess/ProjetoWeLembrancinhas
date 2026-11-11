'use client';

import React from 'react';
import { CATEGORIES } from '@/data/categories';
import { Category, CategoryId } from '@/types';
import { Sparkles } from 'lucide-react';
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

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`${isSelected ? styles.categoryButtonSelected : styles.categoryButton} ${isUpcomingHighlight && !isSelected ? styles.categoryButtonHighlight : ''}`}
                title={isUpcomingHighlight ? 'Evento comemorativo mais próximo em destaque!' : undefined}
              >
                {isUpcomingHighlight && <Sparkles size={13} className={styles.sparkleIcon} />}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

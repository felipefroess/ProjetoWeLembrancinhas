'use client';

import React from 'react';
import { CATEGORIES } from '@/data/categories';
import { CategoryId } from '@/types';

interface CategoryFilterProps {
  selectedCategory: CategoryId;
  onSelectCategory: (categoryId: CategoryId) => void;
}

export function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="py-6 border-b border-[#E8DFD5] bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Título de seção estilo Instagram Stories */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-widest font-bold text-[#8C7A6B]">
            Categorias em Destaque
          </h2>
          <span className="text-xs text-[#9E9084]">
            {CATEGORIES.length} seções
          </span>
        </div>

        {/* Lista com scroll horizontal responsivo */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer snap-start border ${
                  isSelected
                    ? 'bg-[#6D4C3D] text-white border-[#6D4C3D] shadow-md scale-105'
                    : 'bg-white hover:bg-[#F5EDE4] text-[#4A3B32] border-[#DACFBF] shadow-2xs hover:border-[#C89B6D]'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

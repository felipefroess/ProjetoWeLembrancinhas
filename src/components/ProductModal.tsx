'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { ProductVariation } from '@/types';
import { X, Check, Clock, AlertCircle } from 'lucide-react';

export function ProductModal() {
  const {
    isCustomizingModalOpen,
    closeCustomizationModal,
    selectedProductForCustomization: product,
    addToCart,
  } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [theme, setTheme] = useState('');
  const [childName, setChildName] = useState('');
  const [ageOrDate, setAgeOrDate] = useState('');
  const [ribbonColor, setRibbonColor] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);

  // Reseta os campos ao abrir o modal para um novo produto
  useEffect(() => {
    if (product) {
      setQuantity(product.minQuantity || 1);
      setTheme('');
      setChildName('');
      setAgeOrDate('');
      setRibbonColor(product.availableRibbonColors?.[0] || '');
      setNotes('');
      const initialVariation = product.variations?.[0] || null;
      setSelectedVariation(initialVariation);
      setSelectedImage(initialVariation ? initialVariation.image : product.image);
    }
  }, [product]);

  if (!isCustomizingModalOpen || !product) {
    return null;
  }

  const subtotal = product.price * quantity;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    addToCart(product, quantity, {
      variation: selectedVariation ? selectedVariation.name : undefined,
      theme: theme.trim() || undefined,
      childName: childName.trim() || undefined,
      ageOrDate: ageOrDate.trim() || undefined,
      ribbonColor: ribbonColor || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#DACFBF] relative flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-[#E8DFD5] bg-[#FAF7F2] flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg sm:text-xl text-[#2D231E]">
            Personalize seu Pedido
          </h3>
          <button
            onClick={closeCustomizationModal}
            className="w-8 h-8 rounded-full bg-white border border-[#DACFBF] text-[#7C6E64] hover:text-[#2D231E] flex items-center justify-center transition hover:bg-[#F5EDE4]"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Resumo do Produto Selecionado */}
          <div className="flex flex-col sm:flex-row gap-4 p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD5]">
            <div className="flex flex-col gap-2 shrink-0">
              <img
                src={selectedImage || product.image}
                alt={product.name}
                className="w-full sm:w-28 sm:h-28 h-48 object-cover rounded-xl border border-[#DACFBF]"
              />
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                        (selectedImage || product.image) === img
                          ? 'border-[#6D4C3D] scale-105'
                          : 'border-[#DACFBF] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Foto adicional" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <h4 className="font-serif font-bold text-base text-[#2D231E]">
                  {product.name}
                </h4>
                <p className="text-xs text-[#7C6E64] mt-1 leading-relaxed">
                  {product.description}
                </p>
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs">
                <span className="font-bold text-[#6D4C3D] text-sm">
                  {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {product.unit}
                </span>
                <span className="text-[#8C7A6B] flex items-center gap-1">
                  <Clock size={12} /> Produção: {product.leadTimeDays} dias úteis
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleConfirm} id="customization-form" className="space-y-4">
            
            {/* Aviso sobre personalização artesanal */}
            <div className="p-3 bg-[#FFF9F2] border border-[#F0D5BE] rounded-xl flex items-start gap-2.5 text-xs text-[#7A4B29]">
              <AlertCircle size={16} className="shrink-0 text-[#C89B6D] mt-0.5" />
              <span>
                A Wenilze prepara cada detalhe exclusivamente para a sua comemoração. Preencha os campos abaixo para elaboração da arte.
              </span>
            </div>

            {/* Seletor de Variações com Imagem (Estilo Mercado Livre) */}
            {product.variations && product.variations.length > 0 && (
              <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#DACFBF] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4A3B32]">
                    Escolha o Modelo:
                  </label>
                  {selectedVariation && (
                    <span className="text-xs font-extrabold text-[#6D4C3D] bg-white px-2.5 py-1 rounded-full border border-[#DACFBF] shadow-2xs">
                      {selectedVariation.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {product.variations.map((v) => {
                    const isSelected = selectedVariation?.id === v.id;

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariation(v);
                          setSelectedImage(v.image);
                        }}
                        className={`group/var relative flex flex-col items-center p-1.5 rounded-2xl border-2 transition-all cursor-pointer bg-white ${
                          isSelected
                            ? 'border-[#6D4C3D] ring-2 ring-[#6D4C3D]/30 shadow-md scale-102'
                            : 'border-[#DACFBF] hover:border-[#C89B6D] opacity-75 hover:opacity-100'
                        }`}
                        title={v.name}
                      >
                        <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden bg-[#FAF7F2]">
                          <img
                            src={v.image}
                            alt={v.name}
                            className="w-full h-full object-cover group-hover/var:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-[#3E2E25] mt-1.5 px-1 pb-0.5 text-center max-w-[96px] truncate">
                          {v.name}
                        </span>
                        {isSelected && (
                          <span className="absolute top-2 right-2 bg-[#6D4C3D] text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                            <Check size={12} className="stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedVariation?.description && (
                  <p className="text-[11px] text-[#7C6E64] italic bg-white p-2 rounded-xl border border-[#DACFBF]/60">
                    {selectedVariation.description}
                  </p>
                )}
              </div>
            )}

            {/* Linha 1: Tema e Nome */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5">
                  Tema / Detalhes da Arte <span className="text-[#C89B6D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corujinha, Frase Especial, Papai Noel..."
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#DACFBF] rounded-xl px-3.5 py-2.5 text-sm text-[#2D231E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C89B6D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5">
                  Nome na Lembrancinha <span className="text-[#C89B6D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Professora Leandra, Tia Amanda, Luís..."
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#DACFBF] rounded-xl px-3.5 py-2.5 text-sm text-[#2D231E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C89B6D]"
                />
              </div>
            </div>

            {/* Linha 2: Idade/Data e Cor de Laço */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5">
                  Ano ou Mensagem Curta
                </label>
                <input
                  type="text"
                  placeholder="Ex: Natal 2026, Boas Festas..."
                  value={ageOrDate}
                  onChange={(e) => setAgeOrDate(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#DACFBF] rounded-xl px-3.5 py-2.5 text-sm text-[#2D231E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C89B6D]"
                />
              </div>

              {product.availableRibbonColors && product.availableRibbonColors.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5">
                    Cor dos Laços / Fitas
                  </label>
                  <select
                    value={ribbonColor}
                    onChange={(e) => setRibbonColor(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#DACFBF] rounded-xl px-3.5 py-2.5 text-sm text-[#2D231E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C89B6D]"
                  >
                    {product.availableRibbonColors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Observações livres */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5">
                Observações Especiais (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Gostaria de tons pastéis, glitter prateado, frase bíblica específica..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#DACFBF] rounded-xl p-3 text-sm text-[#2D231E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C89B6D]"
              />
            </div>

            {/* Controle de Quantidade */}
            <div className="pt-2 border-t border-[#E8DFD5] flex items-center justify-between gap-4">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32]">
                  Quantidade ({product.unit})
                </span>
                {product.minQuantity > 1 && (
                  <span className="text-[11px] text-[#8C7A6B]">
                    Pedido mínimo: {product.minQuantity} unidades
                  </span>
                )}
              </div>

              <div className="flex items-center border border-[#DACFBF] rounded-xl bg-[#FAF7F2] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(product.minQuantity, q - 1))}
                  disabled={quantity <= product.minQuantity}
                  className="w-10 h-10 text-lg font-bold text-[#4A3B32] hover:bg-[#E8DFD5] disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  -
                </button>
                <span className="w-12 text-center text-sm font-bold text-[#2D231E]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 text-lg font-bold text-[#4A3B32] hover:bg-[#E8DFD5] transition"
                >
                  +
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Rodapé com Subtotal e Ação de Adicionar */}
        <div className="p-4 sm:p-5 border-t border-[#E8DFD5] bg-[#FAF7F2] flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#8C7A6B] block font-semibold">
              Subtotal do Item
            </span>
            <span className="font-serif font-bold text-xl sm:text-2xl text-[#6D4C3D]">
              {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          <button
            type="submit"
            form="customization-form"
            className="px-6 py-3 rounded-full bg-[#6D4C3D] hover:bg-[#5A3E31] text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Check size={18} />
            <span>Adicionar ao Pedido</span>
          </button>
        </div>
      </div>
    </div>
  );
}

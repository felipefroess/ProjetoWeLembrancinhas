'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  LogOut, 
  Upload, 
  X, 
  Check, 
  Package, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Product, Category, ProductVariation, CustomFieldDefinition } from '@/types';
import styles from './Admin.module.css';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Formulário de Novo Produto
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('natal');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('15.00');
  const [unit, setUnit] = useState('unidade');
  const [leadTimeDays, setLeadTimeDays] = useState('5');
  const [minQuantity, setMinQuantity] = useState('1');
  const [mainImage, setMainImage] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  
  // Modelos / Variações
  const [hasVariations, setHasVariations] = useState(false);
  const [variations, setVariations] = useState<Array<{ name: string; image: string; description: string }>>([]);

  // Opções de Personalização
  const [allowChildName, setAllowChildName] = useState(true);
  const [childNameLabel, setChildNameLabel] = useState('Nome na Lembrancinha');
  const [allowRibbonColors, setAllowRibbonColors] = useState(false);
  const [ribbonColorsText, setRibbonColorsText] = useState('Laço Dourado, Laço Rosa, Laço Verde');
  const [allowNotes, setAllowNotes] = useState(true);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verifica autenticação e carrega dados
  useEffect(() => {
    async function checkAuthAndLoad() {
      try {
        const authRes = await fetch('/api/admin/check');
        const authData = await authRes.json();
        if (!authData.authenticated) {
          router.push('/admin/login');
          return;
        }

        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (prodData.success) {
          setProducts(prodData.products || []);
          setCategories(prodData.categories || []);
        }
      } catch (err) {
        console.error('Erro ao inicializar painel:', err);
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndLoad();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        if (target === 'main') {
          setMainImage(data.url);
        } else if (typeof target === 'number') {
          setVariations((prev) => {
            const next = [...prev];
            next[target].image = data.url;
            return next;
          });
        }
      } else {
        alert(data.error || 'Erro ao fazer upload da imagem.');
      }
    } catch {
      alert('Falha na comunicação com o servidor ao enviar imagem.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddVariation = () => {
    setVariations((prev) => [
      ...prev,
      { name: `Modelo ${prev.length + 1}`, image: '', description: '' },
    ]);
  };

  const handleRemoveVariation = (index: number) => {
    setVariations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCustomField = () => {
    const newField: CustomFieldDefinition = {
      id: `field_${Date.now()}`,
      label: 'Novo Campo (Ex: Data do Evento)',
      type: 'text',
      required: false,
      placeholder: '',
    };
    setCustomFields((prev) => [...prev, newField]);
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDeleteProduct = async (id: string, productName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${productName}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert('Não foi possível excluir o produto.');
      }
    } catch {
      alert('Erro ao excluir produto.');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const parsedPrice = parseFloat(price.replace(',', '.')) || 0;
      const parsedLeadTime = parseInt(leadTimeDays, 10) || 5;
      const parsedMinQty = parseInt(minQuantity, 10) || 1;
      
      const finalCategory = isCreatingNewCategory
        ? newCategoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')
        : categoryId;

      const ribbonColorsList = allowRibbonColors
        ? ribbonColorsText.split(',').map((c) => c.trim()).filter(Boolean)
        : [];

      const variationsFormatted: ProductVariation[] = hasVariations
        ? variations.map((v, idx) => ({
            id: `var_${Date.now()}_${idx}`,
            name: v.name,
            image: v.image || mainImage,
            description: v.description || undefined,
          }))
        : [];

      const slugId = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

      const newProduct: Product = {
        id: slugId,
        name: name.trim(),
        category: finalCategory,
        description: description.trim(),
        price: parsedPrice,
        unit: unit.trim() || 'unidade',
        leadTimeDays: parsedLeadTime,
        minQuantity: parsedMinQty,
        image: mainImage.trim() || '/images/placeholder.jpg',
        images: [mainImage.trim() || '/images/placeholder.jpg', ...additionalImages],
        variations: variationsFormatted.length > 0 ? variationsFormatted : undefined,
        availableRibbonColors: ribbonColorsList.length > 0 ? ribbonColorsList : undefined,
        customizationSettings: {
          allowChildName,
          childNameLabel: childNameLabel.trim() || 'Nome na Lembrancinha',
          allowRibbonColors,
          ribbonColors: ribbonColorsList,
          allowNotes,
          customFields: customFields.length > 0 ? customFields : undefined,
        },
        popular: true,
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: newProduct,
          newCategoryName: isCreatingNewCategory ? newCategoryName : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProducts((prev) => [...prev, data.product]);
        setIsModalOpen(false);
        // Reseta campos
        setName('');
        setDescription('');
        setMainImage('');
        setVariations([]);
        setHasVariations(false);
        setCustomFields([]);
      } else {
        alert(data.error || 'Erro ao cadastrar produto.');
      }
    } catch {
      alert('Falha ao conectar com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.adminWrapper} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p>Carregando painel administrativo...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminWrapper}>
      {/* Barra de Navegação Superior */}
      <header className={styles.topBar}>
        <div className={styles.brandGroup}>
          <div className={styles.brandBadge}>Wê</div>
          <div>
            <h1 className={styles.brandTitle}>Wê Lembrancinhas</h1>
            <span className={styles.adminTag}>Painel Administrativo</span>
          </div>
        </div>

        <div className={styles.topActions}>
          <Link href="/" target="_blank" className={styles.storeLink}>
            <ExternalLink size={14} />
            <span>Ver Loja</span>
          </Link>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Encerrar sessão">
            <LogOut size={14} />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className={styles.mainContent}>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.pageHeading}>Catálogo de Produtos</h2>
            <p className={styles.pageSubheading}>
              Adicione, edite e personalize como os clientes encomendam cada item no site.
            </p>
          </div>

          <button onClick={() => setIsModalOpen(true)} className={styles.newProductBtn}>
            <Plus size={18} />
            <span>Novo Produto</span>
          </button>
        </div>

        {/* Tabela de Produtos */}
        <div className={styles.tableCard}>
          <table className={styles.productsTable}>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Prazo</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className={styles.productRowInfo}>
                      <img src={p.image} alt={p.name} className={styles.tableThumb} />
                      <div>
                        <div className={styles.productNameCell}>{p.name}</div>
                        <div className={styles.productDescCell}>{p.description}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.categoryBadge}>{p.category}</span>
                  </td>
                  <td>
                    <span className={styles.priceTag}>
                      {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </td>
                  <td>{p.leadTimeDays} dias úteis</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.actionsCell} style={{ justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className={styles.deleteBtn}
                        title="Excluir produto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal de Criação de Produto */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Cadastrar Novo Produto</h3>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className={styles.modalBody}>
              {/* Seção 1: Dados Básicos */}
              <div className={styles.sectionBox}>
                <h4 className={styles.sectionTitle}>
                  <Package size={16} /> Dados Principais
                </h4>

                <div className={styles.formField}>
                  <label className={styles.label}>
                    Nome do Produto <span className={styles.reqStar}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Bloquinho de Anotações Wire-o Personalizado"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.grid2}>
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Categoria <span className={styles.reqStar}>*</span>
                    </label>
                    <select
                      value={isCreatingNewCategory ? '__new__' : categoryId}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setIsCreatingNewCategory(true);
                        } else {
                          setIsCreatingNewCategory(false);
                          setCategoryId(e.target.value);
                        }
                      }}
                      className={styles.select}
                    >
                      {categories.filter((c) => c.id !== 'todos').map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                      <option value="__new__">+ Criar Nova Categoria...</option>
                    </select>
                  </div>

                  {isCreatingNewCategory && (
                    <div className={styles.formField}>
                      <label className={styles.label}>Nome da Nova Categoria</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Batizados, Corporativo, Chá Revelação..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className={styles.input}
                      />
                    </div>
                  )}
                </div>

                <div className={styles.grid3}>
                  <div className={styles.formField}>
                    <label className={styles.label}>Preço (R$) <span className={styles.reqStar}>*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 19.90"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.label}>Unidade</label>
                    <input
                      type="text"
                      placeholder="unidade, kit, cento..."
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.label}>Prazo (Dias Úteis) <span className={styles.reqStar}>*</span></label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={leadTimeDays}
                      onChange={(e) => setLeadTimeDays(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Descrição do Produto <span className={styles.reqStar}>*</span></label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Descreva os materiais, acabamento afetivo, detalhes de produção..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={styles.textarea}
                  />
                </div>
              </div>

              {/* Seção 2: Fotos */}
              <div className={styles.sectionBox}>
                <h4 className={styles.sectionTitle}>
                  <Upload size={16} /> Fotos do Produto
                </h4>

                <div className={styles.formField}>
                  <label className={styles.label}>Foto Principal <span className={styles.reqStar}>*</span></label>
                  <div className={styles.uploadWrapper}>
                    <label className={styles.uploadBtn}>
                      <Upload size={14} />
                      <span>{uploadingImage ? 'Enviando...' : 'Enviar Foto do Computador'}</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageUpload(e, 'main')}
                      />
                    </label>
                    <span>ou</span>
                    <input
                      type="text"
                      placeholder="Cole a URL ou caminho da foto (ex: /images/...)"
                      value={mainImage}
                      onChange={(e) => setMainImage(e.target.value)}
                      className={styles.input}
                      style={{ flex: 1 }}
                    />
                  </div>
                  {mainImage && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img src={mainImage} alt="Prévia" className={styles.previewImg} />
                    </div>
                  )}
                </div>
              </div>

              {/* Seção 3: Modelos (Estilo Mercado Livre) */}
              <div className={styles.sectionBox}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 className={styles.sectionTitle}>
                    <Sparkles size={16} /> Modelos & Variações
                  </h4>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={hasVariations}
                      onChange={(e) => {
                        setHasVariations(e.target.checked);
                        if (e.target.checked && variations.length === 0) {
                          handleAddVariation();
                        }
                      }}
                      className={styles.checkboxInput}
                    />
                    <span>Este produto tem mais de um modelo?</span>
                  </label>
                </div>

                {hasVariations && (
                  <div className={styles.variationsList}>
                    {variations.map((v, idx) => (
                      <div key={idx} className={styles.variationCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6D4C3D' }}>
                            Modelo #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariation(idx)}
                            className={styles.removeModelBtn}
                          >
                            <Trash2 size={12} /> Remover
                          </button>
                        </div>

                        <div className={styles.grid2}>
                          <div className={styles.formField}>
                            <label className={styles.label}>Nome do Modelo</label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: Talento Avelãs, Azul Marinho..."
                              value={v.name}
                              onChange={(e) => {
                                const next = [...variations];
                                next[idx].name = e.target.value;
                                setVariations(next);
                              }}
                              className={styles.input}
                            />
                          </div>

                          <div className={styles.formField}>
                            <label className={styles.label}>Foto do Modelo</label>
                            <input
                              type="text"
                              placeholder="URL ou envie a foto"
                              value={v.image}
                              onChange={(e) => {
                                const next = [...variations];
                                next[idx].image = e.target.value;
                                setVariations(next);
                              }}
                              className={styles.input}
                            />
                          </div>
                        </div>

                        <div className={styles.formField}>
                          <label className={styles.label}>Breve Descrição do Modelo</label>
                          <input
                            type="text"
                            placeholder="Ex: Com mini chocolate Talento e frase especial"
                            value={v.description}
                            onChange={(e) => {
                              const next = [...variations];
                              next[idx].description = e.target.value;
                              setVariations(next);
                            }}
                            className={styles.input}
                          />
                        </div>
                      </div>
                    ))}

                    <button type="button" onClick={handleAddVariation} className={styles.addModelBtn}>
                      <Plus size={14} /> Adicionar Outro Modelo
                    </button>
                  </div>
                )}
              </div>

              {/* Seção 4: Configuração de Personalização */}
              <div className={styles.sectionBox}>
                <h4 className={styles.sectionTitle}>
                  <AlertCircle size={16} /> Campos de Personalização do Cliente
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#7C6E64', margin: 0 }}>
                  Escolha exatamente quais perguntas o cliente deve responder ao encomendar este produto.
                </p>

                {/* Switch: Nome na Lembrancinha */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={allowChildName}
                      onChange={(e) => setAllowChildName(e.target.checked)}
                      className={styles.checkboxInput}
                    />
                    <span>Pedir Nome na Lembrancinha</span>
                  </label>
                  {allowChildName && (
                    <div style={{ paddingLeft: '1.75rem' }}>
                      <input
                        type="text"
                        placeholder="Rótulo do campo (ex: Nome na Lembrancinha, Nome da Criança...)"
                        value={childNameLabel}
                        onChange={(e) => setChildNameLabel(e.target.value)}
                        className={styles.input}
                      />
                    </div>
                  )}
                </div>

                {/* Switch: Cores de Laços/Fitas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={allowRibbonColors}
                      onChange={(e) => setAllowRibbonColors(e.target.checked)}
                      className={styles.checkboxInput}
                    />
                    <span>Oferecer escolha de Cores de Laços / Fitas</span>
                  </label>
                  {allowRibbonColors && (
                    <div style={{ paddingLeft: '1.75rem' }}>
                      <input
                        type="text"
                        placeholder="Digite as cores separadas por vírgula (ex: Laço Dourado, Laço Rosa, Laço Verde)"
                        value={ribbonColorsText}
                        onChange={(e) => setRibbonColorsText(e.target.value)}
                        className={styles.input}
                      />
                    </div>
                  )}
                </div>

                {/* Switch: Observações Especiais */}
                <div>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={allowNotes}
                      onChange={(e) => setAllowNotes(e.target.checked)}
                      className={styles.checkboxInput}
                    />
                    <span>Permitir campo de Observações Especiais</span>
                  </label>
                </div>

                {/* Campos Extras Dinâmicos */}
                {customFields.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6D4C3D' }}>
                      Campos Personalizados Extras:
                    </span>
                    {customFields.map((field, idx) => (
                      <div key={field.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Nome da pergunta (ex: Tema da Festa, Idade...)"
                          value={field.label}
                          onChange={(e) => {
                            const next = [...customFields];
                            next[idx].label = e.target.value;
                            setCustomFields(next);
                          }}
                          className={styles.input}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(field.id)}
                          className={styles.removeModelBtn}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button type="button" onClick={handleAddCustomField} className={styles.addModelBtn}>
                  <Plus size={14} /> + Adicionar Outro Campo Personalizado
                </button>
              </div>

              {/* Rodapé do Modal */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.cancelBtn}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={styles.saveBtn}
                >
                  <Check size={16} />
                  <span>{saving ? 'Publicando...' : 'Salvar e Publicar no Site'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

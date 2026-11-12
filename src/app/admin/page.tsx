'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calculator,
  Sliders,
  Ticket,
  LayoutDashboard,
  ClipboardList,
  Plus, 
  Pencil,
  Trash2, 
  ExternalLink, 
  LogOut, 
  Upload, 
  X, 
  Check, 
  Package, 
  Sparkles,
  AlertCircle,
  TrendingUp,
  FolderHeart,
  Clock,
  Search,
  MessageCircle,
  ShieldCheck,
  Layers,
  Gift,
  Eye,
  Flame,
  Trophy,
  ArrowUpRight,
  Calendar,
  Crop
} from 'lucide-react';
import { Product, Category, ProductVariation, CustomFieldDefinition } from '@/types';
import OrdersProductionTab from './components/OrdersProductionTab';
import CouponsTab from './components/CouponsTab';
import StoreSettingsTab from './components/StoreSettingsTab';
import CostCalculatorTab from './components/CostCalculatorTab';
import { ImageCropModal } from './components/ImageCropModal';
import { STORE_CONFIG } from '@/data/products';
import { getAnalyticsForPeriod, AnalyticsPeriod } from '@/lib/analytics';
import styles from './Admin.module.css';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Aba Principal do Admin (Dashboard ou Produtos)
  const [mainTab, setMainTab] = useState<'pedidos' | 'produtos' | 'ajustes' | 'cupons' | 'dashboard' | 'calculadora'>('pedidos');
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [couponsCount, setCouponsCount] = useState<number>(0);
  const [isStoreOnline, setIsStoreOnline] = useState<boolean>(true);
  const [updatingStoreStatus, setUpdatingStoreStatus] = useState<boolean>(false);

  // Período selecionado no dashboard (semana, mes ou ano)
  const [period, setPeriod] = useState<AnalyticsPeriod>('mes');
  const [realStats, setRealStats] = useState<any>(null);
  const [isDbConfigured, setIsDbConfigured] = useState<boolean>(false);

  // Busca dados reais do banco Supabase quando disponível
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/analytics/stats?period=' + period);
        const data = await res.json();
        if (data.configured) {
          setIsDbConfigured(true);
          if (data.hasRealData) {
            setRealStats(data);
          }
        } else {
          setIsDbConfigured(false);
          setRealStats(null);
        }
      } catch (err) {
        console.error('Erro ao buscar estatísticas do Supabase:', err);
      }
    }
    fetchStats();
  }, [period]);

  // Filtros de busca na tabela do admin
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('todos');

  // Formulário de Produto
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('natal');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('15.00');
  const [unit, setUnit] = useState('unidade');
  const [leadTimeDays, setLeadTimeDays] = useState('5');
  const [minQuantity, setMinQuantity] = useState('1');

  // Gerenciamento de Fotos
  const [mainImage, setMainImage] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [newAdditionalUrl, setNewAdditionalUrl] = useState('');
  const [cropTarget, setCropTarget] = useState<
    | null
    | { type: 'main'; url: string; title: string }
    | { type: 'additional'; index: number; url: string; title: string }
    | { type: 'variation'; index: number; slot: 1 | 2; url: string; title: string }
  >(null);
  
  // Modelos / Variações
  const [hasVariations, setHasVariations] = useState(false);
  const [modalTab, setModalTab] = useState<'basico' | 'fotos' | 'modelos' | 'personalizacao'>('basico');
  const [variations, setVariations] = useState<Array<{ name: string; image: string; image2: string; description: string; price: string }>>([]);
  const [variationsNote, setVariationsNote] = useState('');

  // Opções de Personalização
  const [allowChildName, setAllowChildName] = useState(true);
  const [childNameRequired, setChildNameRequired] = useState(true);
  const [childNameLabel, setChildNameLabel] = useState('Nome na Lembrancinha');
  const [childNamePlaceholder, setChildNamePlaceholder] = useState('');
  const [notesPlaceholder, setNotesPlaceholder] = useState('');
  const [allowRibbonColors, setAllowRibbonColors] = useState(false);
  const [ribbonColorRequired, setRibbonColorRequired] = useState(false);
  const [ribbonColorsText, setRibbonColorsText] = useState('Laço Dourado, Laço Rosa, Laço Verde');
  const [allowNotes, setAllowNotes] = useState(true);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);

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

        try {
          const ordersRes = await fetch('/api/orders');
          const ordersData = await ordersRes.json();
          if (ordersData.orders) {
            setOrdersCount(ordersData.orders.length);
          }
        } catch {}

        try {
          const statusRes = await fetch('/api/store-status');
          const statusData = await statusRes.json();
          if (typeof statusData.isOnline === 'boolean') {
            setIsStoreOnline(statusData.isOnline);
          }
        } catch {}
      } catch (err) {
        console.error('Erro ao inicializar painel:', err);
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndLoad();
  }, [router]);

  const toggleStoreOnline = async () => {
    setUpdatingStoreStatus(true);
    const nextStatus = !isStoreOnline;
    setIsStoreOnline(nextStatus);

    try {
      const res = await fetch('/api/store-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: nextStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        setIsStoreOnline(!nextStatus);
        alert('Erro ao atualizar status da loja.');
      }
    } catch {
      setIsStoreOnline(!nextStatus);
      alert('Erro ao conectar com o servidor.');
    } finally {
      setUpdatingStoreStatus(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const handleOpenCreateModal = () => {
    setEditingProductId(null);
    setModalTab('basico');
    setName('');
    const firstCat = categories.find((c) => c.id !== 'todos')?.id || 'natal';
    setCategoryId(firstCat);
    setIsCreatingNewCategory(false);
    setNewCategoryName('');
    setDescription('');
    setPrice('15.00');
    setUnit('unidade');
    setLeadTimeDays('5');
    setMinQuantity('1');
    setMainImage('');
    setAdditionalImages([]);
    setNewAdditionalUrl('');
    setHasVariations(false);
    setVariations([]);
    setVariationsNote('');
    setAllowChildName(true);
    setChildNameRequired(true);
    setChildNameLabel('Nome na Lembrancinha');
    setChildNamePlaceholder('');
    setNotesPlaceholder('');
    setAllowRibbonColors(false);
    setRibbonColorRequired(false);
    setRibbonColorsText('Laço Dourado, Laço Rosa, Laço Verde');
    setAllowNotes(true);
    setCustomFields([]);
    setIsModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setName(product.name || '');
    setCategoryId(product.category || 'natal');
    setIsCreatingNewCategory(false);
    setNewCategoryName('');
    setDescription(product.description || '');
    setPrice(product.price !== undefined ? product.price.toString() : '0');
    setUnit(product.unit || 'unidade');
    setLeadTimeDays(product.leadTimeDays ? product.leadTimeDays.toString() : '5');
    setMinQuantity(product.minQuantity ? product.minQuantity.toString() : '1');

    // Carrega fotos da publicação
    const primaryImg = product.image || (product.images && product.images[0]) || '';
    setMainImage(primaryImg);

    if (product.images && product.images.length > 0) {
      const others = product.images.filter((img, idx) => {
        if (idx === 0 && img === primaryImg) return false;
        return img !== primaryImg;
      });
      setAdditionalImages(others);
    } else {
      setAdditionalImages([]);
    }
    setNewAdditionalUrl('');

    // Variações / Modelos
    setModalTab('basico');
    if (product.variations && product.variations.length > 0) {
      setHasVariations(true);
      setVariations(
        product.variations.map((v) => ({
          name: v.name,
          image: v.images?.[0] || v.image || '',
          image2: v.images?.[1] || '',
          description: v.description || '',
          price: v.price !== undefined && v.price > 0 ? String(v.price) : '',
        }))
      );
    } else {
      setHasVariations(false);
      setVariations([]);
    }

    // Configurações de personalização
    setVariationsNote(product.variationsNote || product.customizationSettings?.variationsNote || '');
    const cs = product.customizationSettings;
    setAllowChildName(cs?.allowChildName ?? true);
    setChildNameRequired(cs?.childNameRequired ?? true);
    setChildNameLabel(cs?.childNameLabel || 'Nome na Lembrancinha');
    setChildNamePlaceholder(cs?.childNamePlaceholder || '');
    setNotesPlaceholder(cs?.notesPlaceholder || '');
    const hasRibbonColors = cs?.allowRibbonColors ?? (product.availableRibbonColors && product.availableRibbonColors.length > 0 ? true : false);
    setAllowRibbonColors(hasRibbonColors);
    setRibbonColorsText(
      product.availableRibbonColors?.join(', ') ||
      cs?.ribbonColors?.join(', ') ||
      'Laço Dourado, Laço Rosa, Laço Verde'
    );
    setAllowNotes(cs?.allowNotes ?? true);
    setCustomFields(
      cs?.customFields
        ? cs.customFields.map((f) => ({
            ...f,
            type: f.type || 'text',
            options: Array.isArray(f.options) ? [...f.options] : [],
            optionsText: Array.isArray(f.options) ? f.options.join(', ') : '',
          }))
        : []
    );
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProductId(null);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'main' | { index: number; slot: 1 | 2 }
  ) => {
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
        } else if (typeof target === 'object' && target !== null) {
          setVariations((prev) => {
            const next = [...prev];
            if (target.slot === 1) {
              next[target.index].image = data.url;
            } else {
              next[target.index].image2 = data.url;
            }
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

  // Upload de múltiplas fotos para a galeria
  const handleAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.url) {
          setAdditionalImages((prev) => [...prev, data.url]);
        }
      }
    } catch {
      alert('Erro ao enviar fotos adicionais.');
    } finally {
      setUploadingImage(false);
      if (additionalFileInputRef.current) additionalFileInputRef.current.value = '';
    }
  };

  const handleAddAdditionalUrl = () => {
    if (!newAdditionalUrl.trim()) return;
    setAdditionalImages((prev) => [...prev, newAdditionalUrl.trim()]);
    setNewAdditionalUrl('');
  };

  const handleRemoveAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePromoteToMain = (index: number) => {
    const promoted = additionalImages[index];
    if (!promoted) return;
    const oldMain = mainImage;
    setMainImage(promoted);
    setAdditionalImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (oldMain && oldMain !== promoted) {
        next.unshift(oldMain);
      }
      return next;
    });
  };

  const handleAddVariation = () => {
    setVariations((prev) => [
      ...prev,
      { name: `Modelo ${prev.length + 1}`, image: '', image2: '', description: '', price: '' },
    ]);
  };

  const handleRemoveVariation = (index: number) => {
    setVariations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCustomField = () => {
    const newField: CustomFieldDefinition = {
      id: `field_${Date.now()}`,
      label: 'Novo Campo',
      type: 'text',
      required: true,
      placeholder: '',
      options: [],
      optionsText: '',
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
        ? variations.map((v, idx) => {
            const vImages: string[] = [];
            if (v.image && v.image.trim()) vImages.push(v.image.trim());
            if (v.image2 && v.image2.trim()) vImages.push(v.image2.trim());
            const primaryImg = vImages[0] || mainImage || '/images/placeholder.jpg';

            const parsedVarPrice = v.price && !isNaN(parseFloat(v.price.replace(',', '.')))
              ? parseFloat(v.price.replace(',', '.'))
              : undefined;

            return {
              id: `var_${Date.now()}_${idx}`,
              name: v.name.trim(),
              image: primaryImg,
              images: vImages.length > 0 ? vImages : [primaryImg],
              description: v.description?.trim() || undefined,
              price: parsedVarPrice,
            };
          })
        : [];

      // Monta lista consolidada de fotos respeitando remoções
      const allImages: string[] = [];
      if (mainImage.trim()) {
        allImages.push(mainImage.trim());
      }
      additionalImages.forEach((img) => {
        const trimmed = img.trim();
        if (trimmed && !allImages.includes(trimmed)) {
          allImages.push(trimmed);
        }
      });

      const finalMainImage = mainImage.trim() || (allImages.length > 0 ? allImages[0] : '/images/placeholder.jpg');
      const finalImagesList = allImages.length > 0 ? allImages : [finalMainImage];

      const existingProduct = editingProductId ? products.find((p) => p.id === editingProductId) : null;

      const slugId = editingProductId
        ? editingProductId
        : name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

      const savedProductData: Product = {
        ...existingProduct,
        id: slugId,
        name: name.trim(),
        category: finalCategory,
        description: description.trim(),
        price: parsedPrice,
        unit: unit.trim() || 'unidade',
        leadTimeDays: parsedLeadTime,
        minQuantity: parsedMinQty,
        image: finalMainImage,
        images: finalImagesList,
        variations: variationsFormatted.length > 0 ? variationsFormatted : undefined,
        variationsNote: variationsNote.trim() || undefined,
        availableRibbonColors: ribbonColorsList.length > 0 ? ribbonColorsList : undefined,
        customizationSettings: {
          allowChildName,
          childNameLabel: childNameLabel.trim() || 'Nome na Lembrancinha',
          childNamePlaceholder: childNamePlaceholder.trim() || undefined,
          notesPlaceholder: notesPlaceholder.trim() || undefined,
          variationsNote: variationsNote.trim() || undefined,
          allowRibbonColors,
          ribbonColors: ribbonColorsList,
          allowNotes,
          customFields:
            customFields.length > 0
              ? customFields
                  .filter((f) => f.label && f.label.trim())
                  .map((f) => {
                    const fieldObj: CustomFieldDefinition = {
                      id: f.id,
                      label: f.label.trim(),
                      type: f.type === 'select' ? 'select' : 'text',
                      required: f.required !== false,
                    };
                    if (f.placeholder && f.placeholder.trim()) {
                      fieldObj.placeholder = f.placeholder.trim();
                    }
                    if (f.type === 'select') {
                      let opts: string[] = [];
                      if (f.optionsText !== undefined && f.optionsText.trim()) {
                        opts = f.optionsText
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean);
                      } else if (Array.isArray(f.options)) {
                        opts = f.options
                          .map((s) => (typeof s === 'string' ? s.trim() : ''))
                          .filter(Boolean);
                      }
                      fieldObj.options = opts;
                    }
                    return fieldObj;
                  })
              : undefined,
        },
        popular: existingProduct?.popular ?? true,
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: savedProductData,
          newCategoryName: isCreatingNewCategory ? newCategoryName : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (editingProductId) {
          setProducts((prev) => prev.map((p) => (p.id === editingProductId ? data.product : p)));
        } else {
          setProducts((prev) => [...prev, data.product]);
        }
        handleCloseModal();
        // Reseta campos
        setName('');
        setDescription('');
        setMainImage('');
        setAdditionalImages([]);
        setNewAdditionalUrl('');
        setVariations([]);
        setHasVariations(false);
        setCustomFields([]);
      } else {
        alert(data.error || 'Erro ao salvar produto.');
      }
    } catch {
      alert('Falha ao conectar com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  // Métricas do Dashboard calculadas para o período ativo (ou reais do banco)
  const baseAnalytics = getAnalyticsForPeriod(products, period);
  const analytics = realStats ? {
    ...baseAnalytics,
    totalRevenue: realStats.totalRevenue ?? baseAnalytics.totalRevenue,
    unitsSold: realStats.unitsSold ?? baseAnalytics.unitsSold,
    visits: realStats.visits ?? baseAnalytics.visits,
    ordersCount: realStats.ordersCount ?? baseAnalytics.ordersCount,
    mostClickedProduct: realStats.mostClicked ? {
      product: products.find((p) => p.id === realStats.mostClicked.productId) || {
        id: realStats.mostClicked.productId,
        name: realStats.mostClicked.name || 'Produto',
        price: 15,
        image: '/images/placeholder.jpg',
        category: 'geral',
        description: '',
        unit: 'unidade',
        leadTimeDays: 5,
        minQuantity: 1,
      },
      clicks: realStats.mostClicked.clicks,
      interestRate: '14.2%',
      estimatedOrders: Math.max(1, Math.round(realStats.mostClicked.clicks * 0.18)),
    } : baseAnalytics.mostClickedProduct,
  } : baseAnalytics;

  const activeCategories = categories.filter((c) => c.id !== 'todos');

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === 'todos' || p.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  if (loading) {
    return (
      <div className={styles.adminWrapper} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p>Carregando painel administrativo...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminWrapper}>
      {/* Barra Lateral de Navegação (Sidebar) */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <Link href="/" className={styles.sidebarLogoLockup} title="Ir para a loja">
            <span className={styles.sidebarLogoScript}>Wê</span>
            <span className={styles.sidebarLogoSerif}>Lembrancinhas</span>
          </Link>
          <span className={styles.adminTag}>Painel Administrativo</span>
        </div>

        <div className={styles.sidebarSectionLabel}>Menu Principal</div>
        <nav className={styles.sidebarNav}>
          <button
            type="button"
            onClick={() => setMainTab('pedidos')}
            className={`${styles.sidebarNavItem} ${mainTab === 'pedidos' ? styles.sidebarNavItemActive : ''}`}
          >
            <ClipboardList size={18} />
            <span>Pedidos & Produção</span>
            {ordersCount > 0 && <span className={styles.counterPill}>{ordersCount}</span>}
          </button>

          <button
            type="button"
            onClick={() => setMainTab('produtos')}
            className={`${styles.sidebarNavItem} ${mainTab === 'produtos' ? styles.sidebarNavItemActive : ''}`}
          >
            <Package size={18} />
            <span>Gerenciamento de Produtos</span>
            <span className={styles.counterPill}>{products.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('ajustes')}
            className={`${styles.sidebarNavItem} ${mainTab === 'ajustes' ? styles.sidebarNavItemActive : ''}`}
          >
            <Sliders size={18} />
            <span>Ajustes da Loja</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('cupons')}
            className={`${styles.sidebarNavItem} ${mainTab === 'cupons' ? styles.sidebarNavItemActive : ''}`}
          >
            <Ticket size={18} />
            <span>Cupons de Desconto</span>
            {couponsCount > 0 && <span className={styles.counterPill}>{couponsCount}</span>}
          </button>

          <button
            type="button"
            onClick={() => setMainTab('dashboard')}
            className={`${styles.sidebarNavItem} ${mainTab === 'dashboard' ? styles.sidebarNavItemActive : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('calculadora')}
            className={`${styles.sidebarNavItem} ${mainTab === 'calculadora' ? styles.sidebarNavItemActive : ''}`}
          >
            <Calculator size={18} />
            <span>Calculadora de Preços</span>
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarStatusBox}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.6875rem', color: '#8C7A6B', fontWeight: 600 }}>STATUS DA LOJA</span>
              <span className={isStoreOnline ? styles.onlineBadge : styles.offlineBadge}>
                <span className={isStoreOnline ? styles.onlineDot : styles.offlineDot} /> {isStoreOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleStoreOnline}
              disabled={updatingStoreStatus}
              className={styles.statusToggleBtn}
              title={isStoreOnline ? 'Clique para deixar offline para pedidos' : 'Clique para deixar online para pedidos'}
            >
              {isStoreOnline ? (
                <>
                  <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: '#FF4D4F' }} />
                  <span>Deixar Offline</span>
                </>
              ) : (
                <>
                  <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: '#52C41A' }} />
                  <span>Deixar Online</span>
                </>
              )}
            </button>
          </div>

          <Link href="/" target="_blank" className={styles.sidebarLink}>
            <ExternalLink size={14} />
            <span>Ver Loja Virtual</span>
          </Link>

          <button onClick={handleLogout} className={styles.sidebarLogoutBtn} title="Encerrar sessão">
            <LogOut size={14} />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* Área de Conteúdo à Direita */}
      <div className={styles.mainContainer}>
        {/* Barra de Navegação Superior */}
        <header className={styles.topBar}>
          <div className={styles.brandGroup}>
            <div className={styles.mobileNavTabs}>
              <button
                type="button"
                onClick={() => setMainTab('pedidos')}
                className={`${styles.mobileTabBtn} ${mainTab === 'pedidos' ? styles.mobileTabBtnActive : ''}`}
              >
                <ClipboardList size={14} />
                <span>Pedidos ({ordersCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setMainTab('produtos')}
                className={`${styles.mobileTabBtn} ${mainTab === 'produtos' ? styles.mobileTabBtnActive : ''}`}
              >
                <Package size={14} />
                <span>Produtos ({products.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMainTab('ajustes')}
                className={`${styles.mobileTabBtn} ${mainTab === 'ajustes' ? styles.mobileTabBtnActive : ''}`}
              >
                <Sliders size={14} />
                <span>Ajustes</span>
              </button>

              <button
                type="button"
                onClick={() => setMainTab('cupons')}
                className={`${styles.mobileTabBtn} ${mainTab === 'cupons' ? styles.mobileTabBtnActive : ''}`}
              >
                <Ticket size={14} />
                <span>Cupons ({couponsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setMainTab('dashboard')}
                className={`${styles.mobileTabBtn} ${mainTab === 'dashboard' ? styles.mobileTabBtnActive : ''}`}
              >
                <LayoutDashboard size={14} />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setMainTab('calculadora')}
                className={`${styles.mobileTabBtn} ${mainTab === 'calculadora' ? styles.mobileTabBtnActive : ''}`}
              >
                <Calculator size={14} />
                <span>Calculadora</span>
              </button>
            </div>
            <div className={styles.desktopTabTitle}>
              <h2 className={styles.topBarHeading}>
                {mainTab === 'pedidos' ? 'Fila de Produção & Pedidos' : mainTab === 'produtos' ? 'Gerenciamento de Produtos' : mainTab === 'ajustes' ? 'Ajustes & Configurações da Loja' : mainTab === 'cupons' ? 'Cupons de Desconto & Promoções' : mainTab === 'dashboard' ? 'Dashboard & Métricas' : 'Calculadora de Custos & Preço Sugerido'}
              </h2>
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
          {/* Aba 1: Gestão de Pedidos & Fila de Produção */}
          {mainTab === 'pedidos' && (
            <OrdersProductionTab onOrderCountChange={setOrdersCount} />
          )}

          {/* Aba 2: Gerenciamento de Produtos */}
          {mainTab === 'produtos' && (
            <section className={styles.productsSection}>
              {/* Cabeçalho da Tabela de Catálogo */}
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.pageHeading}>Gerenciamento de Produtos</h2>
            <p className={styles.pageSubheading}>
              Edite fotos, modelos, preços e perguntas personalizadas de cada lembrancinha.
            </p>
          </div>

          <button onClick={handleOpenCreateModal} className={styles.newProductBtn}>
            <Plus size={18} />
            <span>Novo Produto</span>
          </button>
        </div>

        {/* Barra de Filtro e Busca Rápida */}
        <div className={styles.searchFilterBar}>
          <div className={styles.searchBox}>
            <Search size={16} color="#8C7A6B" />
            <input
              type="text"
              placeholder="Buscar produto por nome ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E9084' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className={styles.filterControls}>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="todos">Todas as Categorias</option>
              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <span className={styles.filterCountBadge}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
            </span>
          </div>
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
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
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
                          onClick={() => handleOpenEditProduct(p)}
                          className={styles.editBtn}
                          title="Editar publicação do produto"
                        >
                          <Pencil size={14} />
                        </button>
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
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#8C7A6B' }}>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Nenhum produto encontrado</p>
                    <p style={{ fontSize: '0.75rem' }}>Tente alterar a busca ou filtro de categoria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
            </section>
          )}

          {/* Aba 3: Ajustes & Configurações da Loja */}
          {mainTab === 'ajustes' && (
            <StoreSettingsTab />
          )}

          {/* Aba 4: Gestão de Cupons de Desconto */}
          {mainTab === 'cupons' && (
            <CouponsTab onCouponsCountChange={setCouponsCount} />
          )}

          {/* Aba 5: Dashboard de Métricas */}
          {mainTab === 'dashboard' && (
            <section className={styles.dashboardSection}>
          <div className={styles.periodHeaderRow}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h2 className={styles.dashboardHeading}>Dashboard de Desempenho & Vendas</h2>
                {isDbConfigured ? (
                  <span className={styles.databaseStatusBadge + ' ' + styles.databaseStatusBadgeConnected}>
                    <ShieldCheck size={12} /> Supabase Ativo (Dados Reais)
                  </span>
                ) : (
                  <span className={styles.databaseStatusBadge + ' ' + styles.databaseStatusBadgeDemo}>
                    ⚡ Modo Demonstração (Sem Banco)
                  </span>
                )}
              </div>
              <p className={styles.dashboardSubheading}>
                Acompanhe o faturamento, lembrancinhas vendidas, visitas e os produtos campeões de cliques.
              </p>
            </div>

            {/* Seletor de Período: Semana, Mês ou Ano */}
            <div className={styles.periodSelectorGroup}>
              <button
                type="button"
                onClick={() => setPeriod('semana')}
                className={`${styles.periodBtn} ${period === 'semana' ? styles.periodBtnActive : ''}`}
                title="Visualizar métricas desta semana"
              >
                <Calendar size={13} />
                <span>Semana</span>
              </button>
              <button
                type="button"
                onClick={() => setPeriod('mes')}
                className={`${styles.periodBtn} ${period === 'mes' ? styles.periodBtnActive : ''}`}
                title="Visualizar métricas deste mês"
              >
                <Calendar size={13} />
                <span>Mês</span>
              </button>
              <button
                type="button"
                onClick={() => setPeriod('ano')}
                className={`${styles.periodBtn} ${period === 'ano' ? styles.periodBtnActive : ''}`}
                title="Visualizar métricas deste ano"
              >
                <Calendar size={13} />
                <span>Ano</span>
              </button>
            </div>
          </div>

          {!isDbConfigured && (
            <div className={styles.databaseNoticeBanner}>
              <div>
                <div className={styles.databaseNoticeTitle}>Banco de Dados Supabase Pronto para Ativação</div>
                <p className={styles.databaseNoticeDesc}>
                  As tabelas e o rastreamento automático de visitas, cliques e pedidos já estão integrados no código! Assim que você adicionar suas chaves do Supabase no arquivo <code>.env.local</code>, este painel passará a exibir números 100% reais em tempo real.
                </p>
              </div>
            </div>
          )}

          {/* Cards de KPIs Principais (Reativos ao Período Selecionado) */}
          <div className={styles.kpiGrid}>
            {/* Card 1: Valor Total de Ganhos */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiContent}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className={styles.kpiLabel}>Valor Total de Ganhos</span>
                  <span className={styles.trendBadge} title="Crescimento vs período anterior">
                    <ArrowUpRight size={11} /> {analytics.growthRevenue}
                  </span>
                </div>
                <span className={styles.kpiValue}>
                  {analytics.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className={styles.kpiSubtext}>Faturamento {analytics.periodUnitLabel}</span>
              </div>
              <div className={styles.kpiIconWrapper} style={{ color: '#2E7D32', backgroundColor: '#F1F8E9' }}>
                <TrendingUp size={22} />
              </div>
            </div>

            {/* Card 2: Quantidade de Lembrancinhas Vendidas */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiContent}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className={styles.kpiLabel}>Lembrancinhas Vendidas</span>
                  <span className={styles.trendBadge} title="Crescimento vs período anterior">
                    <ArrowUpRight size={11} /> {analytics.growthUnits}
                  </span>
                </div>
                <span className={styles.kpiValue}>{analytics.unitsSold} un.</span>
                <span className={styles.kpiSubtext}>Itens entregues {analytics.periodUnitLabel}</span>
              </div>
              <div className={styles.kpiIconWrapper}>
                <Gift size={22} />
              </div>
            </div>

            {/* Card 3: Visitas no Site */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiContent}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className={styles.kpiLabel}>Visitas no Site</span>
                  <span className={styles.trendBadge} title="Crescimento vs período anterior">
                    <ArrowUpRight size={11} /> {analytics.growthVisits}
                  </span>
                </div>
                <span className={styles.kpiValue}>{analytics.visits.toLocaleString('pt-BR')}</span>
                <span className={styles.kpiSubtext}>Acessos {analytics.periodUnitLabel}</span>
              </div>
              <div className={styles.kpiIconWrapper} style={{ color: '#0288D1', backgroundColor: '#E1F5FE' }}>
                <Eye size={22} />
              </div>
            </div>

            {/* Card 4: Produto com Mais Cliques */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiContent}>
                <span className={styles.kpiLabel}>Mais Clicado</span>
                <span className={styles.kpiValue}>
                  {analytics.mostClickedProduct ? `${analytics.mostClickedProduct.clicks} cliques` : '0 cliques'}
                </span>
                <span className={styles.kpiSubtext} style={{ maxWidth: '170px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {analytics.mostClickedProduct ? analytics.mostClickedProduct.product.name : 'Nenhum'}
                </span>
              </div>
              <div className={styles.kpiIconWrapper} style={{ color: '#D84315', backgroundColor: '#FBE9E7' }}>
                <Flame size={22} />
              </div>
            </div>
          </div>

          {/* Grid Analítica: Produtos Mais Vendidos & Produto com Mais Cliques em Detalhe */}
          <div className={styles.analyticsGrid}>
            {/* Card 1: Ranking dos Produtos Mais Vendidos */}
            <div className={styles.analyticsCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  <Trophy size={18} color="#D4AF37" /> Produtos Mais Vendidos
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#8C7A6B', fontWeight: 600 }}>
                  Ranking de {analytics.periodLabel.toLowerCase()}
                </span>
              </div>

              <div className={styles.topSellersList}>
                {analytics.topSellingProducts.map((p, idx) => (
                  <div key={p.id} className={styles.topSellerRow}>
                    <div 
                      className={`${styles.rankBadge} ${
                        idx === 0 ? styles.rank1 : idx === 1 ? styles.rank2 : idx === 2 ? styles.rank3 : styles.rankOther
                      }`}
                    >
                      #{idx + 1}
                    </div>

                    <img src={p.image} alt={p.name} className={styles.topSellerThumb} />

                    <div className={styles.topSellerInfo}>
                      <div className={styles.topSellerName} title={p.name}>
                        {p.name}
                      </div>
                      <div className={styles.topSellerMeta}>
                        <span>{p.category}</span>
                        <span>•</span>
                        <span>{p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/un</span>
                      </div>
                      <div className={styles.topSellerBarContainer}>
                        <div className={styles.topSellerBarFill} style={{ width: `${Math.max(8, p.sharePercentage)}%` }} />
                      </div>
                    </div>

                    <div className={styles.topSellerStats}>
                      <span className={styles.topSellerUnits}>{p.unitsSold} vendidas</span>
                      <span className={styles.topSellerRevenue}>
                        {p.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Destaque de Engajamento e Produto Mais Clicado */}
            <div className={styles.analyticsCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  <Flame size={18} color="#D84315" /> Produto com Mais Cliques
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#8C7A6B', fontWeight: 600 }}>
                  Maior interesse
                </span>
              </div>

              {analytics.mostClickedProduct ? (
                <div className={styles.mostClickedCard}>
                  <div className={styles.mostClickedHeader}>
                    <span className={styles.flameBadge}>
                      <Flame size={13} /> Campeão de Cliques
                    </span>
                    <span style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 600 }}>
                      {analytics.periodLabel}
                    </span>
                  </div>

                  <div className={styles.mostClickedProductRow}>
                    <img
                      src={analytics.mostClickedProduct.product.image}
                      alt={analytics.mostClickedProduct.product.name}
                      className={styles.mostClickedImg}
                    />
                    <div className={styles.mostClickedDetails}>
                      <div className={styles.mostClickedName}>
                        {analytics.mostClickedProduct.product.name}
                      </div>
                      <div className={styles.mostClickedPrice}>
                        {analytics.mostClickedProduct.product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {analytics.mostClickedProduct.product.unit || 'unidade'}
                      </div>
                    </div>
                  </div>

                  <div className={styles.clicksCounterBox}>
                    <div className={styles.clickStatItem}>
                      <span className={styles.clickStatNumber}>{analytics.mostClickedProduct.clicks}</span>
                      <span className={styles.clickStatLabel}>Cliques no Catálogo</span>
                    </div>
                    <div className={styles.clickStatItem}>
                      <span className={styles.clickStatNumber}>{analytics.mostClickedProduct.interestRate}</span>
                      <span className={styles.clickStatLabel}>Taxa de Interesse</span>
                    </div>
                    <div className={styles.clickStatItem}>
                      <span className={styles.clickStatNumber}>~{analytics.mostClickedProduct.estimatedOrders}</span>
                      <span className={styles.clickStatLabel}>Lembrancinhas</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.75rem', color: '#8C7A6B' }}>Nenhum produto analisado.</p>
              )}

              {/* Informações Operacionais Adicionais */}
              <div className={styles.infoRowsList} style={{ marginTop: '0.875rem' }}>
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>
                    <MessageCircle size={14} color="#25D366" /> WhatsApp Oficial:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={styles.infoRowValue}>
                      {STORE_CONFIG.whatsappNumber.length >= 12
                        ? `+${STORE_CONFIG.whatsappNumber.slice(0, 2)} (${STORE_CONFIG.whatsappNumber.slice(2, 4)}) ${STORE_CONFIG.whatsappNumber.slice(4, 9)}-${STORE_CONFIG.whatsappNumber.slice(9)}`
                        : STORE_CONFIG.whatsappNumber}
                    </span>
                    <a
                      href={`https://wa.me/${STORE_CONFIG.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.testWhatsappBtn}
                      title="Testar conversa no WhatsApp"
                    >
                      Testar
                    </a>
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Status da Loja:</span>
                  <span className={styles.onlineBadge}>
                    <span className={styles.onlineDot} /> Online & Aberta para Pedidos
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
          )}

          {/* Aba 6: Calculadora de Custos & Preço Sugerido */}
          {mainTab === 'calculadora' && (
            <CostCalculatorTab onApplyPrice={(suggested) => {
              setPrice(suggested);
              setMainTab('produtos');
              setIsModalOpen(true);
            }} />
          )}
        </main>
      </div>

      {/* Modal de Criação / Edição de Produto */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingProductId ? 'Editar Publicação do Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button onClick={handleCloseModal} className={styles.closeBtn}>
                <X size={16} />
              </button>
            </div>

            {/* Barra de Abas do Modal */}
            <div className={styles.modalTabsBar}>
              <button
                type="button"
                onClick={() => setModalTab('basico')}
                className={`${styles.modalTabBtn} ${modalTab === 'basico' ? styles.modalTabBtnActive : ''}`}
              >
                <Package size={14} />
                <span>Dados Principais</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('fotos')}
                className={`${styles.modalTabBtn} ${modalTab === 'fotos' ? styles.modalTabBtnActive : ''}`}
              >
                <Upload size={14} />
                <span>Fotos ({1 + additionalImages.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('modelos')}
                className={`${styles.modalTabBtn} ${modalTab === 'modelos' ? styles.modalTabBtnActive : ''}`}
              >
                <Layers size={14} />
                <span>Modelos & Preços {hasVariations ? `(${variations.length})` : ''}</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('personalizacao')}
                className={`${styles.modalTabBtn} ${modalTab === 'personalizacao' ? styles.modalTabBtnActive : ''}`}
              >
                <AlertCircle size={14} />
                <span>Personalização</span>
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <label className={styles.label} style={{ margin: 0 }}>
                        Preço (R$) <span className={styles.reqStar}>*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCalculatorModalOpen(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6D4C3D',
                          fontSize: '0.71875rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '0.35rem',
                          backgroundColor: '#F5EDE4',
                        }}
                        title="Calcular preço ideal com base em custos e margem"
                      >
                        <Calculator size={11} />
                        <span>Calcular</span>
                      </button>
                    </div>
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

              {/* Seção 2: Fotos com Remoção e Gerenciamento */}
              <div className={styles.sectionBox}>
                <h4 className={styles.sectionTitle}>
                  <Upload size={16} /> Fotos da Publicação
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#7C6E64', margin: '0 0 0.75rem 0' }}>
                  Gerencie a foto de capa e as fotos secundárias do produto. Você pode adicionar ou remover qualquer foto a qualquer momento.
                </p>

                {/* 2.1 Foto Principal / Capa */}
                <div className={styles.photoBlock}>
                  <span className={styles.photoBlockTitle}>
                    Foto Principal (Capa) <span className={styles.reqStar}>*</span>
                  </span>

                  {mainImage ? (
                    <div className={styles.mainPhotoCard}>
                      <img src={mainImage} alt="Foto Principal" className={styles.mainPhotoImg} />
                      <div className={styles.mainPhotoInfo}>
                        <div className={styles.badgeCover}>Capa Principal</div>
                        <span className={styles.photoUrlText}>{mainImage}</span>
                        <div className={styles.photoActionsRow}>
                          <button
                            type="button"
                            onClick={() =>
                              setCropTarget({
                                type: 'main',
                                url: mainImage,
                                title: 'Ajustar / Cortar Foto da Capa',
                              })
                            }
                            className={styles.adjustPhotoBtn}
                            title="Cortar, girar e ajustar foto da capa"
                          >
                            <Crop size={13} />
                            <span>Ajustar / Cortar</span>
                          </button>
                          <label className={styles.changePhotoBtn}>
                            <Upload size={13} />
                            <span>Trocar Foto</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleImageUpload(e, 'main')}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setMainImage('')}
                            className={styles.deletePhotoBtn}
                            title="Remover foto principal"
                          >
                            <Trash2 size={13} />
                            <span>Remover Foto</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.emptyPhotoBox}>
                      <p style={{ fontSize: '0.8125rem', color: '#8C7A6B', marginBottom: '0.5rem' }}>
                        Nenhuma foto de capa definida. Envie uma foto ou cole a URL abaixo:
                      </p>
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
                          placeholder="Cole o caminho ou URL (ex: /images/...)"
                          value={mainImage}
                          onChange={(e) => setMainImage(e.target.value)}
                          className={styles.input}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2.2 Galeria de Fotos Adicionais */}
                <div className={styles.photoBlock} style={{ marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={styles.photoBlockTitle}>
                      Fotos Adicionais / Galeria ({additionalImages.length})
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#9E9084' }}>
                      Aparecem na rolagem de fotos e no verso
                    </span>
                  </div>

                  {additionalImages.length > 0 ? (
                    <div className={styles.galleryGrid}>
                      {additionalImages.map((imgUrl, idx) => (
                        <div key={idx} className={styles.galleryCard}>
                          <div className={styles.galleryImgWrapper}>
                            <img src={imgUrl} alt={`Foto ${idx + 2}`} className={styles.galleryImg} />
                            <button
                              type="button"
                              onClick={() => handleRemoveAdditionalImage(idx)}
                              className={styles.galleryRemoveBtn}
                              title="Remover esta foto da publicação"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <div className={styles.galleryCardFooter}>
                            <span className={styles.galleryPhotoIndex}>Foto #{idx + 2}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setCropTarget({
                                  type: 'additional',
                                  index: idx,
                                  url: imgUrl,
                                  title: `Ajustar / Cortar Foto #${idx + 2}`,
                                })
                              }
                              className={styles.galleryAdjustBtn}
                              title="Cortar, girar e ajustar esta foto"
                            >
                              <Crop size={11} /> Ajustar / Cortar
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePromoteToMain(idx)}
                              className={styles.promoteBtn}
                              title="Definir esta foto como a capa principal"
                            >
                              Tornar Capa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyGalleryNote}>
                      Nenhuma foto adicional no momento. Você pode adicionar mais fotos abaixo:
                    </div>
                  )}

                  {/* Adicionar Foto à Galeria */}
                  <div className={styles.addGalleryRow}>
                    <label className={styles.uploadBtn}>
                      <Upload size={14} />
                      <span>{uploadingImage ? 'Enviando...' : 'Adicionar Foto do Computador'}</span>
                      <input
                        ref={additionalFileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleAdditionalImagesUpload}
                      />
                    </label>
                    <div className={styles.urlAddWrapper}>
                      <input
                        type="text"
                        placeholder="Ou cole a URL da foto..."
                        value={newAdditionalUrl}
                        onChange={(e) => setNewAdditionalUrl(e.target.value)}
                        className={styles.input}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={handleAddAdditionalUrl}
                        className={styles.addUrlBtn}
                        disabled={!newAdditionalUrl.trim()}
                      >
                        <Plus size={14} /> Adicionar
                      </button>
                    </div>
                  </div>
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
                            <Trash2 size={12} /> Remover Modelo
                          </button>
                        </div>

                        <div className={styles.grid2}>
                          <div className={styles.formField}>
                            <label className={styles.label}>
                              Nome do Modelo <span className={styles.reqStar}>*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: Talento Avelãs, Azul Marinho, Capa Vermelha..."
                              value={v.name}
                              onChange={(e) => {
                                const next = [...variations];
                                next[idx].name = e.target.value;
                                setVariations(next);
                              }}
                              className={styles.input}
                            />
                          </div>

                          {/* Campo de Preço Específico do Modelo */}
                          <div className={styles.formField}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                              <label className={styles.label} style={{ margin: 0, fontWeight: 700, color: '#4A3326' }}>
                                Preço deste Modelo (R$)
                              </label>
                              {v.price && !isNaN(parseFloat(v.price.replace(',', '.'))) ? (
                                <span className={styles.modelPriceBadge}>
                                  R$ {parseFloat(v.price.replace(',', '.')).toFixed(2).replace('.', ',')}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.6875rem', color: '#8C7A6B' }}>
                                  Herda R$ {price || '0,00'}
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder={`Ex: 79.90 (ou vazio p/ herdar R$ ${price || '0,00'})`}
                              value={v.price || ''}
                              onChange={(e) => {
                                const next = [...variations];
                                next[idx].price = e.target.value;
                                setVariations(next);
                              }}
                              className={styles.input}
                            />
                          </div>
                        </div>

                        {/* Campo de Descrição Específica do Modelo */}
                        <div className={styles.formField} style={{ marginTop: '0.625rem', backgroundColor: '#FDFBF7', padding: '0.75rem', borderRadius: '0.625rem', border: '1px solid #E8DFD5' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                            <label className={styles.label} style={{ margin: 0, fontWeight: 700, color: '#4A3326', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span>📝 Descrição do Modelo</span>
                              <span style={{ fontSize: '0.6875rem', fontWeight: 400, color: '#8C7A6B' }}>(O que muda neste modelo)</span>
                            </label>
                            {description && description.trim() && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = [...variations];
                                  next[idx].description = description.trim();
                                  setVariations(next);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#6D4C3D',
                                  fontSize: '0.71875rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  padding: 0,
                                }}
                                title="Copiar o texto da descrição geral do produto para personalizar apenas o que muda neste modelo"
                              >
                                📋 Copiar descrição geral como base
                              </button>
                            )}
                          </div>
                          <textarea
                            rows={3}
                            placeholder="Descreva o que muda neste modelo (materiais, tamanhos, cores, itens ou doces inclusos...). Se deixar em branco, o produto continuará exibindo a descrição geral."
                            value={v.description || ''}
                            onChange={(e) => {
                              const next = [...variations];
                              next[idx].description = e.target.value;
                              setVariations(next);
                            }}
                            className={styles.textarea}
                          />
                          <span style={{ fontSize: '0.6875rem', color: '#8C7A6B', marginTop: '0.25rem', display: 'block' }}>
                            💡 Quando o cliente selecionar este modelo na loja, esta descrição substituirá o texto geral automaticamente.
                          </span>
                        </div>

                        {/* Fotos do Modelo (Até 2 Fotos: Principal e 2ª Foto) */}
                        <div className={styles.grid2} style={{ marginTop: '0.5rem' }}>
                          {/* 1ª Foto do Modelo */}
                          <div className={styles.formField}>
                            <label className={styles.label}>1ª Foto do Modelo (Principal)</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <label className={styles.uploadBtn} style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}>
                                <Upload size={12} />
                                <span>Upload</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleImageUpload(e, { index: idx, slot: 1 })}
                                />
                              </label>
                              <input
                                type="text"
                                placeholder="URL ou envie a foto 1"
                                value={v.image}
                                onChange={(e) => {
                                  const next = [...variations];
                                  next[idx].image = e.target.value;
                                  setVariations(next);
                                }}
                                className={styles.input}
                                style={{ flex: 1 }}
                              />
                            </div>
                            {v.image && (
                              <div className={styles.modelPhotoPreviewRow}>
                                <img src={v.image} alt={v.name} className={styles.modelPhotoThumb} />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCropTarget({
                                      type: 'variation',
                                      index: idx,
                                      slot: 1,
                                      url: v.image,
                                      title: `Ajustar 1ª Foto — ${v.name || `Modelo ${idx + 1}`}`,
                                    })
                                  }
                                  className={styles.modelAdjustPhotoBtn}
                                  title="Cortar, girar e ajustar 1ª foto"
                                >
                                  <Crop size={11} /> Ajustar / Cortar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...variations];
                                    next[idx].image = '';
                                    setVariations(next);
                                  }}
                                  className={styles.removeModelPhotoBtn}
                                  title="Remover 1ª foto"
                                >
                                  <Trash2 size={11} /> Remover Foto
                                </button>
                              </div>
                            )}
                          </div>

                          {/* 2ª Foto do Modelo */}
                          <div className={styles.formField}>
                            <label className={styles.label}>2ª Foto do Modelo (Opcional - Ângulo 2)</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <label className={styles.uploadBtn} style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}>
                                <Upload size={12} />
                                <span>Upload</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleImageUpload(e, { index: idx, slot: 2 })}
                                />
                              </label>
                              <input
                                type="text"
                                placeholder="URL ou envie a foto 2"
                                value={v.image2 || ''}
                                onChange={(e) => {
                                  const next = [...variations];
                                  next[idx].image2 = e.target.value;
                                  setVariations(next);
                                }}
                                className={styles.input}
                                style={{ flex: 1 }}
                              />
                            </div>
                            {v.image2 && (
                              <div className={styles.modelPhotoPreviewRow}>
                                <img src={v.image2} alt={v.name} className={styles.modelPhotoThumb} />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCropTarget({
                                      type: 'variation',
                                      index: idx,
                                      slot: 2,
                                      url: v.image2,
                                      title: `Ajustar 2ª Foto — ${v.name || `Modelo ${idx + 1}`}`,
                                    })
                                  }
                                  className={styles.modelAdjustPhotoBtn}
                                  title="Cortar, girar e ajustar 2ª foto"
                                >
                                  <Crop size={11} /> Ajustar / Cortar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...variations];
                                    next[idx].image2 = '';
                                    setVariations(next);
                                  }}
                                  className={styles.removeModelPhotoBtn}
                                  title="Remover 2ª foto"
                                >
                                  <Trash2 size={11} /> Remover Foto
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    <button type="button" onClick={handleAddVariation} className={styles.addModelBtn}>
                      <Plus size={14} /> Adicionar Outro Modelo
                    </button>

                    {/* Mensagem / Aviso abaixo dos Modelos na Loja */}
                    <div style={{ marginTop: '0.875rem', backgroundColor: '#FAF7F2', border: '1px solid #E8DFD5', borderRadius: '0.625rem', padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4A3326', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                          <span>📸 Aviso / Mensagem abaixo dos Modelos (Opcional)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setVariationsNote('📸 As fotos para a personalização deste produto devem ser enviadas pelo nosso WhatsApp após o fechamento do pedido!')}
                          style={{
                            background: 'none',
                            border: '1px solid #DACFBF',
                            borderRadius: '0.375rem',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: '#6D4C3D',
                            cursor: 'pointer',
                            backgroundColor: '#FFFFFF',
                          }}
                          title="Inserir texto padrão para envio de fotos pelo WhatsApp"
                        >
                          + Inserir aviso de fotos pelo WhatsApp
                        </button>
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: '#8C7A6B' }}>
                        Este aviso aparecerá em destaque logo abaixo dos modelos na loja do cliente.
                      </span>
                      <textarea
                        rows={2}
                        placeholder="Ex: 📸 As fotos para este modelo devem ser enviadas pelo nosso WhatsApp após o fechamento do pedido!"
                        value={variationsNote}
                        onChange={(e) => setVariationsNote(e.target.value)}
                        className={styles.textarea}
                        style={{ backgroundColor: '#FFFFFF' }}
                      />
                    </div>
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
                    <div style={{ paddingLeft: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.625rem' }}>
                        <div>
                          <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#553A2D', display: 'block', marginBottom: '0.25rem' }}>
                            Nome do Campo (Pergunta exibida ao cliente) <span className={styles.reqStar}>*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Nome na Lembrancinha, Nome da Criança..."
                            value={childNameLabel}
                            onChange={(e) => setChildNameLabel(e.target.value)}
                            className={styles.input}
                            style={{ backgroundColor: '#FFFFFF' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#553A2D', display: 'block', marginBottom: '0.25rem' }}>
                            Texto de Exemplo dentro da caixa (Placeholder)
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Professora Leandra, Luís (ou digite seu exemplo)..."
                            value={childNamePlaceholder}
                            onChange={(e) => setChildNamePlaceholder(e.target.value)}
                            className={styles.input}
                            style={{ backgroundColor: '#FFFFFF' }}
                          />
                        </div>
                      </div>

                      <label className={styles.checkboxLabel} style={{ fontSize: '0.8125rem' }}>
                        <input
                          type="checkbox"
                          checked={childNameRequired}
                          onChange={(e) => setChildNameRequired(e.target.checked)}
                          className={styles.checkboxInput}
                        />
                        <span style={{ fontWeight: 600, color: childNameRequired ? '#CF1322' : '#6D4C3D' }}>
                          {childNameRequired ? 'Preenchimento Obrigatório *' : 'Opcional (cliente pode deixar em branco)'}
                        </span>
                      </label>
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
                    <div style={{ paddingLeft: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Digite as cores separadas por vírgula (ex: Laço Dourado, Laço Rosa, Laço Verde)"
                        value={ribbonColorsText}
                        onChange={(e) => setRibbonColorsText(e.target.value)}
                        className={styles.input}
                      />
                      <label className={styles.checkboxLabel} style={{ fontSize: '0.8125rem' }}>
                        <input
                          type="checkbox"
                          checked={ribbonColorRequired}
                          onChange={(e) => setRibbonColorRequired(e.target.checked)}
                          className={styles.checkboxInput}
                        />
                        <span style={{ fontWeight: 600, color: ribbonColorRequired ? '#CF1322' : '#6D4C3D' }}>
                          {ribbonColorRequired ? 'Escolha do laço Obrigatória *' : 'Opcional (usa o laço padrão da foto)'}
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Switch: Observações Especiais */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={allowNotes}
                      onChange={(e) => setAllowNotes(e.target.checked)}
                      className={styles.checkboxInput}
                    />
                    <span>Permitir campo de Observações Especiais</span>
                  </label>
                  {allowNotes && (
                    <div style={{ paddingLeft: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#553A2D', display: 'block', marginBottom: '0.15rem' }}>
                        Texto de Exemplo das Observações (Placeholder)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Conte sua ideia! Pode escolher o tema, cores, frase ou qualquer detalhe especial..."
                        value={notesPlaceholder}
                        onChange={(e) => setNotesPlaceholder(e.target.value)}
                        className={styles.input}
                        style={{ backgroundColor: '#FFFFFF' }}
                      />
                    </div>
                  )}
                </div>

                {/* Campos Extras Dinâmicos */}
                {customFields.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6D4C3D' }}>
                        Campos Personalizados Extras ({customFields.length}):
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#8C7A6B' }}>
                        Defina quais campos são obrigatórios ou opcionais
                      </span>
                    </div>

                    {customFields.map((field, idx) => (
                      <div
                        key={field.id}
                        style={{
                          backgroundColor: '#FAF7F2',
                          border: '1px solid #E8DFD5',
                          borderRadius: '0.625rem',
                          padding: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.625rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#6D4C3D', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Campo Extra #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomField(field.id)}
                            className={styles.removeModelBtn}
                            title="Remover este campo personalizado"
                            style={{ margin: 0, padding: 0 }}
                          >
                            <Trash2 size={13} />
                            <span>Remover</span>
                          </button>
                        </div>

                        {/* Botões para alternar entre "Para Escrever" e "Para Escolher" */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', backgroundColor: '#FFFFFF', padding: '0.45rem 0.625rem', borderRadius: '0.5rem', border: '1px solid #E8DFD5' }}>
                          <span style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#4A3326', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>Tipo do Campo:</span>
                          </span>
                          <div style={{ display: 'inline-flex', borderRadius: '0.375rem', overflow: 'hidden', border: '1px solid #DACFBF', backgroundColor: '#FAF7F2' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...customFields];
                                next[idx].type = 'text';
                                setCustomFields(next);
                              }}
                              style={{
                                padding: '0.3rem 0.75rem',
                                fontSize: '0.75rem',
                                fontWeight: field.type !== 'select' ? 700 : 500,
                                backgroundColor: field.type !== 'select' ? '#6D4C3D' : 'transparent',
                                color: field.type !== 'select' ? '#FFFFFF' : '#6D4C3D',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <span>✍️ Para Escrever (Texto)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...customFields];
                                next[idx].type = 'select';
                                if (!next[idx].options) next[idx].options = [];
                                setCustomFields(next);
                              }}
                              style={{
                                padding: '0.3rem 0.75rem',
                                fontSize: '0.75rem',
                                fontWeight: field.type === 'select' ? 700 : 500,
                                backgroundColor: field.type === 'select' ? '#6D4C3D' : 'transparent',
                                color: field.type === 'select' ? '#FFFFFF' : '#6D4C3D',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <span>📋 Para Escolher (Lista de Opções)</span>
                            </button>
                          </div>
                        </div>

                        {/* Conteúdo dependente do tipo do campo */}
                        {field.type !== 'select' ? (
                          /* Modo 1: Texto Livre */
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.625rem' }}>
                            <div>
                              <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#553A2D', display: 'block', marginBottom: '0.25rem' }}>
                                Nome do Campo (Pergunta acima da caixa) <span className={styles.reqStar}>*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Time, Frase do Cartão, Nome..."
                                value={field.label}
                                onChange={(e) => {
                                  const next = [...customFields];
                                  next[idx].label = e.target.value;
                                  setCustomFields(next);
                                }}
                                className={styles.input}
                                style={{ backgroundColor: '#FFFFFF' }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#553A2D', display: 'block', marginBottom: '0.25rem' }}>
                                Texto dentro da caixa (Exemplo / Placeholder)
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Palmeiras, Flamengo, Vasco..."
                                value={field.placeholder || ''}
                                onChange={(e) => {
                                  const next = [...customFields];
                                  next[idx].placeholder = e.target.value;
                                  setCustomFields(next);
                                }}
                                className={styles.input}
                                style={{ backgroundColor: '#FFFFFF' }}
                              />
                            </div>
                          </div>
                        ) : (
                          /* Modo 2: Lista de Escolha (Dropdown/Select) */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.625rem' }}>
                              <div>
                                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#553A2D', display: 'block', marginBottom: '0.25rem' }}>
                                  Nome da Pergunta de Escolha <span className={styles.reqStar}>*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ex: Escolha o Bombom, Sabor, Cor..."
                                  value={field.label}
                                  onChange={(e) => {
                                    const next = [...customFields];
                                    next[idx].label = e.target.value;
                                    setCustomFields(next);
                                  }}
                                  className={styles.input}
                                  style={{ backgroundColor: '#FFFFFF' }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#553A2D', display: 'block', marginBottom: '0.25rem' }}>
                                  Texto da 1ª Opção Padrão (Placeholder)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ex: Selecione o bombom..."
                                  value={field.placeholder || ''}
                                  onChange={(e) => {
                                    const next = [...customFields];
                                    next[idx].placeholder = e.target.value;
                                    setCustomFields(next);
                                  }}
                                  className={styles.input}
                                  style={{ backgroundColor: '#FFFFFF' }}
                                />
                              </div>
                            </div>

                            <div>
                              <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#553A2D', display: 'block', marginBottom: '0.25rem' }}>
                                Opções para o cliente escolher (Separe cada opção por vírgula) <span className={styles.reqStar}>*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Sonho de Valsa, Ouro Branco, Serenata de Amor"
                                value={field.optionsText !== undefined ? field.optionsText : (field.options?.join(', ') || '')}
                                onChange={(e) => {
                                  const text = e.target.value;
                                  const next = [...customFields];
                                  next[idx].optionsText = text;
                                  next[idx].options = text.split(',').map((s) => s.trim()).filter(Boolean);
                                  setCustomFields(next);
                                }}
                                className={styles.input}
                                style={{ backgroundColor: '#FFFFFF' }}
                              />

                              {/* Prévia visual das opções detectadas */}
                              <div style={{ marginTop: '0.35rem' }}>
                                {field.options && field.options.filter(Boolean).length > 0 ? (
                                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                                    <span style={{ fontSize: '0.6875rem', color: '#8C7A6B', fontWeight: 600 }}>
                                      Opções que aparecerão na lista:
                                    </span>
                                    {field.options.filter(Boolean).map((opt, oIdx) => (
                                      <span
                                        key={oIdx}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                          backgroundColor: '#FAF0E6',
                                          border: '1px solid #DACFBF',
                                          color: '#553A2D',
                                          padding: '0.2rem 0.5rem',
                                          borderRadius: '0.375rem',
                                          fontSize: '0.71875rem',
                                          fontWeight: 600,
                                        }}
                                      >
                                        ✓ {opt}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.6875rem', color: '#8C7A6B', fontStyle: 'italic' }}>
                                    💡 Digite as opções separadas por vírgula (ex: Sonho de Valsa, Ouro Branco)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Caixa para definir se o campo é OBRIGATÓRIO */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.35rem', borderTop: '1px dashed #E8DFD5' }}>
                          <label className={styles.checkboxLabel} style={{ fontSize: '0.8125rem', margin: 0, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={field.required !== false}
                              onChange={(e) => {
                                const next = [...customFields];
                                next[idx].required = e.target.checked;
                                setCustomFields(next);
                              }}
                              className={styles.checkboxInput}
                            />
                            <span style={{ fontWeight: 600, color: field.required !== false ? '#CF1322' : '#6D4C3D' }}>
                              {field.type === 'select'
                                ? (field.required !== false ? 'Escolha Obrigatória *' : 'Escolha Opcional')
                                : (field.required !== false ? 'Preenchimento Obrigatório *' : 'Opcional (cliente pode deixar em branco)')}
                            </span>
                          </label>
                          <span style={{ fontSize: '0.6875rem', color: '#8C7A6B' }}>
                            {field.required !== false ? 'Exige resposta antes de adicionar ao carrinho' : 'Não bloqueia a compra'}
                          </span>
                        </div>
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
                  onClick={handleCloseModal}
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
                  <span>
                    {saving 
                      ? (editingProductId ? 'Salvando Alterações...' : 'Publicando...') 
                      : (editingProductId ? 'Salvar Alterações' : 'Salvar e Publicar no Site')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rápido da Calculadora de Custos */}
      {isCalculatorModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCalculatorModalOpen(false)}>
          <div 
            className={styles.modalCard} 
            style={{ maxWidth: '64rem', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => setIsCalculatorModalOpen(false)}
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>
            <CostCalculatorTab onApplyPrice={(suggested) => {
              setPrice(suggested);
              setIsCalculatorModalOpen(false);
            }} />
          </div>
        </div>
      )}

      {/* Modal de Recorte e Ajuste de Imagens */}
      <ImageCropModal
        isOpen={Boolean(cropTarget)}
        imageUrl={cropTarget?.url || ''}
        title={cropTarget?.title}
        onClose={() => setCropTarget(null)}
        onSaveCropped={(newUrl) => {
          if (!cropTarget) return;
          if (cropTarget.type === 'main') {
            setMainImage(newUrl);
          } else if (cropTarget.type === 'additional') {
            setAdditionalImages((prev) =>
              prev.map((img, i) => (i === cropTarget.index ? newUrl : img))
            );
          } else if (cropTarget.type === 'variation') {
            setVariations((prev) =>
              prev.map((v, i) =>
                i === cropTarget.index
                  ? {
                      ...v,
                      [cropTarget.slot === 1 ? 'image' : 'image2']: newUrl,
                    }
                  : v
              )
            );
          }
          setCropTarget(null);
        }}
      />
    </div>
  );
}

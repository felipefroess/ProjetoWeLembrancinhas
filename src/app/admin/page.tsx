'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Crop,
  Download,
  Users,
  RefreshCw,
  Tag,
  Menu
} from 'lucide-react';
import { Product, Category, ProductVariation, CustomFieldDefinition, QuantityDiscount } from '@/types';
import OrdersProductionTab from './components/OrdersProductionTab';
import CouponsTab from './components/CouponsTab';
import StoreSettingsTab from './components/StoreSettingsTab';
import CostCalculatorTab from './components/CostCalculatorTab';
import CustomersTab from './components/CustomersTab';
import { ImageCropModal } from './components/ImageCropModal';
import { STORE_CONFIG } from '@/data/products';
import { getAnalyticsForPeriod, AnalyticsPeriod, TopProductStat } from '@/lib/analytics';
import styles from './Admin.module.css';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [mainTab, setMainTab] = useState<'pedidos' | 'clientes' | 'produtos' | 'ajustes' | 'cupons' | 'dashboard' | 'calculadora'>('pedidos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [customersCount, setCustomersCount] = useState<number>(0);
  const [couponsCount, setCouponsCount] = useState<number>(0);
  const [isStoreOnline, setIsStoreOnline] = useState<boolean>(true);
  const [updatingStoreStatus, setUpdatingStoreStatus] = useState<boolean>(false);

  const [period, setPeriod] = useState<AnalyticsPeriod>('mes');
  const [realStats, setRealStats] = useState<any>(null);
  const [isDbConfigured, setIsDbConfigured] = useState<boolean>(false);
  const [isRefreshingStats, setIsRefreshingStats] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchStats = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshingStats(true);
    try {
      const res = await fetch(`/api/analytics/stats?period=${period}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data && !data.error) {
        setIsDbConfigured(Boolean(data.configured));
        setRealStats(data);
        setLastUpdated(
          new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    } finally {
      if (showSpinner) setIsRefreshingStats(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, mainTab]);

  useEffect(() => {
    if (mainTab !== 'dashboard') return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchStats();
      }
    }, 5000);

    const handleFocus = () => fetchStats();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchStats();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [mainTab, period, fetchStats]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('todos');

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('natal');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('15.00');
  const [unit, setUnit] = useState('unidade');
  const [leadTimeDays, setLeadTimeDays] = useState('5');
  const [minQuantity, setMinQuantity] = useState('1');
  const [isBestSeller, setIsBestSeller] = useState(false);

  const [mainImage, setMainImage] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [newAdditionalUrl, setNewAdditionalUrl] = useState('');
  const [newVariationUrls, setNewVariationUrls] = useState<Record<number, string>>({});
  const [cropTarget, setCropTarget] = useState<
    | null
    | { type: 'main'; url: string; title: string }
    | { type: 'additional'; index: number; url: string; title: string }
    | { type: 'variation'; index: number; slot: 'main' | number; url: string; title: string }
  >(null);

  const [hasVariations, setHasVariations] = useState(false);
  const [modalTab, setModalTab] = useState<'basico' | 'fotos' | 'modelos' | 'promocoes' | 'personalizacao'>('basico');
  const [variations, setVariations] = useState<Array<{ name: string; image: string; additionalImages: string[]; description: string; price: string }>>([]);
  const [variationsNote, setVariationsNote] = useState('');

  const [originalPrice, setOriginalPrice] = useState('');
  const [quantityDiscounts, setQuantityDiscounts] = useState<Array<{ minQuantity: string; price: string }>>([]);

  const handleAddQuantityDiscount = () => {
    setQuantityDiscounts((prev) => [...prev, { minQuantity: '', price: '' }]);
  };

  const handleRemoveQuantityDiscount = (index: number) => {
    setQuantityDiscounts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuantityDiscount = (index: number, field: 'minQuantity' | 'price', value: string) => {
    setQuantityDiscounts((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleApplyBolinhasNatalExample = () => {
    setPrice('9.90');
    setQuantityDiscounts([
      { minQuantity: '4', price: '9.50' },
      { minQuantity: '10', price: '8.50' },
    ]);
  };

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

  useEffect(() => {
    async function checkAuthAndLoad() {
      try {
        const authRes = await fetch('/api/admin/check');
        const authData = await authRes.json();
        if (!authData.authenticated) {
          router.replace('/admin/login');
          return;
        }
        setIsAuthenticatedUser(true);

        const [prodResult, ordersResult, customersResult, statusResult] = await Promise.allSettled([
          fetch('/api/products').then((r) => r.json()),
          fetch('/api/orders').then((r) => r.json()),
          fetch('/api/admin/customers').then((r) => r.json()),
          fetch('/api/store-status').then((r) => r.json()),
        ]);

        if (prodResult.status === 'fulfilled' && prodResult.value?.success) {
          setProducts(prodResult.value.products || []);
          setCategories(prodResult.value.categories || []);
        }
        if (ordersResult.status === 'fulfilled' && ordersResult.value?.orders) {
          setOrdersCount(ordersResult.value.orders.length);
        }
        if (customersResult.status === 'fulfilled' && Array.isArray(customersResult.value?.customers)) {
          setCustomersCount(customersResult.value.customers.length);
        }
        if (statusResult.status === 'fulfilled' && typeof statusResult.value?.isOnline === 'boolean') {
          setIsStoreOnline(statusResult.value.isOnline);
        }
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
    setIsBestSeller(false);
    setOriginalPrice('');
    setQuantityDiscounts([]);
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
    setIsBestSeller(Boolean(product.isBestSeller));
    setOriginalPrice(product.originalPrice !== undefined && product.originalPrice > 0 ? String(product.originalPrice) : '');
    if (product.quantityDiscounts && product.quantityDiscounts.length > 0) {
      setQuantityDiscounts(
        product.quantityDiscounts.map((d) => ({
          minQuantity: String(d.minQuantity),
          price: String(d.price),
        }))
      );
    } else {
      setQuantityDiscounts([]);
    }

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
    setNewVariationUrls({});

    setModalTab('basico');
    if (product.variations && product.variations.length > 0) {
      setHasVariations(true);
      setVariations(
        product.variations.map((v) => {
          const primaryVarImg = v.images?.[0] || v.image || '';
          const extraVarImgs = (v.images || []).filter((img, imgIdx) => {
            if (imgIdx === 0 && img === primaryVarImg) return false;
            return Boolean(img && img.trim()) && img !== primaryVarImg;
          });
          return {
            name: v.name,
            image: primaryVarImg,
            additionalImages: extraVarImgs,
            description: v.description || '',
            price: v.price !== undefined && v.price > 0 ? String(v.price) : '',
          };
        })
      );
    } else {
      setHasVariations(false);
      setVariations([]);
    }

    setVariationsNote(product.variationsNote || product.customizationSettings?.variationsNote || '');
    const cs = product.customizationSettings;
    setAllowChildName(cs?.allowChildName ?? true);
    setChildNameRequired(cs?.childNameRequired ?? true);
    setChildNameLabel(cs?.childNameLabel || 'Nome na Lembrancinha');
    setChildNamePlaceholder(cs?.childNamePlaceholder || '');
    setNotesPlaceholder(cs?.notesPlaceholder || '');
    const hasRibbonColors = cs?.allowRibbonColors ?? (product.availableRibbonColors && product.availableRibbonColors.length > 0 ? true : false);
    setAllowRibbonColors(hasRibbonColors);
    setRibbonColorRequired(Boolean(cs?.ribbonColorRequired));
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

  const handleToggleBestSeller = async (productId: string) => {
    const previousProducts = products;
    const current = products.find((p) => p.id === productId);
    const willBeBestSeller = !current?.isBestSeller;
    const targetId = willBeBestSeller ? productId : null;

    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        isBestSeller: p.id === targetId,
      }))
    );

    try {
      const res = await fetch('/api/admin/products/bestseller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: targetId }),
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setProducts(previousProducts);
        alert(data.error || 'Erro ao atualizar produto mais vendido.');
      }
    } catch (err) {
      console.error('Erro ao alternar produto mais vendido:', err);
      setProducts(previousProducts);
      alert('Falha de conexão ao atualizar produto mais vendido.');
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'main' | { index: number; slot: 'main' }
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
          setVariations((prev) =>
            prev.map((v, i) => (i === target.index ? { ...v, image: data.url } : v))
          );
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

  const handleVariationAdditionalImagesUpload = async (
    variationIndex: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
          setVariations((prev) =>
            prev.map((v, idx) =>
              idx === variationIndex
                ? { ...v, additionalImages: [...v.additionalImages, data.url] }
                : v
            )
          );
        }
      }
    } catch {
      alert('Erro ao enviar fotos adicionais do modelo.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddVariationAdditionalUrl = (variationIndex: number) => {
    const url = (newVariationUrls[variationIndex] || '').trim();
    if (!url) return;
    setVariations((prev) =>
      prev.map((v, idx) =>
        idx === variationIndex
          ? { ...v, additionalImages: [...v.additionalImages, url] }
          : v
      )
    );
    setNewVariationUrls((prev) => ({ ...prev, [variationIndex]: '' }));
  };

  const handleRemoveVariationAdditionalImage = (variationIndex: number, imgIndex: number) => {
    setVariations((prev) =>
      prev.map((v, idx) =>
        idx === variationIndex
          ? { ...v, additionalImages: v.additionalImages.filter((_, i) => i !== imgIndex) }
          : v
      )
    );
  };

  const handlePromoteVariationImageToMain = (variationIndex: number, imgIndex: number) => {
    setVariations((prev) =>
      prev.map((v, idx) => {
        if (idx !== variationIndex) return v;
        const promoted = v.additionalImages[imgIndex];
        if (!promoted) return v;
        const oldMain = v.image;
        const nextAdditional = v.additionalImages.filter((_, i) => i !== imgIndex);
        if (oldMain && oldMain !== promoted) {
          nextAdditional.unshift(oldMain);
        }
        return { ...v, image: promoted, additionalImages: nextAdditional };
      })
    );
  };

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

  const handleDownloadImage = async (url: string, filename?: string) => {
    if (!url || !url.trim()) return;
    try {
      const cleanUrl = url.trim();
      let res: Response;
      try {
        res = await fetch(cleanUrl);
        if (!res.ok) throw new Error('Falha direta');
      } catch {
        res = await fetch(`/api/admin/proxy-image?url=${encodeURIComponent(cleanUrl)}`);
      }
      if (!res.ok) throw new Error('Falha ao obter imagem');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const cleanName = filename || cleanUrl.split('/').pop()?.split('?')[0] || `foto-${Date.now()}.jpg`;
      a.download = cleanName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
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
      { name: `Modelo ${prev.length + 1}`, image: '', additionalImages: [], description: '', price: '' },
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
            (v.additionalImages || []).forEach((img) => {
              const trimmed = img.trim();
              if (trimmed && !vImages.includes(trimmed)) {
                vImages.push(trimmed);
              }
            });
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

      const parsedOriginalPrice = originalPrice && !isNaN(parseFloat(originalPrice.replace(',', '.')))
        ? parseFloat(originalPrice.replace(',', '.'))
        : undefined;

      const formattedDiscounts: QuantityDiscount[] = quantityDiscounts
        .map((d) => ({
          minQuantity: parseInt(d.minQuantity, 10),
          price: parseFloat(d.price.replace(',', '.')),
        }))
        .filter((d) => !isNaN(d.minQuantity) && d.minQuantity > 1 && !isNaN(d.price) && d.price > 0)
        .sort((a, b) => a.minQuantity - b.minQuantity);

      const savedProductData: Product = {
        ...existingProduct,
        id: slugId,
        name: name.trim(),
        category: finalCategory,
        description: description.trim(),
        price: parsedPrice,
        originalPrice: parsedOriginalPrice,
        quantityDiscounts: formattedDiscounts.length > 0 ? formattedDiscounts : undefined,
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
          childNameRequired,
          childNameLabel: childNameLabel.trim() || 'Nome na Lembrancinha',
          childNamePlaceholder: childNamePlaceholder.trim() || undefined,
          notesPlaceholder: notesPlaceholder.trim() || undefined,
          variationsNote: variationsNote.trim() || undefined,
          allowRibbonColors,
          ribbonColorRequired,
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
        isBestSeller: Boolean(isBestSeller),
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
        if (isBestSeller) {
          setProducts((prev) => {
            const exists = prev.some((p) => p.id === data.product.id);
            const updated = prev.map((p) => {
              if (p.id === data.product.id) return data.product;
              return p.isBestSeller ? { ...p, isBestSeller: false } : p;
            });
            return exists ? updated : [...updated, data.product];
          });
        } else if (editingProductId) {
          setProducts((prev) => prev.map((p) => (p.id === editingProductId ? data.product : p)));
        } else {
          setProducts((prev) => [...prev, data.product]);
        }
        handleCloseModal();
        setName('');
        setDescription('');
        setMainImage('');
        setAdditionalImages([]);
        setNewAdditionalUrl('');
        setOriginalPrice('');
        setQuantityDiscounts([]);
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

  const baseAnalytics = getAnalyticsForPeriod(products, period);
  const analytics = realStats ? {
    ...baseAnalytics,
    totalRevenue: Number(realStats.totalRevenue) || 0,
    unitsSold: Number(realStats.unitsSold) || 0,
    visits: Number(realStats.visits) || 0,
    ordersCount: Number(realStats.ordersCount) || 0,
    growthRevenue: realStats.growthRevenue ?? null,
    growthUnits: realStats.growthUnits ?? null,
    growthVisits: realStats.growthVisits ?? null,
    topSellingProducts: Array.isArray(realStats.topSellingProducts)
      ? realStats.topSellingProducts.map((tp: TopProductStat) => {
          const matched = products.find((p) => p.id === tp.id);
          return {
            ...tp,
            name: matched?.name || tp.name,
            category: matched?.category || tp.category,
            image: matched?.image || tp.image || '/images/placeholder.jpg',
            price: matched?.price ?? tp.price,
          };
        })
      : [],
    mostClickedProduct: realStats.mostClicked ? (() => {
      const clicks = Number(realStats.mostClicked.clicks) || 0;
      const soldUnits = Number(realStats.mostClicked.unitsSold) || 0;
      const conversionPct = clicks > 0 ? ((soldUnits / clicks) * 100).toFixed(1) : '0.0';
      return {
        product: products.find((p) => p.id === realStats.mostClicked.productId) || {
          id: realStats.mostClicked.productId,
          name: realStats.mostClicked.name || 'Produto',
          price: 0,
          image: '/images/placeholder.jpg',
          category: 'geral',
          description: '',
          unit: 'unidade',
          leadTimeDays: 5,
          minQuantity: 1,
        },
        clicks,
        interestRate: `${conversionPct}% de conversão`,
        estimatedOrders: soldUnits,
      };
    })() : null,
  } : baseAnalytics;

  const activeCategories = categories.filter((c) => c.id !== 'todos');

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === 'todos' || p.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  if (loading || !isAuthenticatedUser) {
    return (
      <div className={styles.adminWrapper} style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#8C7A6B', fontSize: '0.875rem' }}>Verificando credenciais...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminWrapper}>
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
            onClick={() => setMainTab('clientes')}
            className={`${styles.sidebarNavItem} ${mainTab === 'clientes' ? styles.sidebarNavItemActive : ''}`}
          >
            <Users size={18} />
            <span>Fichas de Clientes</span>
            {customersCount > 0 && <span className={styles.counterPill}>{customersCount}</span>}
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

      <div className={styles.mainContainer}>
        <header className={styles.topBar}>
          <div className={styles.brandGroup}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className={styles.mobileHamburgerBtn}
              aria-label="Abrir menu de navegação"
            >
              <Menu size={22} />
            </button>

            <Link href="/" className={styles.mobileHeaderBrand}>
              <span className={styles.mobileBrandScript}>Wê</span>
              <span className={styles.mobileBrandSerif}>Lembrancinhas</span>
            </Link>

            <div className={styles.desktopTabTitle}>
              <h2 className={styles.topBarHeading}>
                {mainTab === 'pedidos' ? 'Fila de Produção & Pedidos' : mainTab === 'clientes' ? 'Fichas de Clientes & Fidelidade' : mainTab === 'produtos' ? 'Gerenciamento de Produtos' : mainTab === 'ajustes' ? 'Ajustes & Configurações da Loja' : mainTab === 'cupons' ? 'Cupons de Desconto & Promoções' : mainTab === 'dashboard' ? 'Dashboard & Métricas' : 'Calculadora de Custos & Preço Sugerido'}
              </h2>
            </div>
          </div>

          <div className={styles.topActions}>
            <Link href="/" target="_blank" className={styles.storeLink} title="Ver Loja Virtual">
              <ExternalLink size={15} />
              <span className={styles.actionBtnLabel}>Ver Loja</span>
            </Link>
            <button onClick={handleLogout} className={styles.logoutBtn} title="Encerrar sessão">
              <LogOut size={15} />
              <span className={styles.actionBtnLabel}>Sair</span>
            </button>
          </div>
        </header>

        <nav className={styles.mobileSubTabBar}>
          <button
            type="button"
            onClick={() => setMainTab('pedidos')}
            className={`${styles.mobileSubTabPill} ${mainTab === 'pedidos' ? styles.mobileSubTabPillActive : ''}`}
          >
            <ClipboardList size={15} />
            <span>Pedidos</span>
            {ordersCount > 0 && <span className={styles.mobilePillBadge}>{ordersCount}</span>}
          </button>

          <button
            type="button"
            onClick={() => setMainTab('clientes')}
            className={`${styles.mobileSubTabPill} ${mainTab === 'clientes' ? styles.mobileSubTabPillActive : ''}`}
          >
            <Users size={15} />
            <span>Clientes</span>
            {customersCount > 0 && <span className={styles.mobilePillBadge}>{customersCount}</span>}
          </button>

          <button
            type="button"
            onClick={() => setMainTab('produtos')}
            className={`${styles.mobileSubTabPill} ${mainTab === 'produtos' ? styles.mobileSubTabPillActive : ''}`}
          >
            <Package size={15} />
            <span>Produtos</span>
            <span className={styles.mobilePillBadge}>{products.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('ajustes')}
            className={`${styles.mobileSubTabPill} ${mainTab === 'ajustes' ? styles.mobileSubTabPillActive : ''}`}
          >
            <Sliders size={15} />
            <span>Ajustes</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('cupons')}
            className={`${styles.mobileSubTabPill} ${mainTab === 'cupons' ? styles.mobileSubTabPillActive : ''}`}
          >
            <Ticket size={15} />
            <span>Cupons</span>
            {couponsCount > 0 && <span className={styles.mobilePillBadge}>{couponsCount}</span>}
          </button>

          <button
            type="button"
            onClick={() => setMainTab('dashboard')}
            className={`${styles.mobileSubTabPill} ${mainTab === 'dashboard' ? styles.mobileSubTabPillActive : ''}`}
          >
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('calculadora')}
            className={`${styles.mobileSubTabPill} ${mainTab === 'calculadora' ? styles.mobileSubTabPillActive : ''}`}
          >
            <Calculator size={15} />
            <span>Calculadora</span>
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className={styles.mobileDrawerOverlay} onClick={() => setMobileMenuOpen(false)}>
            <aside
              className={styles.mobileDrawerContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.mobileDrawerHeader}>
                <div className={styles.sidebarBrand} style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
                  <Link href="/" className={styles.sidebarLogoLockup} onClick={() => setMobileMenuOpen(false)}>
                    <span className={styles.sidebarLogoScript}>Wê</span>
                    <span className={styles.sidebarLogoSerif}>Lembrancinhas</span>
                  </Link>
                  <span className={styles.adminTag}>Painel Administrativo</span>
                </div>
                <button
                  type="button"
                  className={styles.mobileDrawerCloseBtn}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Fechar menu"
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.mobileDrawerBody}>
                <div className={styles.sidebarSectionLabel}>Menu Principal</div>
                <nav className={styles.sidebarNav}>
                  <button
                    type="button"
                    onClick={() => { setMainTab('pedidos'); setMobileMenuOpen(false); }}
                    className={`${styles.sidebarNavItem} ${mainTab === 'pedidos' ? styles.sidebarNavItemActive : ''}`}
                  >
                    <ClipboardList size={18} />
                    <span>Pedidos & Produção</span>
                    {ordersCount > 0 && <span className={styles.counterPill}>{ordersCount}</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMainTab('clientes'); setMobileMenuOpen(false); }}
                    className={`${styles.sidebarNavItem} ${mainTab === 'clientes' ? styles.sidebarNavItemActive : ''}`}
                  >
                    <Users size={18} />
                    <span>Fichas de Clientes</span>
                    {customersCount > 0 && <span className={styles.counterPill}>{customersCount}</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMainTab('produtos'); setMobileMenuOpen(false); }}
                    className={`${styles.sidebarNavItem} ${mainTab === 'produtos' ? styles.sidebarNavItemActive : ''}`}
                  >
                    <Package size={18} />
                    <span>Gerenciamento de Produtos</span>
                    <span className={styles.counterPill}>{products.length}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMainTab('ajustes'); setMobileMenuOpen(false); }}
                    className={`${styles.sidebarNavItem} ${mainTab === 'ajustes' ? styles.sidebarNavItemActive : ''}`}
                  >
                    <Sliders size={18} />
                    <span>Ajustes da Loja</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMainTab('cupons'); setMobileMenuOpen(false); }}
                    className={`${styles.sidebarNavItem} ${mainTab === 'cupons' ? styles.sidebarNavItemActive : ''}`}
                  >
                    <Ticket size={18} />
                    <span>Cupons de Desconto</span>
                    {couponsCount > 0 && <span className={styles.counterPill}>{couponsCount}</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMainTab('dashboard'); setMobileMenuOpen(false); }}
                    className={`${styles.sidebarNavItem} ${mainTab === 'dashboard' ? styles.sidebarNavItemActive : ''}`}
                  >
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMainTab('calculadora'); setMobileMenuOpen(false); }}
                    className={`${styles.sidebarNavItem} ${mainTab === 'calculadora' ? styles.sidebarNavItemActive : ''}`}
                  >
                    <Calculator size={18} />
                    <span>Calculadora de Preços</span>
                  </button>
                </nav>

                <div className={styles.mobileDrawerFooter}>
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

                  <Link href="/" target="_blank" className={styles.sidebarLink} onClick={() => setMobileMenuOpen(false)}>
                    <ExternalLink size={14} />
                    <span>Ver Loja Virtual</span>
                  </Link>

                  <button onClick={handleLogout} className={styles.sidebarLogoutBtn} title="Encerrar sessão">
                    <LogOut size={14} />
                    <span>Sair do Painel</span>
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        <main className={styles.mainContent}>
          {mainTab === 'pedidos' && (
            <OrdersProductionTab
              onOrderCountChange={setOrdersCount}
              onNavigateToCustomers={() => setMainTab('clientes')}
            />
          )}

          {mainTab === 'produtos' && (
            <section className={styles.productsSection}>
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

        <div className={styles.tableCard}>
          <table className={styles.productsTable}>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Prazo</th>
                <th style={{ textAlign: 'center' }}>Mais Vendido</th>
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
                          <div className={styles.productNameCell}>
                            {p.name}
                            {p.isBestSeller && (
                              <span className={styles.bestSellerTableBadge}>
                                <Flame size={11} /> 1º Mais Vendido
                              </span>
                            )}
                          </div>
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
                      {p.quantityDiscounts && p.quantityDiscounts.length > 0 && (
                        <div style={{ marginTop: '0.2rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            backgroundColor: '#ECFDF5',
                            color: '#065F46',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid #A7F3D0',
                          }} title={p.quantityDiscounts.map(d => `${d.minQuantity}+ un: R$ ${d.price}`).join(' | ')}>
                            <Tag size={10} /> Atacado ({p.quantityDiscounts.length})
                          </span>
                        </div>
                      )}
                    </td>
                    <td>{p.leadTimeDays} dias úteis</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleBestSeller(p.id)}
                        className={p.isBestSeller ? styles.bestSellerBtnActive : styles.bestSellerBtnInactive}
                        title={p.isBestSeller ? 'Clique para desmarcar como Mais Vendido' : 'Clique para colocar como 1º produto da loja'}
                      >
                        <Flame size={13} />
                        <span>{p.isBestSeller ? '1º da Loja' : 'Definir 1º'}</span>
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actionsCell} style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => handleDownloadImage(p.image, `${p.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-capa.jpg`)}
                          className={styles.downloadBtn}
                          title="Baixar foto de capa deste produto"
                        >
                          <Download size={14} />
                        </button>
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
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#8C7A6B' }}>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Nenhum produto encontrado</p>
                    <p style={{ fontSize: '0.75rem' }}>Tente alterar a busca ou filtro de categoria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.mobileProductsList}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => (
              <div key={`mob-${p.id}`} className={styles.mobileProductCard}>
                <div className={styles.mobileProductCardTop}>
                  <img src={p.image} alt={p.name} className={styles.mobileProductThumb} />
                  <div className={styles.mobileProductInfo}>
                    <div className={styles.mobileProductNameRow}>
                      <span className={styles.mobileProductName}>{p.name}</span>
                    </div>

                    <div className={styles.mobileBadgesRow}>
                      <span className={styles.categoryBadge}>{p.category}</span>
                      {p.isBestSeller && (
                        <span className={styles.bestSellerTableBadge}>
                          <Flame size={11} /> 1º Mais Vendido
                        </span>
                      )}
                      {p.quantityDiscounts && p.quantityDiscounts.length > 0 && (
                        <span className={styles.mobileAtacadoBadge} title={p.quantityDiscounts.map(d => `${d.minQuantity}+ un: R$ ${d.price}`).join(' | ')}>
                          <Tag size={10} /> Atacado ({p.quantityDiscounts.length})
                        </span>
                      )}
                    </div>

                    <div className={styles.mobilePriceRow}>
                      <span className={styles.mobilePrice}>
                        {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className={styles.mobileLeadTime}>
                        <Clock size={12} /> {p.leadTimeDays} dias úteis
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.mobileProductActionsRow}>
                  <button
                    type="button"
                    onClick={() => handleToggleBestSeller(p.id)}
                    className={p.isBestSeller ? styles.mobileActionBtnActive : styles.mobileActionBtn}
                    title={p.isBestSeller ? 'Clique para desmarcar como 1º' : 'Clique para destacar como 1º'}
                  >
                    <Flame size={15} />
                    <span>{p.isBestSeller ? '1º da Loja' : 'Destacar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadImage(p.image, `${p.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-capa.jpg`)}
                    className={styles.mobileActionBtn}
                    title="Baixar foto de capa"
                  >
                    <Download size={15} />
                    <span>Baixar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditProduct(p)}
                    className={styles.mobileActionBtnPrimary}
                    title="Editar produto"
                  >
                    <Pencil size={15} />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(p.id, p.name)}
                    className={styles.mobileActionBtnDanger}
                    title="Excluir produto"
                  >
                    <Trash2 size={15} />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.mobileEmptyState}>
              <Package size={36} color="#8C7A6B" />
              <p style={{ fontWeight: 600, color: '#2D231E', margin: '0.5rem 0 0.25rem' }}>Nenhum produto encontrado</p>
              <p style={{ fontSize: '0.8125rem', color: '#8C7A6B', margin: 0 }}>Tente alterar a busca ou filtro de categoria.</p>
            </div>
          )}
        </div>
            </section>
          )}

          {mainTab === 'ajustes' && (
            <StoreSettingsTab />
          )}

          {mainTab === 'cupons' && (
            <CouponsTab onCouponsCountChange={setCouponsCount} />
          )}

          {mainTab === 'dashboard' && (
            <section className={styles.dashboardSection}>
          <div className={styles.periodHeaderRow}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h2 className={styles.dashboardHeading}>Dashboard de Desempenho & Vendas</h2>
              </div>
              <p className={styles.dashboardSubheading}>
                Acompanhe o faturamento, lembrancinhas vendidas, visitas e os produtos campeões de cliques.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fetchStats(true)}
                className={styles.periodBtn}
                title={lastUpdated ? `Última atualização às ${lastUpdated}` : 'Atualizar dados agora'}
                style={{ gap: '0.375rem' }}
              >
                <RefreshCw size={13} className={isRefreshingStats ? 'animate-spin' : ''} />
                <span>Ao vivo{lastUpdated ? ` • ${lastUpdated}` : ''}</span>
              </button>

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
          </div>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiContent}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className={styles.kpiLabel}>Valor Total de Ganhos</span>
                  {analytics.growthRevenue && (
                    <span className={styles.trendBadge} title="Crescimento vs período anterior">
                      <ArrowUpRight size={11} /> {analytics.growthRevenue}
                    </span>
                  )}
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

            <div className={styles.kpiCard}>
              <div className={styles.kpiContent}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className={styles.kpiLabel}>Lembrancinhas Vendidas</span>
                  {analytics.growthUnits && (
                    <span className={styles.trendBadge} title="Crescimento vs período anterior">
                      <ArrowUpRight size={11} /> {analytics.growthUnits}
                    </span>
                  )}
                </div>
                <span className={styles.kpiValue}>{analytics.unitsSold} un.</span>
                <span className={styles.kpiSubtext}>Itens vendidos {analytics.periodUnitLabel}</span>
              </div>
              <div className={styles.kpiIconWrapper}>
                <Gift size={22} />
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiContent}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className={styles.kpiLabel}>Visitas no Site</span>
                  {analytics.growthVisits && (
                    <span className={styles.trendBadge} title="Crescimento vs período anterior">
                      <ArrowUpRight size={11} /> {analytics.growthVisits}
                    </span>
                  )}
                </div>
                <span className={styles.kpiValue}>{analytics.visits.toLocaleString('pt-BR')}</span>
                <span className={styles.kpiSubtext}>Acessos {analytics.periodUnitLabel}</span>
              </div>
              <div className={styles.kpiIconWrapper} style={{ color: '#0288D1', backgroundColor: '#E1F5FE' }}>
                <Eye size={22} />
              </div>
            </div>

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

          <div className={styles.analyticsGrid}>
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
                {analytics.topSellingProducts.length > 0 ? (
                  analytics.topSellingProducts.map((p: TopProductStat, idx: number) => (
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
                  ))
                ) : (
                  <p style={{ fontSize: '0.8125rem', color: '#8C7A6B', padding: '1rem 0', textAlign: 'center' }}>
                    Nenhuma venda registrada neste período ainda. Quando um cliente finalizar um pedido, o ranking aparecerá aqui ao vivo.
                  </p>
                )}
              </div>
            </div>

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
                      <span className={styles.clickStatNumber}>{analytics.mostClickedProduct.estimatedOrders}</span>
                      <span className={styles.clickStatLabel}>Vendidas</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.8125rem', color: '#8C7A6B', padding: '1rem 0', textAlign: 'center' }}>
                  Nenhum clique registrado neste período ainda.
                </p>
              )}

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

          {mainTab === 'calculadora' && (
            <CostCalculatorTab onApplyPrice={(suggested) => {
              setPrice(suggested);
              setMainTab('produtos');
              setIsModalOpen(true);
            }} />
          )}

          {mainTab === 'clientes' && (
            <CustomersTab onCustomersCountChange={setCustomersCount} />
          )}
        </main>
      </div>

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

            <div className={styles.modalTabsBar}>
              <button
                type="button"
                onClick={() => {
                  setModalTab('basico');
                  document.getElementById('modal-sec-basico')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`${styles.modalTabBtn} ${modalTab === 'basico' ? styles.modalTabBtnActive : ''}`}
              >
                <Package size={14} />
                <span>Dados Principais</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalTab('promocoes');
                  document.getElementById('modal-sec-promocoes')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`${styles.modalTabBtn} ${modalTab === 'promocoes' ? styles.modalTabBtnActive : ''}`}
              >
                <Tag size={14} />
                <span>Promoções & Atacado {quantityDiscounts.length > 0 ? `(${quantityDiscounts.length})` : ''}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalTab('fotos');
                  document.getElementById('modal-sec-fotos')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`${styles.modalTabBtn} ${modalTab === 'fotos' ? styles.modalTabBtnActive : ''}`}
              >
                <Upload size={14} />
                <span>Fotos ({1 + additionalImages.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalTab('modelos');
                  document.getElementById('modal-sec-modelos')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`${styles.modalTabBtn} ${modalTab === 'modelos' ? styles.modalTabBtnActive : ''}`}
              >
                <Layers size={14} />
                <span>Modelos & Preços {hasVariations ? `(${variations.length})` : ''}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalTab('personalizacao');
                  document.getElementById('modal-sec-personalizacao')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`${styles.modalTabBtn} ${modalTab === 'personalizacao' ? styles.modalTabBtnActive : ''}`}
              >
                <AlertCircle size={14} />
                <span>Personalização</span>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className={styles.modalBody}>
              <div className={styles.sectionBox} id="modal-sec-basico">
                <h4 className={styles.sectionTitle}>
                  <Package size={16} /> Dados Principais
                </h4>

                <div className={styles.bestSellerToggleBox}>
                  <div className={styles.bestSellerToggleText}>
                    <div className={styles.bestSellerToggleHeader}>
                      <Flame size={16} color="#D97706" />
                      <span className={styles.bestSellerToggleTitle}>Destacar como Produto Mais Vendido</span>
                      {isBestSeller && (
                        <span className={styles.bestSellerBadgeActive}>1º da Loja</span>
                      )}
                    </div>
                    <p className={styles.bestSellerToggleDesc}>
                      Exibe o selo dourado <strong>Mais Vendido</strong> e posiciona este produto automaticamente como o <strong>primeiro produto</strong> a aparecer no catálogo da sua loja.
                    </p>
                  </div>
                  <label className={styles.bestSellerSwitch}>
                    <input
                      type="checkbox"
                      checked={isBestSeller}
                      onChange={(e) => setIsBestSeller(e.target.checked)}
                    />
                    <span className={styles.bestSellerSlider} />
                  </label>
                </div>

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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setModalTab('promocoes');
                            document.getElementById('modal-sec-promocoes')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          style={{
                            background: '#ECFDF5',
                            border: '1px solid #A7F3D0',
                            color: '#065F46',
                            fontSize: '0.71875rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '0.35rem',
                          }}
                          title="Configurar descontos por quantidade / atacado"
                        >
                          <Tag size={11} />
                          <span>Promoções {quantityDiscounts.length > 0 ? `(${quantityDiscounts.length})` : ''}</span>
                        </button>
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

              <div className={styles.sectionBox} id="modal-sec-promocoes">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 className={styles.sectionTitle} style={{ margin: 0 }}>
                    <Tag size={16} /> Promoções & Preço por Quantidade (Atacado)
                  </h4>
                  <button
                    type="button"
                    onClick={handleApplyBolinhasNatalExample}
                    style={{
                      background: 'none',
                      border: '1px dashed #C89B6D',
                      color: '#6D4C3D',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '0.45rem',
                      backgroundColor: '#FBF8F5',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                    title="Preenche automaticamente com o exemplo das Bolinhas de Natal"
                  >
                    <span>💡 Exemplo: Bolinha de Natal (4 por 9,50 | 10 por 8,50)</span>
                  </button>
                </div>

                <p style={{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: '1rem', lineHeight: 1.4 }}>
                  Defina descontos progressivos para compras em maior volume. Por exemplo: 1 unidade a <strong>R$ {price || '9,90'}</strong>, a partir de 4 unidades a <strong>R$ 9,50 cada</strong> e a partir de 10 unidades a <strong>R$ 8,50 cada</strong>. O site calcula e aplica o desconto automaticamente na hora da compra!
                </p>

                <div style={{ marginBottom: '1.2rem', padding: '0.85rem 1rem', backgroundColor: '#F9F6F0', borderRadius: '0.65rem', border: '1px solid #EFE4D8' }}>
                  <label className={styles.label} style={{ marginBottom: '0.3rem', display: 'block' }}>
                    Preço Original &quot;De / Por&quot; (Opcional - exibe preço riscado na loja)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>De R$</span>
                    <input
                      type="text"
                      placeholder="Ex: 12.90"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      className={styles.input}
                      style={{ maxWidth: '140px' }}
                    />
                    <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                      por <strong>R$ {price || '0,00'}</strong> ({unit})
                    </span>
                    {Boolean(originalPrice && parseFloat(originalPrice.replace(',', '.')) > (parseFloat(price.replace(',', '.')) || 0)) && (
                      <span style={{
                        backgroundColor: '#ECFDF5',
                        color: '#065F46',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        border: '1px solid #A7F3D0'
                      }}>
                        -{Math.round(((parseFloat(originalPrice.replace(',', '.')) - (parseFloat(price.replace(',', '.')) || 0)) / parseFloat(originalPrice.replace(',', '.'))) * 100)}% de desconto
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <label className={styles.label} style={{ margin: 0 }}>
                      Faixas de Preço por Quantidade ({quantityDiscounts.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleAddQuantityDiscount}
                      style={{
                        background: '#6D4C3D',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '0.45rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <Plus size={13} />
                      <span>Adicionar Faixa</span>
                    </button>
                  </div>

                  {quantityDiscounts.length === 0 ? (
                    <div style={{
                      padding: '1.4rem',
                      textAlign: 'center',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '0.65rem',
                      border: '1px dashed #D1C7BD',
                      color: '#8C7E72',
                      fontSize: '0.8125rem'
                    }}>
                      <Tag size={22} color="#C89B6D" style={{ margin: '0 auto 0.4rem auto', display: 'block' }} />
                      Nenhuma faixa de atacado configurada para este produto.
                      <div style={{ marginTop: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={handleAddQuantityDiscount}
                          style={{
                            color: '#6D4C3D',
                            background: 'none',
                            border: 'none',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          Clique aqui para criar a primeira faixa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {quantityDiscounts.map((tier, idx) => {
                        const parsedBasePrice = parseFloat(price.replace(',', '.')) || 0;
                        const parsedTierPrice = parseFloat(tier.price.replace(',', '.')) || 0;
                        const savings = parsedBasePrice > 0 && parsedTierPrice > 0 ? (parsedBasePrice - parsedTierPrice) : 0;
                        const savingsPct = parsedBasePrice > 0 && parsedTierPrice > 0 ? Math.round((savings / parsedBasePrice) * 100) : 0;

                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem 1rem',
                              backgroundColor: '#FFFFFF',
                              borderRadius: '0.65rem',
                              border: '1px solid #E5E7EB',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#4A3428', minWidth: '70px' }}>
                              Faixa {idx + 1}:
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>A partir de</span>
                              <input
                                type="number"
                                min={2}
                                placeholder="Ex: 4"
                                value={tier.minQuantity}
                                onChange={(e) => handleUpdateQuantityDiscount(idx, 'minQuantity', e.target.value)}
                                className={styles.input}
                                style={{ width: '75px' }}
                              />
                              <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>{unit}s:</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>R$</span>
                              <input
                                type="text"
                                placeholder="Ex: 9.50"
                                value={tier.price}
                                onChange={(e) => handleUpdateQuantityDiscount(idx, 'price', e.target.value)}
                                className={styles.input}
                                style={{ width: '95px' }}
                              />
                              <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>cada</span>
                            </div>

                            {savings > 0 && (
                              <span style={{
                                backgroundColor: '#ECFDF5',
                                color: '#047857',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                border: '1px solid #A7F3D0',
                              }}>
                                Economia de {savings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/un (-{savingsPct}%)
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveQuantityDiscount(idx)}
                              style={{
                                marginLeft: 'auto',
                                background: 'none',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                padding: '0.35rem',
                                borderRadius: '0.35rem',
                              }}
                              title="Remover esta faixa de desconto"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.sectionBox} id="modal-sec-fotos">
                <h4 className={styles.sectionTitle}>
                  <Upload size={16} /> Fotos da Publicação
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#7C6E64', margin: '0 0 0.75rem 0' }}>
                  Gerencie a foto de capa e as fotos secundárias do produto. Você pode adicionar ou remover qualquer foto a qualquer momento.
                </p>

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
                          <button
                            type="button"
                            onClick={() => handleDownloadImage(mainImage, `${name || 'produto'}-capa.jpg`)}
                            className={styles.downloadPhotoBtn}
                            title="Baixar foto da capa para o computador"
                          >
                            <Download size={13} />
                            <span>Baixar Foto</span>
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
                              onClick={() => handleDownloadImage(imgUrl, `${name || 'produto'}-foto-${idx + 2}.jpg`)}
                              className={styles.galleryDownloadBtn}
                              title="Baixar esta foto para o computador"
                            >
                              <Download size={11} /> Baixar
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

              <div className={styles.sectionBox} id="modal-sec-modelos">
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

                        <div style={{ marginTop: '0.5rem' }}>
                          <div className={styles.formField}>
                            <label className={styles.label}>1ª Foto do Modelo (Principal / Capa)</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <label className={styles.uploadBtn} style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}>
                                <Upload size={12} />
                                <span>Upload</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleImageUpload(e, { index: idx, slot: 'main' })}
                                />
                              </label>
                              <input
                                type="text"
                                placeholder="URL ou envie a foto principal do modelo"
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
                                      slot: 'main',
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
                                  onClick={() =>
                                    handleDownloadImage(
                                      v.image,
                                      `${name || 'produto'}-${(v.name || `modelo-${idx + 1}`).toLowerCase().replace(/[^a-z0-9]/g, '-')}-foto1.jpg`
                                    )
                                  }
                                  className={styles.modelDownloadPhotoBtn}
                                  title="Baixar 1ª foto para o computador"
                                >
                                  <Download size={11} /> Baixar Foto
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

                          <div className={styles.photoBlock} style={{ marginTop: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className={styles.photoBlockTitle}>
                                Fotos Adicionais do Modelo ({v.additionalImages.length})
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#9E9084' }}>
                                Aparecem na rolagem de fotos do modelo
                              </span>
                            </div>

                            {v.additionalImages.length > 0 ? (
                              <div className={styles.galleryGrid}>
                                {v.additionalImages.map((imgUrl, imgIdx) => (
                                  <div key={imgIdx} className={styles.galleryCard}>
                                    <div className={styles.galleryImgWrapper}>
                                      <img
                                        src={imgUrl}
                                        alt={`${v.name || `Modelo ${idx + 1}`} - Foto ${imgIdx + 2}`}
                                        className={styles.galleryImg}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveVariationAdditionalImage(idx, imgIdx)}
                                        className={styles.galleryRemoveBtn}
                                        title="Remover esta foto do modelo"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                    <div className={styles.galleryCardFooter}>
                                      <span className={styles.galleryPhotoIndex}>Foto #{imgIdx + 2}</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setCropTarget({
                                            type: 'variation',
                                            index: idx,
                                            slot: imgIdx,
                                            url: imgUrl,
                                            title: `Ajustar Foto #${imgIdx + 2} — ${v.name || `Modelo ${idx + 1}`}`,
                                          })
                                        }
                                        className={styles.galleryAdjustBtn}
                                        title="Cortar, girar e ajustar esta foto"
                                      >
                                        <Crop size={11} /> Ajustar / Cortar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDownloadImage(
                                            imgUrl,
                                            `${name || 'produto'}-${(v.name || `modelo-${idx + 1}`).toLowerCase().replace(/[^a-z0-9]/g, '-')}-foto-${imgIdx + 2}.jpg`
                                          )
                                        }
                                        className={styles.galleryDownloadBtn}
                                        title="Baixar esta foto para o computador"
                                      >
                                        <Download size={11} /> Baixar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handlePromoteVariationImageToMain(idx, imgIdx)}
                                        className={styles.promoteBtn}
                                        title="Definir esta foto como a 1ª foto do modelo"
                                      >
                                        Tornar Capa
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className={styles.emptyGalleryNote}>
                                Nenhuma foto adicional neste modelo. Você pode adicionar mais fotos abaixo:
                              </div>
                            )}

                            <div className={styles.addGalleryRow}>
                              <label className={styles.uploadBtn}>
                                <Upload size={14} />
                                <span>{uploadingImage ? 'Enviando...' : 'Adicionar Foto do Computador'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleVariationAdditionalImagesUpload(idx, e)}
                                />
                              </label>
                              <div className={styles.urlAddWrapper}>
                                <input
                                  type="text"
                                  placeholder="Ou cole a URL da foto..."
                                  value={newVariationUrls[idx] || ''}
                                  onChange={(e) =>
                                    setNewVariationUrls((prev) => ({ ...prev, [idx]: e.target.value }))
                                  }
                                  className={styles.input}
                                  style={{ flex: 1 }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddVariationAdditionalUrl(idx)}
                                  className={styles.addUrlBtn}
                                  disabled={!(newVariationUrls[idx] || '').trim()}
                                >
                                  <Plus size={14} /> Adicionar
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button type="button" onClick={handleAddVariation} className={styles.addModelBtn}>
                      <Plus size={14} /> Adicionar Outro Modelo
                    </button>

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

              <div className={styles.sectionBox} id="modal-sec-personalizacao">
                <h4 className={styles.sectionTitle}>
                  <AlertCircle size={16} /> Campos de Personalização do Cliente
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#7C6E64', margin: 0 }}>
                  Escolha exatamente quais perguntas o cliente deve responder ao encomendar este produto.
                </p>

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

                        {field.type !== 'select' ? (
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
              prev.map((v, i) => {
                if (i !== cropTarget.index) return v;
                if (cropTarget.slot === 'main') {
                  return { ...v, image: newUrl };
                }
                return {
                  ...v,
                  additionalImages: v.additionalImages.map((img, imgIdx) =>
                    imgIdx === cropTarget.slot ? newUrl : img
                  ),
                };
              })
            );
          }
          setCropTarget(null);
        }}
      />
    </div>
  );
}

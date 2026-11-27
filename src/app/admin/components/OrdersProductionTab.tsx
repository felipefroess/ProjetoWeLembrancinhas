'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  Sparkles,
  Package,
  CheckCheck,
  Eye,
  MessageCircle,
  Phone,
  Calendar,
  Printer,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Tag,
  Ticket,
  Clock,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Truck
} from 'lucide-react';
import { ProductionOrder, OrderStatus } from '@/types';
import styles from '../Admin.module.css';

interface OrdersProductionTabProps {
  onOrderCountChange?: (count: number) => void;
  onNavigateToCustomers?: () => void;
}

interface KanbanStageConfig {
  id: OrderStatus;
  label: string;
  subtitle: string;
  colClass: string;
  badgeBg: string;
  badgeColor: string;
  icon: React.ReactNode;
}

const STAGES: KanbanStageConfig[] = [
  {
    id: 'em_analise',
    label: 'Em análise',
    subtitle: 'Conferir dados e detalhes do pedido',
    colClass: styles.colAnalise,
    badgeBg: '#EDE9FE',
    badgeColor: '#5B21B6',
    icon: <ClipboardList size={16} />,
  },
  {
    id: 'em_producao',
    label: 'Em Produção',
    subtitle: 'Impressão, corte e montagem',
    colClass: styles.colProducao,
    badgeBg: '#FEF3C7',
    badgeColor: '#B45309',
    icon: <Sparkles size={16} />,
  },
  {
    id: 'pronto',
    label: 'Pronto p/ Envio / Retirada',
    subtitle: 'Embalado com carinho',
    colClass: styles.colPronto,
    badgeBg: '#D1FAE5',
    badgeColor: '#047857',
    icon: <Package size={16} />,
  },
  {
    id: 'entregue',
    label: 'Entregue',
    subtitle: 'Pedido concluído com sucesso',
    colClass: styles.colEntregue,
    badgeBg: '#E5E7EB',
    badgeColor: '#4B5563',
    icon: <CheckCheck size={16} />,
  },
];

const STAGE_ORDER: OrderStatus[] = [
  'em_analise',
  'em_producao',
  'pronto',
  'entregue',
];

function formatDeliveryLabel(method?: string): string {
  if (!method) return 'A combinar';
  if (method === 'retirada-pouso-alegre') return 'Retirada em Pouso Alegre';
  if (method === 'retirada-paraisopolis') return 'Retirada em Paraisópolis';
  if (method === 'entrega-correios') return 'Envio / Correios';
  return method;
}

function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return 'Não informada';
  try {
    if (dateStr.includes('-')) {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function formatWhatsAppUrl(rawPhone: string | undefined, message: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  const phone = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function parseDateKey(dateStr?: string): string | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  }
  return null;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDateFull(dateKey: string): string {
  try {
    const [y, m, d] = dateKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const weekday = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][dateObj.getDay()];
    const month = MONTH_NAMES[m - 1];
    return `${weekday}, ${d} de ${month} de ${y}`;
  } catch {
    return dateKey;
  }
}

function getDaysUntil(dateKey: string): { days: number; label: string; isUrgent: boolean; isPast: boolean } {
  try {
    const [y, m, d] = dateKey.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { days: diffDays, label: `Passou há ${Math.abs(diffDays)} dia(s)`, isUrgent: true, isPast: true };
    }
    if (diffDays === 0) {
      return { days: 0, label: 'Hoje!', isUrgent: true, isPast: false };
    }
    if (diffDays === 1) {
      return { days: 1, label: 'Amanhã!', isUrgent: true, isPast: false };
    }
    if (diffDays <= 3) {
      return { days: diffDays, label: `Faltam ${diffDays} dias`, isUrgent: true, isPast: false };
    }
    return { days: diffDays, label: `Em ${diffDays} dias`, isUrgent: false, isPast: false };
  } catch {
    return { days: 0, label: 'Data inválida', isUrgent: false, isPast: false };
  }
}

export default function OrdersProductionTab({ onOrderCountChange, onNavigateToCustomers }: OrdersProductionTabProps) {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'tabela' | 'calendario'>('kanban');
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [calendarSubView, setCalendarSubView] = useState<'grade' | 'agenda'>('grade');
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [calendarFilterStatus, setCalendarFilterStatus] = useState<'todos' | 'pendentes' | 'prontos' | 'entregues'>('todos');
  const [showWithoutDateSection, setShowWithoutDateSection] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | OrderStatus>('todos');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'neon' | 'local'>('neon');
  const [syncedCustomerToast, setSyncedCustomerToast] = useState<{
    text: string;
    customerName: string;
    orderShortId: string;
  } | null>(null);

  const handlePrevMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCalendarDate(today);
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDayDate(key);
  };

  // Notifica o componente pai sobre a contagem de pedidos de forma segura após o render
  useEffect(() => {
    onOrderCountChange?.(orders.length);
  }, [orders.length, onOrderCountChange]);

  const loadOrders = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch(`/api/orders?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.orders && Array.isArray(data.orders)) {
        setOrders(data.orders);
        if (data.source) setDataSource(data.source);
        if (selectedOrder) {
          const fresh = data.orders.find((o: ProductionOrder) => String(o.id) === String(selectedOrder.id));
          if (fresh) setSelectedOrder(fresh);
        }
      }

      try {
        const backupKey = 'we_backup_orders';
        const stored = typeof window !== 'undefined' ? localStorage.getItem(backupKey) : null;
        if (stored) {
          const backupList = JSON.parse(stored);
          if (Array.isArray(backupList) && backupList.length > 0) {
            const failedBackups: unknown[] = [];
            for (const backupOrder of backupList) {
              try {
                const syncRes = await fetch('/api/orders', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(backupOrder),
                });
                if (!syncRes.ok) {
                  failedBackups.push(backupOrder);
                }
              } catch {
                failedBackups.push(backupOrder);
              }
            }
            if (failedBackups.length === 0) {
              localStorage.removeItem(backupKey);
            } else {
              localStorage.setItem(backupKey, JSON.stringify(failedBackups));
            }
          } else {
            localStorage.removeItem(backupKey);
          }
        }
      } catch {
      }
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadOrders(true);
      }
    }, 10000);

    const handleFocus = () => loadOrders(true);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadOrders(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteOrder = async (orderId: string, customerName?: string) => {
    const shortCode = orderId.slice(-6).toUpperCase();
    const confirmed = window.confirm(
      `Deseja realmente remover o pedido #${shortCode}${customerName ? ` de ${customerName}` : ''}?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => String(o.id) !== String(orderId)));
        if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
          setSelectedOrder(null);
        }
      } else {
        alert(data.error || 'Erro ao remover pedido.');
      }
    } catch (err) {
      console.error('Erro ao deletar pedido:', err);
      alert('Erro ao se conectar ao servidor.');
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    setOrders((prev) =>
      prev.map((o) => (String(o.id) === String(orderId) ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Erro ao atualizar etapa do pedido.');
        loadOrders(true);
      } else if (newStatus === 'entregue' && data.customerSynced) {
        const shortId = orderId.slice(-6).toUpperCase();
        setSyncedCustomerToast({
          text: `Pedido #${shortId} finalizado com sucesso! Ficha de ${data.customerName || 'cliente'} atualizada e salva no histórico.`,
          customerName: data.customerName || '',
          orderShortId: shortId,
        });
      }
    } catch {
      alert('Falha ao comunicar com o servidor.');
      loadOrders(true);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNextStage = (order: ProductionOrder) => {
    const currentIndex = STAGE_ORDER.indexOf(order.status);
    if (currentIndex >= 0 && currentIndex < STAGE_ORDER.length - 1) {
      handleUpdateStatus(order.id, STAGE_ORDER[currentIndex + 1]);
    }
  };

  const handlePrevStage = (order: ProductionOrder) => {
    const currentIndex = STAGE_ORDER.indexOf(order.status);
    if (currentIndex > 0) {
      handleUpdateStatus(order.id, STAGE_ORDER[currentIndex - 1]);
    }
  };

  const handleWhatsAppReady = (order: ProductionOrder) => {
    const msg = `Olá ${order.customer_name}! Sua encomenda da Wê Lembrancinhas está pronta para envio/retirada!`;
    const url = formatWhatsAppUrl(order.customer_phone, msg);
    if (!url) {
      alert('Este pedido não possui telefone cadastrado.');
      return;
    }
    window.open(url, '_blank');
  };

  const handleWhatsAppContact = (order: ProductionOrder) => {
    const orderCode = order.id.slice(-6).toUpperCase();
    const msg = `Olá ${order.customer_name}! Tudo bem? É da Wê Lembrancinhas referente ao seu pedido #${orderCode}.`;
    const url = formatWhatsAppUrl(order.customer_phone, msg);
    if (!url) {
      alert('Este pedido não possui telefone cadastrado.');
      return;
    }
    window.open(url, '_blank');
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'todos' && order.status !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = order.customer_name?.toLowerCase().includes(q);
      const matchPhone = order.customer_phone?.toLowerCase().includes(q);
      const matchId = order.id?.toLowerCase().includes(q);
      const matchItems = order.items?.some((it: any) => {
        const prodName = it.product?.name?.toLowerCase() || '';
        const childName = it.customization?.childName?.toLowerCase() || '';
        const variation = it.customization?.variation?.toLowerCase() || '';
        return prodName.includes(q) || childName.includes(q) || variation.includes(q);
      });
      return matchName || matchPhone || matchId || matchItems;
    });
  }, [orders, statusFilter, searchQuery]);

  // Filtro específico para o calendário (caso queira ver só pendentes, prontos ou entregues)
  const calendarOrders = useMemo(() => {
    return filteredOrders.filter((o) => {
      if (calendarFilterStatus === 'pendentes') {
        return o.status === 'em_analise' || o.status === 'em_producao';
      }
      if (calendarFilterStatus === 'prontos') {
        return o.status === 'pronto';
      }
      if (calendarFilterStatus === 'entregues') {
        return o.status === 'entregue';
      }
      return true;
    });
  }, [filteredOrders, calendarFilterStatus]);

  const ordersByDate = useMemo(() => {
    const map: Record<string, ProductionOrder[]> = {};
    calendarOrders.forEach((o) => {
      const key = parseDateKey(o.event_date);
      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(o);
      }
    });
    return map;
  }, [calendarOrders]);

  const ordersWithoutDate = useMemo(() => {
    return calendarOrders.filter((o) => !parseDateKey(o.event_date));
  }, [calendarOrders]);

  const sortedDateKeys = useMemo(() => {
    return Object.keys(ordersByDate).sort((a, b) => a.localeCompare(b));
  }, [ordersByDate]);

  const calendarMetrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - dayOfWeek));

    let totalWithDate = 0;
    let thisWeekCount = 0;
    let thisWeekUnits = 0;
    let urgentCount = 0;

    filteredOrders.forEach((o) => {
      const key = parseDateKey(o.event_date);
      if (key) {
        totalWithDate++;
        const [y, m, d] = key.split('-').map(Number);
        const orderDate = new Date(y, m - 1, d);
        orderDate.setHours(0, 0, 0, 0);

        if (orderDate >= startOfWeek && orderDate <= endOfWeek) {
          thisWeekCount++;
          thisWeekUnits += o.total_units || 0;
        }

        const diffDays = Math.round((orderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 3 && o.status !== 'pronto' && o.status !== 'entregue') {
          urgentCount++;
        }
      }
    });

    return {
      totalWithDate,
      thisWeekCount,
      thisWeekUnits,
      urgentCount,
      withoutDateCount: filteredOrders.length - totalWithDate,
    };
  }, [filteredOrders]);

  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
  const totalCells = Math.ceil((startDayOfWeek + daysInCurrentMonth) / 7) * 7;

  const gridCells: Array<{ day: number; isCurrentMonth: boolean; dateKey: string }> = [];
  for (let i = 0; i < totalCells; i++) {
    if (i < startDayOfWeek) {
      const dayNum = daysInPrevMonth - (startDayOfWeek - 1 - i);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const key = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      gridCells.push({ day: dayNum, isCurrentMonth: false, dateKey: key });
    } else if (i < startDayOfWeek + daysInCurrentMonth) {
      const dayNum = i - startDayOfWeek + 1;
      const key = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      gridCells.push({ day: dayNum, isCurrentMonth: true, dateKey: key });
    } else {
      const dayNum = i - (startDayOfWeek + daysInCurrentMonth) + 1;
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const key = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      gridCells.push({ day: dayNum, isCurrentMonth: false, dateKey: key });
    }
  }

  const todayObj = new Date();
  const todayDateKey = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

  return (
    <section className={styles.ordersSection}>
      <div className={styles.ordersHeaderRow}>
        <div>
          <h2 className={styles.ordersHeading}>
            <ClipboardList size={26} color="#6D4C3D" />
            <span>Gestão de Pedidos & Fila de Produção</span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                background: dataSource === 'neon' ? '#DCFCE7' : '#FEF3C7',
                color: dataSource === 'neon' ? '#166534' : '#92400E',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginLeft: '0.5rem',
                verticalAlign: 'middle',
              }}
              title={dataSource === 'neon' ? 'Conectado e sincronizado com o PostgreSQL Neon' : 'Usando armazenamento local com redundância'}
            >
              <span/>
            </span>
          </h2>
          <p className={styles.ordersSubheading}>
            Acompanhe cada etapa de fabricação, consulte a personalização em 1 clique e notifique clientes pelo WhatsApp.
          </p>
        </div>

        <div className={styles.ordersHeaderActions}>
          <div className={styles.viewModeToggle}>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`${styles.viewModeBtn} ${viewMode === 'kanban' ? styles.viewModeBtnActive : ''}`}
              title="Quadro Kanban de Produção"
            >
              <LayoutGrid size={15} />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tabela')}
              className={`${styles.viewModeBtn} ${viewMode === 'tabela' ? styles.viewModeBtnActive : ''}`}
              title="Tabela de Pedidos"
            >
              <List size={15} />
              <span>Lista</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendario')}
              className={`${styles.viewModeBtn} ${viewMode === 'calendario' ? styles.viewModeBtnActive : ''}`}
              title="Calendário de Entregas & Datas de Eventos"
            >
              <Calendar size={15} />
              <span>Calendário</span>
              {calendarMetrics.urgentCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#FF4D4F',
                    color: '#ffffff',
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    marginLeft: '0.2rem',
                  }}
                  title={`${calendarMetrics.urgentCount} pedidos urgentes para os próximos 3 dias`}
                >
                  {calendarMetrics.urgentCount}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => loadOrders()}
            className={styles.refreshOrdersBtn}
            disabled={refreshing}
            title="Recarregar pedidos"
          >
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {syncedCustomerToast && (
        <div className={styles.customerSyncToast}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
            <CheckCheck size={18} color="#15803D" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#166534' }}>
              {syncedCustomerToast.text}
            </span>
          </div>
          {onNavigateToCustomers && (
            <button
              type="button"
              onClick={onNavigateToCustomers}
              className={styles.customerSyncToastAction}
            >
              Ver Ficha de Clientes →
            </button>
          )}
          <button
            type="button"
            onClick={() => setSyncedCustomerToast(null)}
            className={styles.customerSyncToastClose}
            aria-label="Fechar aviso"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className={styles.ordersControlsRow}>
        <div className={styles.ordersSearchBox}>
          <Search size={16} className={styles.ordersSearchIcon} />
          <input
            type="text"
            placeholder="Buscar por cliente, telefone, modelo ou código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.ordersSearchInput}
          />
        </div>

        <div className={styles.ordersFilterPills}>
          <button
            type="button"
            onClick={() => setStatusFilter('todos')}
            className={`${styles.filterPillBtn} ${statusFilter === 'todos' ? styles.filterPillBtnActive : ''}`}
          >
            <span>Todos</span>
            <span style={{ opacity: 0.85, fontSize: '0.75rem' }}>({orders.length})</span>
          </button>

          {STAGES.map((stg) => {
            const count = orders.filter((o) => o.status === stg.id).length;
            const isActive = statusFilter === stg.id;
            return (
              <button
                key={stg.id}
                type="button"
                onClick={() => setStatusFilter(stg.id)}
                className={`${styles.filterPillBtn} ${isActive ? styles.filterPillBtnActive : ''}`}
              >
                {stg.icon}
                <span>{stg.label}</span>
                <span style={{ opacity: 0.85, fontSize: '0.75rem' }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {viewMode === 'kanban' && (
        <div className={styles.kanbanBoard}>
          {STAGES.map((col) => {
            const colOrders = filteredOrders.filter((o) => o.status === col.id);

            return (
              <div key={col.id} className={`${styles.kanbanColumn} ${col.colClass}`}>
                <div className={styles.columnHeader}>
                  <div className={styles.columnTitleRow}>
                    <div className={styles.columnTitleWithIcon}>
                      {col.icon}
                      <span>{col.label}</span>
                    </div>
                    <span className={styles.columnBadge}>{colOrders.length}</span>
                  </div>
                  <p className={styles.columnSubtitle}>{col.subtitle}</p>
                </div>

                <div className={styles.columnCardsList}>
                  {colOrders.length === 0 ? (
                    <div className={styles.emptyColumnNotice}>Nenhum pedido nesta etapa</div>
                  ) : (
                    colOrders.map((order) => {
                      const firstItem = order.items && order.items[0];
                      const totalItemsCount = order.items ? order.items.length : 0;
                      const orderShortId = order.id.slice(-6).toUpperCase();

                      return (
                        <div key={order.id} className={styles.kanbanCard}>
                          <div className={styles.cardTopRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <span className={styles.orderIdBadge}>#{orderShortId}</span>
                              <span
                                className={`${styles.deliveryBadge} ${
                                  order.delivery_method === 'entrega-correios'
                                    ? styles.deliveryCorreios
                                    : styles.deliveryRetirada
                                }`}
                              >
                                {formatDeliveryLabel(order.delivery_method)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(order.id, order.customer_name)}
                              className={styles.deleteOrderBtn}
                              title="Remover / Cancelar Pedido"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className={styles.cardCustomerSection}>
                            <span className={styles.cardCustomerName}>{order.customer_name}</span>
                            {order.customer_phone && (
                              <a
                                href={`tel:${order.customer_phone}`}
                                className={styles.cardCustomerPhone}
                                title="Telefone do cliente"
                              >
                                <Phone size={12} />
                                <span>{order.customer_phone}</span>
                              </a>
                            )}
                          </div>

                          {order.event_date && (
                            <div className={styles.cardEventDateRow}>
                              <Calendar size={13} />
                              <span>Data: {formatDateDisplay(order.event_date)}</span>
                            </div>
                          )}

                          {firstItem && (
                            <div className={styles.cardCustomizationBox}>
                              <div className={styles.cardItemHeader}>
                                <img
                                  src={firstItem.product?.image || '/images/placeholder.jpg'}
                                  alt={firstItem.product?.name || 'Produto'}
                                  className={styles.cardItemThumb}
                                />
                                <span className={styles.cardItemName}>
                                  <strong>{firstItem.quantity || 1}x</strong> {firstItem.product?.name || 'Item'}
                                </span>
                              </div>

                              {totalItemsCount > 1 && (
                                <span className={styles.cardMoreItemsNote}>
                                  + {totalItemsCount - 1} outro(s) item(ns)
                                </span>
                              )}
                            </div>
                          )}

                          <div className={styles.cardFooter}>
                            <div className={styles.cardTotalRow}>
                              <span className={styles.cardTotalValue}>
                                R$ {Number(order.total_amount).toFixed(2).replace('.', ',')}
                              </span>
                              <span className={styles.cardUnitsCount}>
                                {order.total_units || 1} un.
                              </span>
                            </div>

                            {col.id === 'entregue' && (
                              <div className={styles.cardDeliveredSyncedBadge}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <CheckCheck size={13} color="#15803D" />
                                  <span>Salvo na Ficha de Clientes</span>
                                </div>
                                {onNavigateToCustomers && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onNavigateToCustomers();
                                    }}
                                    className={styles.cardDeliveredViewLink}
                                    title="Abrir a Ficha de Clientes"
                                  >
                                    Ver Ficha →
                                  </button>
                                )}
                              </div>
                            )}

                            {col.id === 'pronto' ? (
                              <button
                                type="button"
                                onClick={() => handleWhatsAppReady(order)}
                                className={styles.whatsappReadyBtn}
                                title="Avisar no WhatsApp que a encomenda está pronta para retirada/envio"
                              >
                                <MessageCircle size={15} />
                                <span>Avisar que está pronto</span>
                              </button>
                            ) : (
                              <div className={styles.cardActionsRow}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(order)}
                                  className={styles.detailsBtn}
                                >
                                  <Eye size={13} />
                                  <span>Ver Detalhes</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleWhatsAppContact(order)}
                                  className={styles.whatsappContactBtn}
                                  title="Falar no WhatsApp"
                                >
                                  <MessageCircle size={15} />
                                </button>
                              </div>
                            )}

                            {col.id === 'pronto' && (
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className={styles.detailsBtn}
                              >
                                <Eye size={13} />
                                <span>Ver Detalhes</span>
                              </button>
                            )}

                            <div className={styles.cardStageControls}>
                              <button
                                type="button"
                                onClick={() => handlePrevStage(order)}
                                disabled={order.status === STAGE_ORDER[0] || updatingId === order.id}
                                className={styles.stageMoveBtn}
                                title="Voltar para etapa anterior"
                              >
                                <ChevronLeft size={13} />
                                <span>Voltar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleNextStage(order)}
                                disabled={
                                  order.status === STAGE_ORDER[STAGE_ORDER.length - 1] ||
                                  updatingId === order.id
                                }
                                className={`${styles.stageMoveBtn} ${styles.stageMoveBtnNext}`}
                                title="Avançar para a próxima etapa"
                              >
                                <span>Avançar</span>
                                <ChevronRight size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'tabela' && (
        <div className={styles.ordersTableView}>
          <table className={styles.ordersTable}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente & Contato</th>
                <th>Data do Evento</th>
                <th>Entrega</th>
                <th>Itens Principais</th>
                <th>Total</th>
                <th>Etapa Atual</th>
                <th style={{ textAlign: 'right' }}>Ações Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#8C7A6B' }}>
                    Nenhum pedido encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const orderShortId = order.id.slice(-6).toUpperCase();
                  const firstItem = order.items && order.items[0];

                  return (
                    <tr key={order.id}>
                      <td>
                        <span className={styles.orderIdBadge}>#{orderShortId}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700 }}>{order.customer_name}</span>
                          <span style={{ fontSize: '0.75rem', color: '#8C7A6B' }}>
                            {order.customer_phone || 'Sem telefone'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem' }}>
                          {formatDateDisplay(order.event_date)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.deliveryBadge} ${
                            order.delivery_method === 'entrega-correios'
                              ? styles.deliveryCorreios
                              : styles.deliveryRetirada
                          }`}
                        >
                          {formatDeliveryLabel(order.delivery_method)}
                        </span>
                      </td>
                      <td>
                        {firstItem ? (
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8125rem' }}>
                            <span>
                              <strong>{firstItem.quantity || 1}x</strong> {firstItem.product?.name}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <strong style={{ color: '#2E7D32' }}>
                          R$ {Number(order.total_amount).toFixed(2).replace('.', ',')}
                        </strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                            className={styles.statusSelect}
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            {STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          {order.status === 'entregue' && (
                            <span className={styles.tableDeliveredPill} title="Pedido registrado na ficha de clientes">
                              <CheckCheck size={11} /> Salvo na Ficha
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className={styles.detailsBtn}
                            style={{ padding: '0.4rem 0.6rem' }}
                            title="Ver detalhes da personalização"
                          >
                            <Eye size={14} />
                            <span>Detalhes</span>
                          </button>
                          {order.status === 'pronto' ? (
                            <button
                              type="button"
                              onClick={() => handleWhatsAppReady(order)}
                              className={styles.whatsappReadyBtn}
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', width: 'auto' }}
                              title="Avisar que está pronto"
                            >
                              <MessageCircle size={14} />
                              <span>Avisar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleWhatsAppContact(order)}
                              className={styles.whatsappContactBtn}
                              style={{ width: '2rem', height: '2rem' }}
                              title="Falar no WhatsApp"
                            >
                              <MessageCircle size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id, order.customer_name)}
                            className={styles.deleteOrderBtn}
                            style={{ width: '2rem', height: '2rem' }}
                            title="Remover pedido"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Visualização: CALENDÁRIO DE ENTREGAS */}
      {viewMode === 'calendario' && (
        <div className={styles.deliveryCalendarContainer}>
          {/* Barra Superior de Controles e Navegação do Mês */}
          <div className={styles.calendarTopBar}>
            <div className={styles.calendarNavGroup}>
              <button
                type="button"
                onClick={handlePrevMonth}
                className={styles.calendarNavBtn}
                title="Mês anterior"
                aria-label="Mês anterior"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={handleToday}
                className={styles.calendarTodayBtn}
                title="Ir para o mês e dia atual"
              >
                Hoje
              </button>

              <div className={styles.calendarMonthTitle}>
                {MONTH_NAMES[currentMonth]} {currentYear}
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className={styles.calendarNavBtn}
                title="Próximo mês"
                aria-label="Próximo mês"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Alternador de Sub-visão (Grade Mensal vs Lista Agenda) */}
            <div className={styles.calendarViewSwitcher}>
              <button
                type="button"
                onClick={() => setCalendarSubView('grade')}
                className={`${styles.calendarSwitchBtn} ${calendarSubView === 'grade' ? styles.calendarSwitchBtnActive : ''}`}
              >
                <CalendarDays size={14} />
                <span>Grade Mensal</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarSubView('agenda')}
                className={`${styles.calendarSwitchBtn} ${calendarSubView === 'agenda' ? styles.calendarSwitchBtnActive : ''}`}
              >
                <List size={14} />
                <span>Lista / Agenda</span>
              </button>
            </div>
          </div>

          {/* Filtros Rápidos de Status no Calendário */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8C7A6B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Filtrar Entregas:
            </span>
            <button
              type="button"
              onClick={() => setCalendarFilterStatus('todos')}
              className={`${styles.filterPillBtn} ${calendarFilterStatus === 'todos' ? styles.filterPillBtnActive : ''}`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setCalendarFilterStatus('pendentes')}
              className={`${styles.filterPillBtn} ${calendarFilterStatus === 'pendentes' ? styles.filterPillBtnActive : ''}`}
            >
              Apenas Pendentes (Em Produção / Análise)
            </button>
            <button
              type="button"
              onClick={() => setCalendarFilterStatus('prontos')}
              className={`${styles.filterPillBtn} ${calendarFilterStatus === 'prontos' ? styles.filterPillBtnActive : ''}`}
            >
              Prontos
            </button>
            <button
              type="button"
              onClick={() => setCalendarFilterStatus('entregues')}
              className={`${styles.filterPillBtn} ${calendarFilterStatus === 'entregues' ? styles.filterPillBtnActive : ''}`}
            >
              Entregues
            </button>
          </div>

          {/* SUB-VISÃO 1: GRADE MENSAL */}
          {calendarSubView === 'grade' && (
            <div className={styles.calendarGridCard}>
              <div className={styles.calendarWeekdaysRow}>
                {WEEKDAY_NAMES.map((w) => (
                  <div key={w} className={styles.calendarWeekday}>
                    {w}
                  </div>
                ))}
              </div>

              <div className={styles.calendarDaysGrid}>
                {gridCells.map((cell) => {
                  const dayOrders = ordersByDate[cell.dateKey] || [];
                  const isToday = cell.dateKey === todayDateKey;
                  const isSelected = selectedDayDate === cell.dateKey;
                  const hasUrgent = dayOrders.some(
                    (o) => o.status !== 'pronto' && o.status !== 'entregue'
                  );

                  return (
                    <div
                      key={cell.dateKey}
                      onClick={() => {
                        if (dayOrders.length > 0) {
                          setSelectedDayDate(selectedDayDate === cell.dateKey ? null : cell.dateKey);
                        } else {
                          setSelectedDayDate(null);
                        }
                      }}
                      className={`${styles.calendarDayCell} ${
                        !cell.isCurrentMonth ? styles.calendarDayCellOtherMonth : ''
                      } ${isToday ? styles.calendarDayCellToday : ''} ${
                        isSelected ? styles.calendarDayCellSelected : ''
                      }`}
                      title={
                        dayOrders.length > 0
                          ? `${dayOrders.length} pedido(s) agendados para este dia. Clique para ver.`
                          : undefined
                      }
                    >
                      <div className={styles.calendarDayCellHeader}>
                        <span className={styles.calendarDayNumber}>{cell.day}</span>
                        {dayOrders.length > 0 && (
                          <span
                            className={styles.calendarDayBadgeCount}
                            style={{
                              backgroundColor: isToday ? '#6D4C3D' : hasUrgent ? '#FEF3C7' : '#DCFCE7',
                              color: isToday ? '#ffffff' : hasUrgent ? '#92400E' : '#166534',
                              borderColor: isToday ? '#6D4C3D' : hasUrgent ? '#FDE68A' : '#BBF7D0',
                            }}
                          >
                            {dayOrders.length} {dayOrders.length === 1 ? 'ped' : 'peds'}
                          </span>
                        )}
                      </div>

                      {/* Mini Chips de Pedidos dentro do dia */}
                      {dayOrders.length > 0 && (
                        <div className={styles.calendarDayOrdersList}>
                          {dayOrders.slice(0, 2).map((ord) => {
                            const chipClass =
                              ord.status === 'em_analise'
                                ? styles.calendarMiniChipAnalise
                                : ord.status === 'em_producao'
                                ? styles.calendarMiniChipProducao
                                : ord.status === 'pronto'
                                ? styles.calendarMiniChipPronto
                                : styles.calendarMiniChipEntregue;

                            return (
                              <div
                                key={ord.id}
                                className={`${styles.calendarMiniChip} ${chipClass}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(ord);
                                }}
                                title={`#${ord.id.slice(-6).toUpperCase()} • ${ord.customer_name} • ${ord.total_units} un • Clique para abrir detalhes`}
                              >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {ord.customer_name?.split(' ')[0]}
                                </span>
                                <span style={{ opacity: 0.85, fontSize: '0.625rem' }}>
                                  {ord.total_units} un
                                </span>
                              </div>
                            );
                          })}

                          {dayOrders.length > 2 && (
                            <span className={styles.calendarMiniChipMore}>
                              +{dayOrders.length - 2} mais
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PAINEL DE PEDIDOS DO DIA SELECIONADO NA GRADE */}
          {calendarSubView === 'grade' && selectedDayDate && ordersByDate[selectedDayDate] && (
            <div className={styles.calendarSelectedDayPanel}>
              <div className={styles.calendarSelectedDayHeader}>
                <h4 className={styles.calendarSelectedDayTitle}>
                  <Calendar size={20} color="#6D4C3D" />
                  <span>
                    Entregas de {formatDateFull(selectedDayDate)} ({ordersByDate[selectedDayDate].length}{' '}
                    {ordersByDate[selectedDayDate].length === 1 ? 'pedido' : 'pedidos'} •{' '}
                    {ordersByDate[selectedDayDate].reduce((acc, curr) => acc + (curr.total_units || 0), 0)} unidades)
                  </span>
                </h4>

                <button
                  type="button"
                  onClick={() => setSelectedDayDate(null)}
                  className={styles.closeBtn}
                  title="Fechar painel"
                >
                  <X size={16} />
                </button>
              </div>

              <div className={styles.calendarSelectedDayOrdersGrid}>
                {ordersByDate[selectedDayDate].map((order) => {
                  const firstItem = order.items?.[0];
                  const daysInfo = getDaysUntil(selectedDayDate);

                  return (
                    <div key={order.id} className={styles.calendarDeliveryCard}>
                      <div className={styles.calendarDeliveryCardTop}>
                        <img
                          src={firstItem?.product?.image || '/images/placeholder.jpg'}
                          alt={firstItem?.product?.name || 'Produto'}
                          className={styles.calendarDeliveryThumb}
                        />

                        <div className={styles.calendarDeliveryInfo}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem' }}>
                            <span className={styles.calendarDeliveryCustomer}>
                              {order.customer_name}
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: '#8C7A6B', fontWeight: 700 }}>
                              #{order.id.slice(-6).toUpperCase()}
                            </span>
                          </div>

                          <div className={styles.calendarDeliveryItemName}>
                            {order.total_units}x {firstItem?.product?.name || 'Lembrancinhas'}
                          </div>

                          <div className={styles.calendarDeliverySpecs}>
                            <span
                              className={`${styles.deliveryBadge} ${
                                order.delivery_method === 'entrega-correios'
                                  ? styles.deliveryCorreios
                                  : styles.deliveryRetirada
                              }`}
                              style={{ padding: '2px 6px', fontSize: '0.6875rem' }}
                            >
                              {order.delivery_method === 'entrega-correios' ? (
                                <>
                                  <Truck size={10} /> Correios
                                </>
                              ) : (
                                'Retirada'
                              )}
                            </span>

                            {daysInfo && (
                              <span
                                className={
                                  daysInfo.isUrgent && order.status !== 'pronto' && order.status !== 'entregue'
                                    ? styles.calendarUrgentTag
                                    : styles.calendarSafeTag
                                }
                              >
                                {daysInfo.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={styles.calendarDeliveryCardActions}>
                        {/* Seletor de Status Rápido */}
                        <button
                          type="button"
                          onClick={() => handleNextStage(order)}
                          className={styles.calendarStageBadgeBtn}
                          style={{
                            backgroundColor:
                              order.status === 'em_analise'
                                ? '#EDE9FE'
                                : order.status === 'em_producao'
                                ? '#FEF3C7'
                                : order.status === 'pronto'
                                ? '#DCFCE7'
                                : '#F3F4F6',
                            color:
                              order.status === 'em_analise'
                                ? '#5B21B6'
                                : order.status === 'em_producao'
                                ? '#92400E'
                                : order.status === 'pronto'
                                ? '#166534'
                                : '#4B5563',
                          }}
                          title="Clique para avançar etapa"
                        >
                          <span>
                            {order.status === 'em_analise'
                              ? 'Em Análise'
                              : order.status === 'em_producao'
                              ? 'Em Produção'
                              : order.status === 'pronto'
                              ? 'Pronto'
                              : 'Entregue'}
                          </span>
                          <ChevronRight size={13} />
                        </button>

                        <div className={styles.calendarActionButtons}>
                          {order.customer_phone && (
                            <button
                              type="button"
                              onClick={() =>
                                order.status === 'pronto'
                                  ? handleWhatsAppReady(order)
                                  : handleWhatsAppContact(order)
                              }
                              className={`${styles.calendarMiniBtn} ${
                                order.status === 'pronto' ? styles.calendarMiniBtnWhatsApp : ''
                              }`}
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle size={14} />
                              <span>WhatsApp</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className={styles.calendarMiniBtn}
                            title="Ver detalhes da personalização"
                          >
                            <Eye size={14} />
                            <span>Detalhes</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-VISÃO 2: LISTA / AGENDA CRONOLÓGICA */}
          {calendarSubView === 'agenda' && (
            <div className={styles.calendarAgendaContainer}>
              {sortedDateKeys.length > 0 ? (
                sortedDateKeys.map((dateKey) => {
                  const dayOrders = ordersByDate[dateKey] || [];
                  const daysInfo = getDaysUntil(dateKey);
                  const totalUnits = dayOrders.reduce((acc, curr) => acc + (curr.total_units || 0), 0);
                  const hasUrgent =
                    daysInfo.isUrgent &&
                    dayOrders.some((o) => o.status !== 'pronto' && o.status !== 'entregue');

                  return (
                    <div key={dateKey} className={styles.calendarAgendaGroup}>
                      <div className={styles.calendarAgendaGroupHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                          <h4 className={styles.calendarAgendaDateTitle}>
                            <Calendar size={18} color="#6D4C3D" />
                            <span>{formatDateFull(dateKey)}</span>
                          </h4>

                          <span
                            className={
                              hasUrgent ? styles.calendarUrgentTag : styles.calendarSafeTag
                            }
                          >
                            {daysInfo.label}
                          </span>
                        </div>

                        <span style={{ fontSize: '0.8125rem', color: '#8C7A6B', fontWeight: 600 }}>
                          {dayOrders.length} {dayOrders.length === 1 ? 'pedido' : 'pedidos'} • {totalUnits}{' '}
                          {totalUnits === 1 ? 'unidade' : 'unidades'}
                        </span>
                      </div>

                      <div className={styles.calendarAgendaOrdersList}>
                        {dayOrders.map((order) => {
                          const firstItem = order.items?.[0];

                          return (
                            <div key={order.id} className={styles.calendarDeliveryCard}>
                              <div className={styles.calendarDeliveryCardTop}>
                                <img
                                  src={firstItem?.product?.image || '/images/placeholder.jpg'}
                                  alt={firstItem?.product?.name || 'Produto'}
                                  className={styles.calendarDeliveryThumb}
                                />

                                <div className={styles.calendarDeliveryInfo}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem' }}>
                                    <span className={styles.calendarDeliveryCustomer}>
                                      {order.customer_name}
                                    </span>
                                    <span style={{ fontSize: '0.6875rem', color: '#8C7A6B', fontWeight: 700 }}>
                                      #{order.id.slice(-6).toUpperCase()}
                                    </span>
                                  </div>

                                  <div className={styles.calendarDeliveryItemName}>
                                    {order.total_units}x {firstItem?.product?.name || 'Lembrancinhas'}
                                  </div>

                                  <div className={styles.calendarDeliverySpecs}>
                                    <span
                                      className={`${styles.deliveryBadge} ${
                                        order.delivery_method === 'entrega-correios'
                                          ? styles.deliveryCorreios
                                          : styles.deliveryRetirada
                                      }`}
                                      style={{ padding: '2px 6px', fontSize: '0.6875rem' }}
                                    >
                                      {order.delivery_method === 'entrega-correios' ? (
                                        <>
                                          <Truck size={10} /> Correios
                                        </>
                                      ) : (
                                        'Retirada'
                                      )}
                                    </span>

                                    <span style={{ fontWeight: 700, color: '#2E7D32', fontSize: '0.75rem' }}>
                                      R$ {Number(order.total_amount).toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className={styles.calendarDeliveryCardActions}>
                                <button
                                  type="button"
                                  onClick={() => handleNextStage(order)}
                                  className={styles.calendarStageBadgeBtn}
                                  style={{
                                    backgroundColor:
                                      order.status === 'em_analise'
                                        ? '#EDE9FE'
                                        : order.status === 'em_producao'
                                        ? '#FEF3C7'
                                        : order.status === 'pronto'
                                        ? '#DCFCE7'
                                        : '#F3F4F6',
                                    color:
                                      order.status === 'em_analise'
                                        ? '#5B21B6'
                                        : order.status === 'em_producao'
                                        ? '#92400E'
                                        : order.status === 'pronto'
                                        ? '#166534'
                                        : '#4B5563',
                                  }}
                                  title="Clique para avançar etapa"
                                >
                                  <span>
                                    {order.status === 'em_analise'
                                      ? 'Em Análise'
                                      : order.status === 'em_producao'
                                      ? 'Em Produção'
                                      : order.status === 'pronto'
                                      ? 'Pronto'
                                      : 'Entregue'}
                                  </span>
                                  <ChevronRight size={13} />
                                </button>

                                <div className={styles.calendarActionButtons}>
                                  {order.customer_phone && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        order.status === 'pronto'
                                          ? handleWhatsAppReady(order)
                                          : handleWhatsAppContact(order)
                                      }
                                      className={`${styles.calendarMiniBtn} ${
                                        order.status === 'pronto' ? styles.calendarMiniBtnWhatsApp : ''
                                      }`}
                                      title="Abrir WhatsApp"
                                    >
                                      <MessageCircle size={14} />
                                      <span>WhatsApp</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrder(order)}
                                    className={styles.calendarMiniBtn}
                                    title="Ver detalhes da personalização"
                                  >
                                    <Eye size={14} />
                                    <span>Detalhes</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.calendarEmptyState}>
                  <Calendar size={36} color="#8C7A6B" />
                  <p style={{ fontWeight: 700, color: '#2D231E', margin: '0.75rem 0 0.25rem' }}>
                    Nenhuma entrega agendada encontrada
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: '#8C7A6B', margin: 0 }}>
                    Tente alterar o filtro de status ou a busca de pedidos.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SEÇÃO OPCIONAL: PEDIDOS SEM DATA DE EVENTO INFORMADA */}
          {ordersWithoutDate.length > 0 && (
            <div className={styles.calendarAgendaGroup} style={{ borderStyle: 'dashed' }}>
              <div
                className={styles.calendarAgendaGroupHeader}
                style={{ cursor: 'pointer' }}
                onClick={() => setShowWithoutDateSection(!showWithoutDateSection)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={18} color="#8C7A6B" />
                  <h4 className={styles.calendarAgendaDateTitle} style={{ color: '#6D4C3D' }}>
                    Pedidos sem Data de Evento Especificada ({ordersWithoutDate.length})
                  </h4>
                </div>

                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8C7A6B' }}>
                  {showWithoutDateSection ? '▲ Ocultar' : '▼ Ver Pedidos'}
                </span>
              </div>

              {showWithoutDateSection && (
                <div className={styles.calendarAgendaOrdersList}>
                  {ordersWithoutDate.map((order) => {
                    const firstItem = order.items?.[0];

                    return (
                      <div key={order.id} className={styles.calendarDeliveryCard}>
                        <div className={styles.calendarDeliveryCardTop}>
                          <img
                            src={firstItem?.product?.image || '/images/placeholder.jpg'}
                            alt={firstItem?.product?.name || 'Produto'}
                            className={styles.calendarDeliveryThumb}
                          />

                          <div className={styles.calendarDeliveryInfo}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem' }}>
                              <span className={styles.calendarDeliveryCustomer}>
                                {order.customer_name}
                              </span>
                              <span style={{ fontSize: '0.6875rem', color: '#8C7A6B', fontWeight: 700 }}>
                                #{order.id.slice(-6).toUpperCase()}
                              </span>
                            </div>

                            <div className={styles.calendarDeliveryItemName}>
                              {order.total_units}x {firstItem?.product?.name || 'Lembrancinhas'}
                            </div>

                            <div className={styles.calendarDeliverySpecs}>
                              <span style={{ color: '#B45309', fontWeight: 600, fontSize: '0.75rem' }}>
                                Data da comemoração não informada
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className={styles.calendarDeliveryCardActions}>
                          <div className={styles.calendarActionButtons} style={{ width: '100%', justifyContent: 'space-between' }}>
                            {order.customer_phone ? (
                              <button
                                type="button"
                                onClick={() => handleWhatsAppContact(order)}
                                className={styles.calendarMiniBtnWhatsApp}
                                style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', border: '1px solid #BBF7D0', cursor: 'pointer' }}
                                title="Pedir data do evento pelo WhatsApp"
                              >
                                <MessageCircle size={14} />
                                <span>Perguntar Data</span>
                              </button>
                            ) : <div />}

                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className={styles.calendarMiniBtn}
                              title="Ver detalhes do pedido"
                            >
                              <Eye size={14} />
                              <span>Detalhes</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==========================================================================
          MODAL DE DETALHES DA PERSONALIZAÇÃO EM 1 CLIQUE
          ========================================================================== */}
      {selectedOrder && (
        <div className={styles.orderModalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.orderModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.orderModalHeader}>
              <div className={styles.orderModalTitleGroup}>
                <h3 className={styles.orderModalTitle}>
                  <span>Pedido #{selectedOrder.id.slice(-6).toUpperCase()}</span>
                </h3>
                <div className={styles.orderModalMeta}>
                  <span>Cliente: <strong>{selectedOrder.customer_name}</strong></span>
                  <span>•</span>
                  <span>Data do Pedido: {formatDateDisplay(selectedOrder.created_at)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className={styles.closeBtn}
                title="Fechar detalhes"
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.orderModalBody}>
              <div className={styles.orderStatusBanner}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6D4C3D' }}>
                    Status de Produção:
                  </span>
                  <span
                    className={styles.columnBadge}
                    style={{
                      backgroundColor: STAGES.find((s) => s.id === selectedOrder.status)?.badgeBg,
                      color: STAGES.find((s) => s.id === selectedOrder.status)?.badgeColor,
                    }}
                  >
                    {STAGES.find((s) => s.id === selectedOrder.status)?.label}
                  </span>
                </div>

                <div className={styles.statusChangeGroup}>
                  <span style={{ fontSize: '0.8125rem', color: '#8C7A6B' }}>Mudar Etapa:</span>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value as OrderStatus)}
                    className={styles.statusSelect}
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedOrder.status === 'entregue' && (
                <div className={styles.modalDeliveredNotice}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CheckCheck size={16} color="#15803D" />
                    <span><strong>Pedido Entregue:</strong> Todas as informações deste pedido estão salvas permanentemente na Ficha de Clientes.</span>
                  </div>
                  {onNavigateToCustomers && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrder(null);
                        onNavigateToCustomers();
                      }}
                      className={styles.modalDeliveredNavBtn}
                    >
                      Abrir Ficha do Cliente →
                    </button>
                  )}
                </div>
              )}

              <div>
                <h4 className={styles.modalSectionHeading}>
                  <Tag size={16} color="#6D4C3D" />
                  <span>Itens e Personalização Escolhida pelo Cliente</span>
                </h4>

                <div className={styles.modalItemsList}>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((it: any, idx: number) => {
                      const cust = it.customization || {};

                      return (
                        <div key={idx} className={styles.modalItemCard}>
                          <div className={styles.modalItemTop}>
                            <img
                              src={it.product?.image || '/images/placeholder.jpg'}
                              alt={it.product?.name || 'Produto'}
                              className={styles.modalItemImage}
                            />
                            <div className={styles.modalItemInfo}>
                              <h5 className={styles.modalItemTitle}>{it.product?.name}</h5>
                              <div className={styles.modalItemPriceRow}>
                                <span>Quantidade: <strong>{it.quantity || 1} un.</strong></span>
                                <span>•</span>
                                <span>Preço unitário: R$ {Number(it.product?.price || 0).toFixed(2).replace('.', ',')}</span>
                                <span>•</span>
                                <span style={{ color: '#2E7D32', fontWeight: 700 }}>
                                  Subtotal: R$ {Number(it.subtotal || (it.quantity || 1) * (it.product?.price || 0)).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className={styles.modalSpecsGrid}>
                            <div className={styles.specBox}>
                              <span className={styles.specLabel}>Modelo / Variação</span>
                              <span className={`${styles.specValue} ${cust.variation ? styles.specValueHighlight : ''}`}>
                                {cust.variation || 'Modelo Padrão'}
                              </span>
                            </div>

                            <div className={styles.specBox}>
                              <span className={styles.specLabel}>Nome na Lembrancinha</span>
                              <span className={`${styles.specValue} ${cust.childName ? styles.specValueHighlight : ''}`}>
                                {cust.childName || 'Não especificado'}
                              </span>
                            </div>

                            <div className={styles.specBox}>
                              <span className={styles.specLabel}>Data do Evento / Aniversário</span>
                              <span className={styles.specValue}>
                                {cust.ageOrDate || formatDateDisplay(selectedOrder.event_date) || 'Não informada'}
                              </span>
                            </div>

                            <div className={styles.specBox}>
                              <span className={styles.specLabel}>Cor da Fita / Laço</span>
                              <span className={`${styles.specValue} ${cust.ribbonColor ? styles.specValueHighlight : ''}`}>
                                {cust.ribbonColor || 'Padrão da foto'}
                              </span>
                            </div>

                            {cust.customFieldValues &&
                              Object.entries(cust.customFieldValues).map(([k, val]) => (
                                <div key={k} className={styles.specBox}>
                                  <span className={styles.specLabel}>{k}</span>
                                  <span className={styles.specValue}>{String(val)}</span>
                                </div>
                              ))}
                          </div>

                          {cust.notes && (
                            <div className={styles.itemNotesBox}>
                              <strong>Observações do Produto:</strong> {cust.notes}
                            </div>
                          )}

                          {selectedOrder.general_notes && (
                            <div className={styles.itemNotesBox} style={{ marginTop: cust.notes ? '0.5rem' : '0' }}>
                              <strong>Observações Gerais do Pedido:</strong> {selectedOrder.general_notes}
                            </div>
                          )}

                          {selectedOrder.coupon_code && (
                            <div className={styles.itemCouponBox} style={{ marginTop: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Ticket size={15} />
                                <span>
                                  <strong>Cupom de Desconto Aplicado:</strong>{' '}
                                  <span className={styles.itemCouponBadge}>{selectedOrder.coupon_code}</span>
                                </span>
                              </div>
                              {selectedOrder.discount_amount !== undefined && selectedOrder.discount_amount > 0 && (
                                <span style={{ fontWeight: 700 }}>
                                  Desconto: -R$ {Number(selectedOrder.discount_amount).toFixed(2).replace('.', ',')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ color: '#8C7A6B', fontStyle: 'italic' }}>
                      Nenhum detalhe de item encontrado para este pedido.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className={styles.modalSectionHeading}>
                  <MapPin size={16} color="#6D4C3D" />
                  <span>Dados do Cliente & Entrega</span>
                </h4>

                <div className={styles.modalCustomerGrid}>
                  <div className={styles.customerDetailBox}>
                    <span className={styles.customerBoxLabel}>Cliente</span>
                    <span className={styles.customerBoxContent}>{selectedOrder.customer_name}</span>
                  </div>

                  <div className={styles.customerDetailBox}>
                    <span className={styles.customerBoxLabel}>WhatsApp / Contato</span>
                    {selectedOrder.customer_phone ? (
                      <a
                        href={formatWhatsAppUrl(selectedOrder.customer_phone, 'Olá!')}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.customerBoxContent}
                        style={{ color: '#128C7E', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <MessageCircle size={15} />
                        <span>{selectedOrder.customer_phone}</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className={styles.customerBoxContent}>Não informado</span>
                    )}
                  </div>

                  <div className={styles.customerDetailBox}>
                    <span className={styles.customerBoxLabel}>Forma de Entrega</span>
                    <span className={styles.customerBoxContent}>
                      {formatDeliveryLabel(selectedOrder.delivery_method)}
                    </span>
                  </div>

                  <div className={styles.customerDetailBox}>
                    <span className={styles.customerBoxLabel}>Valor Total do Pedido</span>
                    <span className={styles.customerBoxContent} style={{ color: '#2E7D32', fontSize: '1.15rem' }}>
                      R$ {Number(selectedOrder.total_amount).toFixed(2).replace('.', ',')}
                    </span>
                    {selectedOrder.coupon_code && selectedOrder.discount_amount !== undefined && selectedOrder.discount_amount > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
                        (Economia de R$ {Number(selectedOrder.discount_amount).toFixed(2).replace('.', ',')} com cupom {selectedOrder.coupon_code})
                      </span>
                    )}
                  </div>
                </div>

                {selectedOrder.delivery_address && (
                  <div className={styles.customerDetailBox} style={{ marginTop: '0.75rem' }}>
                    <span className={styles.customerBoxLabel}>Endereço Completo de Envio</span>
                    <span className={styles.customerBoxContent}>{selectedOrder.delivery_address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.orderModalFooter}>
              <div className={styles.modalWhatsAppActions}>
                <button
                  type="button"
                  onClick={() => handleWhatsAppReady(selectedOrder)}
                  className={styles.btnWhatsAppReady}
                  title="Abrir WhatsApp com mensagem pré-formatada de pedido pronto"
                >
                  <MessageCircle size={16} />
                  <span>Avisar que está pronto</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWhatsAppContact(selectedOrder)}
                  className={styles.btnWhatsAppOutline}
                  title="Conversar com o cliente no WhatsApp"
                >
                  <MessageCircle size={15} />
                  <span>💬 Falar no WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.customer_name)}
                  className={styles.btnDeleteModal}
                  title="Remover / Cancelar este pedido"
                >
                  <Trash2 size={14} />
                  <span>Remover Pedido</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className={styles.btnPrintSheet}
                title="Imprimir ficha de produção deste pedido"
              >
                <Printer size={15} />
                <span>Imprimir Ficha</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

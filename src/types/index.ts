export type CategoryId =
  | 'todos'
  | 'natal'
  | 'dia-dos-professores'
  | 'cadernos'
  | (string & {});

export interface Category {
  id: CategoryId;
  name: string;
  icon?: string;
  description: string;
}

export interface ProductVariation {
  id: string;
  name: string;
  image: string;
  images?: string[];
  description?: string;
  price?: number;
}

export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  optionsText?: string;
}

export interface CustomizationSettings {
  allowChildName?: boolean;
  childNameLabel?: string;
  childNamePlaceholder?: string;
  notesPlaceholder?: string;
  childNameRequired?: boolean;
  allowRibbonColors?: boolean;
  ribbonColorRequired?: boolean;
  ribbonColors?: string[];
  allowNotes?: boolean;
  variationsNote?: string;
  customFields?: CustomFieldDefinition[];
}

export interface QuantityDiscount {
  minQuantity: number;
  price: number;
}

export interface CustomizationOptions {
  theme?: string;
  childName?: string;
  ageOrDate?: string;
  ribbonColor?: string;
  variation?: string;
  notes?: string;
  customFieldValues?: Record<string, string>;
}

export interface Product {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  price: number;
  originalPrice?: number;
  minQuantity: number;
  quantityDiscounts?: QuantityDiscount[];
  image: string;
  images?: string[];
  variations?: ProductVariation[];
  variationsNote?: string;
  leadTimeDays: number;
  popular?: boolean;
  featured?: boolean;
  isBestSeller?: boolean;
  unit: string;
  availableRibbonColors?: string[];
  customizationSettings?: CustomizationSettings;
}

export interface CartItem {
  cartItemId: string;
  id?: string;
  product: Product;
  quantity: number;
  customization: CustomizationOptions;
  subtotal: number;
  unitPrice?: number;
}

export type DeliveryMethod =
  | 'retirada-pouso-alegre'
  | 'retirada-paraisopolis'
  | 'entrega-correios';

export interface CustomerOrderData {
  customerName: string;
  customerPhone: string;
  eventDate: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  generalNotes?: string;
  shippingCep?: string;
  shippingServiceName?: string;
  shippingCompany?: string;
  shippingPrice?: number;
  shippingDeliveryDays?: number;
}

export type OrderStatus =
  | 'em_analise'
  | 'em_producao'
  | 'pronto'
  | 'entregue';

export interface ProductionOrder {
  id: string;
  customer_name: string;
  customer_phone?: string;
  event_date?: string;
  delivery_method?: string;
  delivery_address?: string;
  general_notes?: string;
  total_units: number;
  total_amount: number;
  coupon_code?: string;
  discount_amount?: number;
  subtotal_amount?: number;
  status: OrderStatus;
  items: any[];
  created_at: string;
  updated_at?: string;
}

export interface AppliedCoupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description?: string;
  firstPurchaseOnly?: boolean;
  excludeWholesale?: boolean;
}


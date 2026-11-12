/**
 * Modelagem de Domínio da Wê Lembrancinhas
 */

export type CategoryId = 
  | 'todos'
  | 'natal'
  | 'dia-dos-professores'
  | 'cadernos'
  | (string & {}); // Permite novas categorias dinâmicas criadas no painel admin

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
  options?: string[]; // Opções quando o tipo for 'select'
  optionsText?: string; // Helper para edição no painel
}

export interface CustomizationSettings {
  allowChildName?: boolean;      // Solicita nome na lembrancinha (padrão: true)
  childNameLabel?: string;       // Rótulo customizável (ex: "Nome da Criança", "Nome do Casal")
  childNamePlaceholder?: string; // Exemplo/placeholder dentro da caixa (ex: "Ex: Professora Leandra, Luís...")
  notesPlaceholder?: string;     // Exemplo/placeholder de observações
  childNameRequired?: boolean;   // Se o nome é obrigatório (padrão: true)
  allowRibbonColors?: boolean;   // Oferece opções de laços/fitas
  ribbonColorRequired?: boolean; // Se a escolha da fita é obrigatória
  ribbonColors?: string[];       // Cores disponíveis
  allowNotes?: boolean;          // Campo de observações especiais (padrão: true)
  variationsNote?: string;       // Mensagem/aviso exibido abaixo dos modelos
  customFields?: CustomFieldDefinition[]; // Campos extras flexíveis
}

export interface CustomizationOptions {
  theme?: string;
  childName?: string;
  ageOrDate?: string;
  ribbonColor?: string;
  variation?: string;
  notes?: string;
  customFieldValues?: Record<string, string>; // Respostas dos campos extras
}

export interface Product {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  price: number;
  minQuantity: number;
  image: string;
  images?: string[];
  variations?: ProductVariation[];
  variationsNote?: string; // Mensagem/aviso exibido abaixo dos modelos (ex: Enviar fotos pelo WhatsApp)
  leadTimeDays: number; // Prazo de produção em dias úteis
  popular?: boolean;
  featured?: boolean;
  unit: string; // "unidade", "kit", "cento"
  availableRibbonColors?: string[];
  customizationSettings?: CustomizationSettings;
}

export interface CartItem {
  cartItemId: string; // Identificador único (id do produto + hash das customizações)
  id?: string;
  product: Product;
  quantity: number;
  customization: CustomizationOptions;
  subtotal: number;
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
}


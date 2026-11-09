import { Product } from '@/types';

export const STORE_CONFIG = {
  storeName: 'Wê Lembrancinhas',
  artisanName: 'Wenilze Fróes',
  instagram: 'welembrancinhas',
  instagramUrl: 'https://instagram.com/welembrancinhas',
  // Número oficial de WhatsApp (DDD de Minas 35 - Pouso Alegre / Paraisópolis)
  whatsappNumber: '5535999999999', 
  locations: ['Pouso Alegre - MG', 'Paraisópolis - MG'],
  tagline: 'Lembrancinhas personalizadas e papelaria afetiva para qualquer ocasião especial',
  defaultLeadTimeDays: 5,
};

export const PRODUCTS: Product[] = [
  {
    id: 'mini-lata-natal-luxo',
    name: 'Mini Lata Natalina Personalizada com Laço Luxo & Tag',
    category: 'natal',
    description: 'Lembrancinha natalina em lata com acabamento artesanal de luxo. Acompanha rótulo temático personalizado com o nome, laço de cetim com pompom de neve e tag de Boas Festas com cordão dourado. Ideal para rechear com biscoitos caseiros, bombons, pães de mel ou doces.',
    price: 15.00,
    minQuantity: 1,
    unit: 'unidade',
    leadTimeDays: 5,
    popular: true,
    featured: true,
    image: '/images/natal/lata-natal-1.jpg',
    images: [
      '/images/natal/lata-natal-1.jpg',
      '/images/natal/lata-natal-2.jpg'
    ],
    availableRibbonColors: [
      'Laço Verde com Pompom Branco',
      'Laço Vermelho com Pompom Branco',
      'Dourado com Pompom Branco'
    ]
  }
];

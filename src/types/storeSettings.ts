export interface TopBannerSettings {
  enabled: boolean;
  text: string;
  link?: string;
  bgColor?: string;
  textColor?: string;
}

export interface StoreSettings {
  storeName: string;
  artisanName: string;
  whatsappNumber: string;
  instagram: string;
  instagramUrl: string;
  locations: string[];
  defaultLeadTimeDays: number;
  topBanner: TopBannerSettings;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Wê Lembrancinhas',
  artisanName: 'Wenilze Fróes',
  whatsappNumber: '5535984026382',
  instagram: 'welembrancinhas',
  instagramUrl: 'https://instagram.com/welembrancinhas',
  locations: ['Pouso Alegre - MG', 'Paraisópolis - MG'],
  defaultLeadTimeDays: 5,
  topBanner: {
    enabled: true,
    text: '🎄 Agenda de encomendas para o Natal aberta até 15/12!',
    link: '#catalogo',
    bgColor: '#6D4C3D',
    textColor: '#FFFFFF',
  },
};

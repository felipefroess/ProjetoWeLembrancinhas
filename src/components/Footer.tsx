'use client';

import React from 'react';
import { MapPin, Lock } from 'lucide-react';
import { InstagramIcon } from '@/components/InstagramIcon';
import { WhatsappIcon } from '@/components/WhatsappIcon';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { STORE_CONFIG } from '@/data/products';
import styles from './Footer.module.css';

export function Footer() {
  const { settings } = useStoreSettings();
  const artisanName = settings.artisanName || STORE_CONFIG.artisanName;
  const storeName = settings.storeName || STORE_CONFIG.storeName;
  const phone = settings.whatsappNumber || STORE_CONFIG.whatsappNumber;
  const instagram = settings.instagram || STORE_CONFIG.instagram;
  const instagramUrl = settings.instagramUrl || STORE_CONFIG.instagramUrl;

  return (
    <footer className={styles.footerContainer}>
      <div className={styles.innerWrap}>
        <div className={styles.columnsGrid}>
          
          {/* Coluna 1: Sobre a Loja */}
          <div>
            <div className={styles.brandHeader}>
              <a
                href="#"
                className={styles.brandLink}
                aria-label="Wê Lembrancinhas - Ir para o topo"
              >
                <span className={styles.logoText}>Wê</span>
                <span className={styles.brandTitle}>Lembrancinhas</span>
              </a>
            </div>
            <p className={styles.aboutDescription}>
              Lembrancinhas personalizadas criadas à mão com amor e precisão por <strong>{artisanName}</strong>. Cada detalhe é planejado para tornar a sua celebração inesquecível.
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Rua+Jo%C3%A3o+Ferreira+de+Paula%2C+20+-+Pouso+Alegre+-+MG"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.locationNote}
              title="Abrir endereço no Google Maps"
            >
              <MapPin size={14} className={styles.pinIcon} />
              <span>Rua João Ferreira de Paula, 20 - Pouso Alegre - MG</span>
            </a>
          </div>

          {/* Coluna 2: Redes & Contato */}
          <div>
            <h4 className={styles.columnTitle}>
              Conecte-se Conosco
            </h4>
            <ul className={styles.linksList}>
              <li>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.footerLink}
                >
                  <InstagramIcon size={14} className={styles.linkIcon} />
                  <span>Instagram: @{instagram}</span>
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.footerLink}
                >
                  <WhatsappIcon size={14} className={styles.linkIcon} />
                  <span>WhatsApp para Encomendas</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Rodapé inferior */}
        <div className={styles.bottomRow}>
          <p>© 2026 {storeName}. Todos os direitos reservados.</p>
          <a
            href="/admin/login"
            className={styles.discreetAdminLink}
            title="Acesso Administrativo"
          >
            <Lock size={11} className={styles.adminIcon} />
            <span>Acesso Administrativo</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

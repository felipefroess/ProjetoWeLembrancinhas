'use client';

import React from 'react';
import { MapPin, Lock } from 'lucide-react';
import { InstagramIcon } from '@/components/InstagramIcon';
import { STORE_CONFIG } from '@/data/products';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footerContainer}>
      <div className={styles.innerWrap}>
        <div className={styles.columnsGrid}>
          
          {/* Coluna 1: Sobre a Loja */}
          <div>
            <div className={styles.brandHeader}>
              <span className={styles.brandName}>
                Wê Lembrancinhas
              </span>
            </div>
            <p className={styles.aboutDescription}>
              Lembrancinhas personalizadas criadas à mão com amor e precisão por <strong>{STORE_CONFIG.artisanName}</strong>. Cada detalhe é planejado para tornar a sua celebração inesquecível.
            </p>
            <div className={styles.locationNote}>
              <MapPin size={14} className={styles.pinIcon} />
              <span>Atendimento em Pouso Alegre - MG & Paraisópolis - MG</span>
            </div>
          </div>

          {/* Coluna 2: Redes & Contato */}
          <div>
            <h4 className={styles.columnTitle}>
              Conecte-se Conosco
            </h4>
            <ul className={styles.linksList}>
              <li>
                <a
                  href={STORE_CONFIG.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.footerLink}
                >
                  <InstagramIcon size={14} className={styles.linkIcon} />
                  <span>Instagram: @{STORE_CONFIG.instagram}</span>
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${STORE_CONFIG.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.footerLink}
                >
                  <span>WhatsApp para Encomendas</span>
                </a>
              </li>
              <li style={{ marginTop: '0.625rem' }}>
                <a
                  href="/admin"
                  className={styles.discreetAdminLink}
                  title="Acesso Administrativo"
                >
                  <Lock size={11} className={styles.adminIcon} />
                  <span>Acesso Administrativo</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Rodapé inferior */}
        <div className={styles.bottomRow}>
          <p>© 2026 Wê Lembrancinhas. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

import { Container } from '@shared/ui'
// import { PRIMARY_CONTACT, SITE } from '@shared/config/site'
import { SITE } from '@shared/config/site'


import styles from './SiteHeader.module.css'

export interface SiteHeaderProps {
  /** Total number of models, shown next to the catalogue link. */
  totalCount: number
}

/** Sticky masthead: wordmark, section link, phone. */
export const SiteHeader = ({ totalCount }: SiteHeaderProps) => (
  <header className={styles.header}>
    <Container className={styles.inner}>
      <a href="#top" className={styles.brand}>
        {/* MD monogram: the bowl of the D is an open door in the brand amber. */}
        <svg
          viewBox="0 0 38 24"
          width="34"
          height="21"
          aria-hidden="true"
          className={styles.mark}
        >
          <path
            d="M0 24V0h4.6l5 13.4L14.6 0h4.6v24h-4.3V8.6l-4.2 11.2H8L3.8 8.6V24z"
            fill="currentColor"
          />
          <path
            d="M22 0h5.4C33.2 0 37 4.8 37 12s-3.8 12-9.6 12H22z"
            fill="currentColor"
          />
          <path
            d="M26.4 4.7h1.1c2.8 0 4.6 2.9 4.6 7.3s-1.8 7.3-4.6 7.3h-1.1z"
            fill="var(--c-accent)"
          />
        </svg>
        <span className={styles.wordmark}>{SITE.brand}</span>
      </a>

      <nav className={styles.nav} aria-label="Основная навигация">
        <a href="#catalog" className={styles.link}>
          Каталог
          <span className={styles.count}>{totalCount}</span>
        </a>
        <a href="#contacts" className={styles.link}>
          Контакты
        </a>
      </nav>

      {/* <a href={PRIMARY_CONTACT.href} className={styles.phone}>
        {PRIMARY_CONTACT.phone}
      </a> */}
    </Container>
  </header>
)

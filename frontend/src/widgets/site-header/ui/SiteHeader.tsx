import { Container } from '@shared/ui'
// import { withBase } from '@shared/lib/withBase'
import { PRIMARY_CONTACT, SITE } from '@shared/config/site'

import styles from './SiteHeader.module.css'

export interface SiteHeaderProps {
  /** Сколько всего моделей — цифра рядом со ссылкой на каталог. */
  totalCount: number
  /** Открыть форму заявки без привязки к конкретной модели. */
  onRequest: () => void
}

/** Прилипающая шапка: логотип, навигация, действие. */
export const SiteHeader = ({ totalCount, onRequest }: SiteHeaderProps) => (
  <header className={styles.header}>
    <Container className={styles.inner}>
      <a href="#top" className={styles.brand}>
        {/* <img
          src={withBase(SITE.logo)}
          alt={SITE.legalName}
          width={40}
          height={40}
          className={styles.logo}
        /> */}
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

      <div className={styles.actions}>
        {/* Пока контактов нет, единственный способ связи — форма. */}
        {PRIMARY_CONTACT && (
          <a href={PRIMARY_CONTACT.href} className={styles.phone}>
            {PRIMARY_CONTACT.phone}
          </a>
        )}
        <button type="button" className={styles.cta} onClick={onRequest}>
          Оставить заявку
        </button>
      </div>
    </Container>
  </header>
)

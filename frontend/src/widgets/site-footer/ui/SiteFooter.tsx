import { Container } from '@shared/ui'
import { withBase } from '@shared/lib/withBase'
import { CONTACTS, SITE } from '@shared/config/site'

import styles from './SiteFooter.module.css'

export interface SiteFooterProps {
  /** Открыть форму заявки без привязки к конкретной модели. */
  onRequest: () => void
}

/**
 * Подвал: реквизиты и связь.
 *
 * Блок контактов появляется сам, как только в `CONTACTS` окажется хотя бы одна
 * запись; пока список пуст, вместо него показывается кнопка заявки.
 */
export const SiteFooter = ({ onRequest }: SiteFooterProps) => (
  <footer className={styles.footer} id="contacts">
    <Container>
      <div className={styles.top}>
        <div className={styles.brandBlock}>
          <img
            src={withBase(SITE.logo)}
            alt={SITE.legalName}
            width={72}
            height={72}
            className={styles.logo}
          />
          <p className={styles.brand}>{SITE.legalName}</p>
          <p className={styles.tagline}>{SITE.tagline}</p>
        </div>

        {CONTACTS.length > 0 ? (
          <ul className={styles.contacts}>
            {CONTACTS.map((contact) => (
              <li key={contact.href} className={styles.contact}>
                <span className={styles.role}>{contact.role}</span>
                <a href={contact.href} className={styles.phone}>
                  {contact.phone}
                </a>
                <span className={styles.name}>{contact.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.callout}>
            <p className={styles.calloutTitle}>Подберём модель под ваш проём</p>
            <p className={styles.calloutText}>
              Оставьте заявку — уточним размеры, комплектацию и сроки,
              рассчитаем стоимость.
            </p>
            <button type="button" className={styles.calloutButton} onClick={onRequest}>
              Оставить заявку
            </button>
          </div>
        )}
      </div>

      <div className={styles.bottom}>
        <p>
          © {new Date().getFullYear()} {SITE.legalName}
        </p>
        <p className={styles.note}>Все права защищены</p>
      </div>
    </Container>
  </footer>
)

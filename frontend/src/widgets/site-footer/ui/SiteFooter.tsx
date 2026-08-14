import { Container } from '@shared/ui'
// import { CONTACTS, SITE } from '@shared/config/site'
import { SITE } from '@shared/config/site'


import styles from './SiteFooter.module.css'

export interface SiteFooterProps {
  /** Source catalogue filename, shown as provenance. */
  source: string
}

/** Contacts transcribed from the back cover of the printed catalogue. */
export const SiteFooter = ({ source }: SiteFooterProps) => (
  <footer className={styles.footer} id="contacts">
    <Container>
      <div className={styles.top}>
        <div className={styles.brandBlock}>
          <p className={styles.brand}>{SITE.brand}</p>
          <p className={styles.tagline}>{SITE.tagline}</p>
        </div>

        {/* <ul className={styles.contacts}>
          {CONTACTS.map((contact) => (
            <li key={contact.href} className={styles.contact}>
              <span className={styles.role}>{contact.role}</span>
              <a href={contact.href} className={styles.phone}>
                {contact.phone}
              </a>
              <span className={styles.name}>{contact.name}</span>
            </li>
          ))}
        </ul> */}
      </div>

      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} {SITE.brand}</p>
        <p className={styles.source}>Данные и изображения из каталога «{source}»</p>
      </div>
    </Container>
  </footer>
)

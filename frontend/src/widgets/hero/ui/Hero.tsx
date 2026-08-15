import { Container } from '@shared/ui'
import { SITE } from '@shared/config/site'

import styles from './Hero.module.css'

export interface HeroProps {
  cover: string
  doorCount: number
  collectionCount: number
}

/** Первый экран: название каталога, цифры, интерьерная фотография. */
export const Hero = ({ cover, doorCount, collectionCount }: HeroProps) => (
  <section className={styles.hero} id="top">
    <Container className={styles.inner}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{SITE.catalogTitle}</p>
        <h1 className={styles.title}>{SITE.tagline}</h1>
        <p className={styles.lead}>
          Металлические и МДФ-двери, модели с терморазрывом. Полная спецификация
          каждой модели — из заводского каталога, без сокращений.
        </p>
        <p className={styles.company}>{SITE.legalName}</p>

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt className={styles.statLabel}>Моделей</dt>
            <dd className={styles.statValue}>{doorCount}</dd>
          </div>
          <div className={styles.stat}>
            <dt className={styles.statLabel}>Коллекций</dt>
            <dd className={styles.statValue}>{collectionCount}</dd>
          </div>
          <div className={styles.stat}>
            <dt className={styles.statLabel}>Толщина полотна</dt>
            <dd className={styles.statValue}>6–10,5 см</dd>
          </div>
        </dl>

        <a href="#catalog" className={styles.cta}>
          Смотреть каталог
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              d="M12 4v16m0 0-6-6m6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="square"
            />
          </svg>
        </a>
      </div>

      {cover && (
        <figure className={styles.figure}>
          <img
            src={cover}
            alt="Входная дверь в интерьере"
            width={1400}
            height={1742}
            fetchPriority="high"
            decoding="async"
            className={styles.image}
          />
        </figure>
      )}
    </Container>
  </section>
)

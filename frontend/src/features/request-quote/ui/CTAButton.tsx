import { Button } from '@shared/ui'

import styles from './CTAButton.module.css'

export interface CTAButtonProps {
  onClick: () => void
  className?: string
}

/**
 * «Оставить заявку» — главное действие в карточке модели.
 *
 * Кнопка только открывает форму: отправка и её состояния живут в
 * `RequestQuoteModal`, чтобы одна и та же форма работала и из карточки,
 * и из шапки, и из подвала.
 */
export const CTAButton = ({ onClick, className }: CTAButtonProps) => (
  <div className={className}>
    <Button size="lg" block onClick={onClick}>
      Оставить заявку
    </Button>
    <p className={styles.note}>
      Перезвоним и уточним размеры, комплектацию и сроки.
    </p>
  </div>
)

import { viewLabel, type DoorView } from '@entities/door'
import { SegmentedControl } from '@shared/ui'

const OPTIONS = [
  { value: 'front' as const, label: viewLabel('front') },
  { value: 'back' as const, label: viewLabel('back') },
]

export interface ImageToggleProps {
  value: DoorView
  onChange: (view: DoorView) => void
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Switches a door between its exterior and interior view.
 *
 * Used on the card and again, larger, in the modal gallery.
 */
export const ImageToggle = ({ value, onChange, size = 'sm', className }: ImageToggleProps) => (
  <SegmentedControl
    options={OPTIONS}
    value={value}
    onChange={onChange}
    label="Сторона двери"
    size={size}
    className={className}
  />
)

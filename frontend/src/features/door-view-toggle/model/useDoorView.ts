import { useCallback, useState } from 'react'

import { oppositeView, type DoorView } from '@entities/door'

export interface UseDoorView {
  view: DoorView
  setView: (view: DoorView) => void
  toggle: () => void
  reset: () => void
}

/**
 * Which side of a door is on screen.
 *
 * Each card owns its own instance, so flipping one tile leaves the rest of the
 * grid alone.
 */
export const useDoorView = (initial: DoorView = 'front'): UseDoorView => {
  const [view, setView] = useState<DoorView>(initial)

  return {
    view,
    setView,
    toggle: useCallback(() => setView(oppositeView), []),
    reset: useCallback(() => setView(initial), [initial]),
  }
}

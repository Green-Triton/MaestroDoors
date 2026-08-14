import { useEffect } from 'react'

/**
 * Freeze the page behind an overlay.
 *
 * The scrollbar is replaced with equivalent padding so that locking does not
 * shift the layout sideways — without it, opening a modal makes the whole page
 * jump by the scrollbar width.
 */
export const useLockBodyScroll = (locked: boolean): void => {
  useEffect(() => {
    if (!locked) return

    const { body, documentElement } = document
    const previousPadding = body.style.paddingRight
    const compensation = window.innerWidth - documentElement.clientWidth

    if (compensation > 0) {
      body.style.paddingRight = `${compensation}px`
    }
    body.setAttribute('data-scroll-locked', '')

    return () => {
      body.removeAttribute('data-scroll-locked')
      body.style.paddingRight = previousPadding
    }
  }, [locked])
}

// The save-a-star moment: a small star flies from the Save button to "My Words" in the top
// bar, which then twinkles. Pure decoration: nothing depends on it, it is skipped where the
// browser cannot animate (tests) and for people who ask for less motion.
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function flyStar(fromEl) {
  const target = document.querySelector('[data-star-target]')
  if (!fromEl?.getBoundingClientRect || !target || typeof document.body.animate !== 'function' || reducedMotion()) {
    return false
  }
  const a = fromEl.getBoundingClientRect()
  const b = target.getBoundingClientRect()
  const star = document.createElement('span')
  star.className = 'fly-star'
  star.setAttribute('aria-hidden', 'true')
  star.style.left = `${a.left + a.width / 2 - 8}px`
  star.style.top = `${a.top + a.height / 2 - 8}px`
  document.body.append(star)

  const dx = b.left + b.width / 2 - (a.left + a.width / 2)
  const dy = b.top + b.height / 2 - (a.top + a.height / 2)
  const flight = star.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx / 2}px, ${dy / 2 - 48}px) scale(1.4)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.5)`, opacity: 0.3 },
    ],
    { duration: 600, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  )
  flight.onfinish = () => {
    star.remove()
    target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], {
      duration: 300,
      easing: 'ease-out',
    })
  }
  return true
}

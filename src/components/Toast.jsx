import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const TOAST_MS = 3000
// A toast with a button (such as Undo) stays longer, so there is time to reach it.
const ACTION_MS = 6000
const ToastContext = createContext(() => {})

// toast('Saved') shows a message. toast('Deleted', { action: { label: 'Undo', onClick } }) adds a button.
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null) // { id, text, action }
  const timer = useRef()
  const nextId = useRef(0)

  const startTimer = useCallback((ms) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), ms)
  }, [])

  const show = useCallback(
    (text, { action } = {}) => {
      nextId.current += 1
      setToast({ id: nextId.current, text, action })
      startTimer(action ? ACTION_MS : TOAST_MS)
    },
    [startTimer],
  )

  useEffect(() => () => clearTimeout(timer.current), [])

  // While the pointer or the keyboard is on the toast, it does not close.
  const pause = () => clearTimeout(timer.current)
  const resume = () => startTimer(toast?.action ? ACTION_MS : TOAST_MS)

  function act() {
    clearTimeout(timer.current)
    setToast(null)
    toast.action.onClick()
  }

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* The live region is always on the page, so screen readers hear every new message. */}
      <div role="status" className="toast-region">
        {toast && (
          <div
            key={toast.id}
            className="toast"
            onMouseEnter={pause}
            onMouseLeave={resume}
            onFocus={pause}
            onBlur={resume}
          >
            <span>{toast.text}</span>
            {toast.action && (
              <button type="button" className="toast-action" onClick={act}>
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

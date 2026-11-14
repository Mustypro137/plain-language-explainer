import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const TOAST_MS = 3000
// A toast with a button (such as Undo) stays longer, so there is time to reach it.
const ACTION_MS = 6000
// The last part of that time is spent sliding out, so the total time on screen does not change.
const LEAVE_MS = 150
const ToastContext = createContext(() => {})

// toast('Saved') shows a message. toast('Deleted', { action: { label: 'Undo', onClick } }) adds a button.
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null) // { id, text, action }
  const [leaving, setLeaving] = useState(false)
  const timer = useRef()
  const leaveTimer = useRef()
  const nextId = useRef(0)

  const stopTimers = useCallback(() => {
    clearTimeout(timer.current)
    clearTimeout(leaveTimer.current)
  }, [])

  const startTimer = useCallback(
    (ms) => {
      stopTimers()
      setLeaving(false)
      leaveTimer.current = setTimeout(() => setLeaving(true), ms - LEAVE_MS)
      timer.current = setTimeout(() => setToast(null), ms)
    },
    [stopTimers],
  )

  const show = useCallback(
    (text, { action } = {}) => {
      nextId.current += 1
      setToast({ id: nextId.current, text, action })
      startTimer(action ? ACTION_MS : TOAST_MS)
    },
    [startTimer],
  )

  useEffect(() => stopTimers, [stopTimers])

  // While the pointer or the keyboard is on the toast, it does not close (and comes back if leaving).
  const pause = () => {
    stopTimers()
    setLeaving(false)
  }
  const resume = () => startTimer(toast?.action ? ACTION_MS : TOAST_MS)

  function act() {
    stopTimers()
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
            className={`toast${leaving ? ' toast-leaving' : ''}`}
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

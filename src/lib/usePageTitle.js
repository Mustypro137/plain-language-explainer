import { useEffect } from 'react'

export const APP_NAME = 'Plain-Language Explainer'

// Each page names itself in the browser tab; the home page uses the app name alone.
export function usePageTitle(page) {
  useEffect(() => {
    document.title = page ? `${page} · ${APP_NAME}` : APP_NAME
  }, [page])
}

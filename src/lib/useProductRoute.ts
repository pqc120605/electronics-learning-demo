import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { PRODUCT_ROUTES, toAppRoute } from '../data/productRoutes'

/** Keep internal navigation in the app namespace when a page was opened there. */
export function useProductRoute() {
  const { pathname } = useLocation()
  return useCallback((path: string) => {
    if (!pathname.startsWith('/app')) return path
    return path === '/' ? PRODUCT_ROUTES.appHome : toAppRoute(path)
  }, [pathname])
}

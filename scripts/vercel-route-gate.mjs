export function getVercelRouteBlockers(config) {
  const rewrites = Array.isArray(config?.rewrites) ? config.rewrites : []
  const apiSource = '/api/:path*'
  const hasSingleApi = rewrites.filter(rewrite => rewrite?.source === apiSource).length === 1
  const first = rewrites[0]
  if (!hasSingleApi || first?.source !== apiSource) {
    return ['The Vercel /api rewrite must appear once, ahead of SPA rewrites.']
  }
  let target
  try { target = new URL(first.destination) } catch {}
  if (target?.protocol !== 'https:' || target.pathname !== '/:path*' || target.username || target.password ||
      target.search || target.hash || target.hostname === 'mach-mo.vercel.app') {
    return ['The Vercel /api rewrite must point to a separate HTTPS upstream and preserve :path*.']
  }
  return []
}

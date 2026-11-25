import { next } from '@vercel/functions'
import { EDGE_CLIENT_HEADER, makeEdgeClientProof } from './server/api/edge-client-proof.mjs'

export const config = { matcher: ['/api/:path*'], runtime: 'nodejs' }

export default function middleware(request: Request) {
  const key = process.env.MACHMO_EDGE_PROXY_HMAC
  if (process.env.VERCEL_ENV !== 'production' || !key) return next()
  const headers = new Headers(request.headers)
  headers.delete(EDGE_CLIENT_HEADER)
  const address = headers.get('x-vercel-forwarded-for')
  const proof = address && makeEdgeClientProof(key, address, request.method, new URL(request.url).pathname)
  if (proof) headers.set(EDGE_CLIENT_HEADER, proof)
  return next({ request: { headers } })
}

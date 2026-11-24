import { pathToFileURL } from 'node:url'

const basePaths = [
  '/health', '/session', '/session/logout',
  '/auth/login/google', '/auth/login/github', '/auth/callback/google', '/auth/callback/github', '/account',
  '/community/*', '/feedback', '/analytics/events',
  '/projects', '/projects/*', '/classes', '/classes/*',
  '/admin/summary', '/admin/ai', '/admin/community', '/admin/system',
  '/admin/feedback', '/admin/sites', '/admin/sites/*', '/site-metrics/*',
]
const aiPaths = ['/guide-ai/status', '/guide-ai/chat', '/guide-ai/feedback']
const unavailableJson = '`{"state":"unavailable","model":"lookup"}`'

export function renderProductionEdge({ aiEnabled = false, compilerEnabled = false } = {}) {
  const paths = aiEnabled ? [...basePaths, ...aiPaths] : basePaths
  const unavailableAi = aiEnabled ? '' : `
	@aiStatus {
		method GET
		path /guide-ai/status
	}
	handle @aiStatus {
		header Content-Type application/json
		header Cache-Control no-store
		respond ${unavailableJson} 200
	}`
  const compiler = compilerEnabled ? `
	@compiler path /tools/arduino/status /tools/arduino/compile
	handle @compiler {
		rewrite * /api{uri}
		reverse_proxy 127.0.0.1:8285 {
			header_up Host mach-mo.vercel.app
		}
	}` : ''
  return `{
	admin off
	auto_https off
}
http://:8284 {
	bind 127.0.0.1
	@api {
		path ${paths.join(' ')}
		not path /community/moderation/*
	}${unavailableAi}${compiler}
	handle @api {
		rewrite * /api{uri}
		reverse_proxy 127.0.0.1:8281 {
			header_up Host mach-mo.vercel.app
		}
	}
	handle {
		respond 404
	}
}
`
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  if (new Set(args).size !== args.length || args.some(arg => !['--enable-ai', '--enable-compiler'].includes(arg))) {
    throw new Error('Usage: node production-edge.mjs [--enable-ai] [--enable-compiler]')
  }
  process.stdout.write(renderProductionEdge({
    aiEnabled: args.includes('--enable-ai'), compilerEnabled: args.includes('--enable-compiler'),
  }))
}

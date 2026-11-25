import { pathToFileURL } from 'node:url'
import { readFileSync } from 'node:fs'

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
const compilerPaths = ['/tools/arduino/status', '/tools/arduino/compile']

export function readProductionEdgeFeatures(config) {
  const apiLine = config.match(/^\s*path (\/health [^\r\n]*)$/m)?.[1]
  if (!apiLine || !config.includes('reverse_proxy 127.0.0.1:8281')) throw new Error('Cannot recognize the existing production edge.')
  const apiPaths = apiLine.split(/\s+/)
  const aiCount = aiPaths.filter(path => apiPaths.includes(path)).length
  const compiler = config.match(/^\s*@compiler path ([^\r\n]*)$/m)?.[1]?.split(/\s+/)
  if ((aiCount !== 0 && aiCount !== aiPaths.length)
      || (compiler && (!compilerPaths.every(path => compiler.includes(path)) || !config.includes('reverse_proxy 127.0.0.1:8285')))
      || (!compiler && compilerPaths.some(path => config.includes(path)))) {
    throw new Error('The existing production edge has incomplete AI or compiler routing.')
  }
  return { aiEnabled: aiCount !== 0, compilerEnabled: Boolean(compiler) }
}

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
	@compiler path ${compilerPaths.join(' ')}
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
(apiUpstream) {
	rewrite * /api{uri}
	reverse_proxy 127.0.0.1:8281 {
		header_up Host mach-mo.vercel.app
	}
}
http://:8284 {
	bind 127.0.0.1
	@api {
		path ${paths.join(' ')}
		not path /community/moderation/*
	}${unavailableAi}${compiler}
	@moderationQueue {
		method GET
		path /community/moderation/reports
	}
	@moderationWrite {
		method PATCH
		path_regexp reportPath ^/community/moderation/reports/[^/]+$
	}
	handle @moderationQueue {
		import apiUpstream
	}
	handle @moderationWrite {
		import apiUpstream
	}
	handle @api {
		import apiUpstream
	}
	handle {
		respond 404
	}
}
`
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  if (args.length === 2 && args[0] === '--read') {
    const { aiEnabled, compilerEnabled } = readProductionEdgeFeatures(readFileSync(args[1], 'utf8'))
    process.stdout.write(`${Number(aiEnabled)} ${Number(compilerEnabled)}\n`)
    process.exit(0)
  }
  if (new Set(args).size !== args.length || args.some(arg => !['--enable-ai', '--enable-compiler'].includes(arg))) {
    throw new Error('Usage: node production-edge.mjs [--enable-ai] [--enable-compiler]')
  }
  process.stdout.write(renderProductionEdge({
    aiEnabled: args.includes('--enable-ai'), compilerEnabled: args.includes('--enable-compiler'),
  }))
}

export const legacySupabaseEnabled = import.meta.env.VITE_MACHMO_LEGACY_SUPABASE === 'true'
export const selfHostedOAuthEnabled = !legacySupabaseEnabled && import.meta.env.VITE_MACHMO_SELF_HOSTED_OAUTH === 'true'
export const siteFeedbackEnabled = selfHostedOAuthEnabled && import.meta.env.VITE_MACHMO_SITE_FEEDBACK === 'true'

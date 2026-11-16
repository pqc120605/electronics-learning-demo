# Online community repository and bounded image/file attachments

Date 2026-11-16 · MM-SW-COMMUNITY-ATTACH-001

User approved the in-chat four-feature design, requires online community, and will create/connect Supabase from our setup package.

Acceptance:
- Max5 attachments,10MiB/file,25MiB/post; local image preview/remove/download and truthful persistence
- Actual remote adapter uses existing Supabase client, authenticated writes, public reads, no service-role/frontend secret
- SQL package enforces ownership, published visibility, upload bounds/path rules; no remote apply/deploy
- Keep old local posts and drafts; failures retain compose input, avoid dangling/unpublished public files
- No configured backend yet: founder setup guide complete; actual live cross-user verification NOT_RUN until setup
- No added dependency; focused Node/browser contract cases and independent QA

Allowed paths are recorded in the canonical queue. Preserve all unrelated changes. No dependency installation, Claude, hardware, credential access or remote deployment. Node/npm.cmd on Windows. Lead owns queue and final status; QA reviews a frozen hash snapshot. Backend live verification cannot be claimed until founder setup.

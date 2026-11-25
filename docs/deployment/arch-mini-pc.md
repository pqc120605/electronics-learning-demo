# Arch Linux mini PC deployment

Target supplied by user: Arch Linux, Intel i5-7500, 4 GB RAM, 256 GB SSD. Public access desired; no domain yet.

On 2026-11-17 the reviewed release was deployed and tested from the Internet through a Cloudflare Quick Tunnel. See [deployment evidence](../agents/runs/MM-ARCH-DEPLOY-20261117/report.md) for the active layout, verification and commands for that installation. The `/srv/mach-mo` setup below is a system-wide alternative.

The branded demo URL is `https://machmo.tail3b04e8.ts.net/`. Tailscale Funnel proxies only the Caddy web origin at `http://127.0.0.1:8080`. It was configured with `funnel --bg`, and `mach-mo-tailscaled.service` and `mach-mo-web.service` are enabled under `volnexus` with linger. See [Funnel deployment evidence](../agents/runs/MM-ARCH-DEPLOY-20261117/funnel.md).

## Release artifact

Build on the development machine, not the 4 GB server. On Windows:

```powershell
npm.cmd run audit:spice-engine
npm.cmd run check:public-release
npm.cmd run build:public
```

Stop if the gate fails. Never upload a `build:local` artifact as a release. Copy the complete resulting `dist/`, including `/licenses/ngspice-selfbuild` source/relink materials, without any `.env`, repository or credentials. Keep releases in separate timestamped directories under `/srv/mach-mo/releases/` and use `/srv/mach-mo/current` as a symlink to the active release for rollback.

## Mini PC preparation

First collect `uname -m`, `ip -brief address`, and `systemctl is-active sshd`. Do not send passwords or private keys into chat. From the physical terminal, Arch packages can be installed with:

```bash
sudo pacman -Syu --needed caddy cloudflared openssh
sudo systemctl enable --now sshd
sudo install -d -m 755 /srv/mach-mo/releases
```

Transfer the release from the development machine over the local network using SSH/SCP, using the actual Linux username/IP. Upload to that user's home directory first, then place the extracted release under `/srv/mach-mo/releases/`. Make website files readable by Caddy; do not make the deployment directory writable by the web process. Do not overwrite an existing Caddy configuration without inspecting it first.

## Caddy static hosting

Proposed `/etc/caddy/Caddyfile` for a dedicated machine, after reviewing any existing configuration:

```caddyfile
http://127.0.0.1:8080 {
    root * /srv/mach-mo/current
    encode zstd gzip
    header X-Content-Type-Options nosniff
    header /vendor/* Cache-Control "no-cache"
    header /cad/*.step Access-Control-Allow-Origin https://3dviewer.net
    @static path /assets/* /vendor/* /licenses/* /models/* /cad/*
    handle @static {
        file_server
    }
    handle {
        try_files {path} /index.html
        file_server
    }
}
```

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
sudo systemctl reload caddy
curl -I http://127.0.0.1:8080/
curl -I http://127.0.0.1:8080/vendor/eecircuit-engine/spice.wasm
```

Verify WASM returns `application/wasm`, SPA direct links such as `/app/tools/spice` load, and all license/source URLs remain downloadable. The hosted Arduino compiler and other Node API features use the [Mini PC API setup](mini-pc-api.md). Keep the Vite development middleware on localhost.

## Internet access without a domain

For a temporary external acceptance test, after the release gate passes:

```bash
cloudflared tunnel --url http://127.0.0.1:8080
```

Open the generated HTTPS `trycloudflare.com` URL using a phone on mobile data, test the home page, deep links and SPICE. This is a temporary test URL, not a permanent service address; it changes when the tunnel is restarted and Quick Tunnels have no uptime guarantee. Do not submit tunnel credentials into chat.

For permanent hosting, acquire a domain, configure it on Cloudflare and create a named tunnel mapped to `http://127.0.0.1:8080`. Run `cloudflared` as a systemd service. This route requires outbound connectivity, not router inbound ports or a public home IP.

Guest projects remain stored in each browser/origin, not on the mini PC. Export/backup existing drafts before changing from localhost or a temporary URL to a permanent domain; changing origin does not migrate browser storage automatically. Server availability depends on power, home uplink and tunnel service availability.

Sources checked 2026-11-17: [Arch Caddy package](https://archlinux.org/packages/extra/x86_64/caddy/), [Cloudflare Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/), [Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/).

# Tailscale Funnel demo deployment

On 2026-11-17, published the existing Caddy site via Tailscale Funnel at `https://machmo.tail3b04e8.ts.net/`. The account owner approved device registration and Funnel. The URL is for the free demo phase.

Tailscale 1.104.7 was installed from the vendor's static amd64 package and checked against its published SHA-256. `mach-mo-tailscaled.service` runs in userspace as `volnexus`. Its state is under `~/.local/share/mach-mo/tailscale`, and its local control socket is at `$XDG_RUNTIME_DIR/mach-mo-tailscale/tailscaled.sock`. Both Tailscale and Caddy user services are active and enabled. Funnel runs persistently with `--bg`, forwarding only `http://127.0.0.1:8080`.

Google and Cloudflare public DNS resolvers returned the Funnel relay IPv4 addresses. The Windows test host initially failed to resolve the new hostname with its default resolver, so HTTPS and Chromium checks used an address from public DNS while keeping the hostname and certificate validation. The home page, SPICE deep link and source manifest returned HTTP 200. Chromium completed both SPICE probe tests, including the WASM download, divider voltage/current and transient cursor. A separate 18-second curl download timed out after receiving part of the WASM. Actual reboot was not tested.

To inspect the route on the mini PC, run:

```bash
"$HOME/.local/share/mach-mo/tailscale/bin/tailscale" --socket="$XDG_RUNTIME_DIR/mach-mo-tailscale/tailscaled.sock" funnel status
```

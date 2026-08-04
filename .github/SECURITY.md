# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Mitch-Jelly, please report it privately rather than opening a public issue.

**Contact:** Create a [Security Advisory](https://github.com/mitchelljfranklin/mitch-jelly/security/advisories/new) on GitHub.

We aim to acknowledge reports within 48 hours and provide a resolution timeline within 5 business days.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x (latest) | Yes |
| 1.x (Aperture) | No |

## Security Model

Mitch-Jelly is a client-side Jellyfin web application. It communicates directly with your Jellyfin server and optionally with a Seerr instance.

### Deployment Recommendations

1. **Run over HTTPS** — Modern browsers block mixed content. Always use HTTPS for production deployments.
2. **Use a reverse proxy** — Nginx, Caddy, or Cloudflare Tunnel to add TLS and hide your Jellyfin server.
3. **Keep dependencies updated** — Run `bun install` regularly to patch known vulnerabilities.
4. **Restrict Seerr proxy** — The built-in Seerr proxy validates URLs to prevent SSRF. Ensure your Seerr instance is not exposed publicly without authentication.
5. **Set `DEFAULT_SERVER_URL`** — Pre-fills the server URL on the login page but does not restrict which servers users can connect to.

### Known Architecture Decisions

- **Jellyfin AccessToken in URLs** — HLS streaming requires the token in stream URLs (Jellyfin architectural requirement). All other endpoints use header-based auth.
- **Cookie security** — Auth cookies use `httpOnly`, `Secure`, and `SameSite=Lax` attributes.
- **No backend** — Mitch-Jelly is purely a frontend. No user data is stored server-side beyond session cookies.

## Scope

The following are in scope for bug bounty / responsible disclosure:

- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Server-side request forgery (SSRF) via the Seerr proxy
- Authentication bypass
- Information disclosure
- Remote code execution

The following are **out of scope**:

- Vulnerabilities in self-hosted Jellyfin/Seerr instances
- Clickjacking on pages without sensitive actions
- Missing security headers rated below Medium severity
- Vulnerabilities requiring physical access to the user's machine
- Social engineering attacks
- Denial of service

## Acknowledgments

We appreciate the security community's help in keeping Mitch-Jelly safe. Researchers who responsibly disclose valid vulnerabilities will be credited here.

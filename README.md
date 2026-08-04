# Mitch-Jelly

**A Modern, Streamlined Jellyfin Client built with Next.js**

Mitch-Jelly is a clean, modern Jellyfin client designed for speed, simplicity, and elegance. Born from the solid foundation of Aperture (originally built upon Finetic), Mitch-Jelly extends functionality with improved performance, watch status tracking, library management, and a customizable interface.

## Features

- **Rich Media Experience** — Native support for Video Backdrops, Theme Songs, and Trickplay thumbnails
- **Smart Connectivity** — Quick Connect login support and intelligent Direct Play/Transcoding selection
- **Watch Status Tracking** — Mark items watched/unwatched from anywhere: cards, episode lists, hero carousel, and detail pages
- **Advanced Library Support** — Collections (Box Sets), Live TV, paginated loading with infinite scroll for large libraries
- **Customizable Branding** — Admins can set a custom app name via Settings
- **Theming** — Multiple theme variations including "Cinematic Theatre Black", "Neon Grid", and more
- **Redesigned Playback Engine** — Seamless streaming aligned with Jellyfin best practices
- **Hero Media Bar** — Visually striking carousel showcasing highlighted content
- **Smart Episodic Features** — Intro and Outro skipping for effortless binge-watching (requires the Intro Skipper plugin)
- **Mini Player** — Keep watching while browsing with Picture-in-Picture mode
- **Seerr Integration** — Built-in support for Jellyseerr/Overseerr for content discovery and requests
- **Performance** — 5-minute local caching, skeleton loading, paginated fetches, and infinite scroll for snappy UX

## Built With

- **Frontend**: Next.js 16, React 19, TypeScript ~5.9
- **Styling**: Tailwind v4, shadcn/ui, Framer Motion
- **State Management**: Jotai
- **Package Manager**: Bun
- **Media Backend**: Jellyfin Server API, Seerr OpenAPI

## Getting Started

### Environment Variables

```env
DEFAULT_SERVER_URL=your_jellyfin_server_url
```

### Local Development

```bash
bun install
bun dev
```

Visit `http://localhost:3000` and sign in with your Jellyfin instance credentials. Hot reloading is enabled by default.

### Production Build

```bash
bun build
bun start
```

### Docker

```bash
docker build -t mitch-jelly .
docker run -d -p 3000:3000 --name mitch-jelly --restart unless-stopped mitch-jelly
```

Or with docker-compose:

```yaml
services:
  mitch-jelly:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DEFAULT_SERVER_URL=${DEFAULT_SERVER_URL}
    restart: unless-stopped
```

### Public HTTP Jellyfin Servers

Modern browsers block requests from HTTPS sites to public HTTP endpoints. To use Mitch-Jelly with a public server:

1. Add HTTPS to your Jellyfin instance (Let's Encrypt, reverse proxy, Cloudflare tunnel, etc.), or
2. Run Mitch-Jelly locally (bun dev, Docker) over HTTP

LAN/private IPs (192.168.x.x, 10.x.x.x, etc.) generally work over HTTP.

## Credits

Mitch-Jelly is based on [Aperture](https://github.com/akhilmulpurii/aperture) by Akhil Mulpuri, which was built upon [Finetic](https://github.com/AyaanZaveri/finetic) by Ayaan Zaveri.

export interface Env {
  ASSETS: Fetcher
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60"
    }
  })
}

function assetRequest(req: Request, url: URL, pathname: string): Request {
  return new Request(new URL(pathname, url), req)
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    const { pathname } = url

    if (pathname === "/health") {
      return new Response("ok", {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store"
        }
      })
    }

    if (pathname === "/api/preview") {
      return json({
        ok: true,
        name: "Zzza",
        tagline: "Feed AI just the right slice.",
        site: url.origin,
        previewImage: `${url.origin}/assets/images/pizza_cat3-BG.png`
      })
    }

    if (pathname === "/og.png" || pathname === "/preview.png") {
      return env.ASSETS.fetch(
        assetRequest(req, url, "/assets/images/pizza_cat3-BG.png")
      )
    }

    if (pathname === "/" || pathname === "/index" || pathname === "/index.html") {
      return env.ASSETS.fetch(
        assetRequest(req, url, "/index.html")
      )
    }

    if (pathname === "/docs") {
      return env.ASSETS.fetch(
        assetRequest(req, url, "/docs.html")
      )
    }

    if (pathname === "/install") {
      return env.ASSETS.fetch(
        assetRequest(req, url, "/install.html")
      )
    }

    return env.ASSETS.fetch(req)
  }
}
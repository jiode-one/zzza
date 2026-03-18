export interface Env {
  ASSETS: Fetcher
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  })
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)

    // tiny health endpoint for CI / sanity checks
    if (url.pathname === "/health") {
      return new Response("ok", {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store"
        }
      })
    }

    // example preview metadata endpoint
    if (url.pathname === "/api/preview") {
      return json({
        ok: true,
        name: "Zzza",
        tagline: "Feed AI just the right slice.",
        site: url.origin,
        previewImage: `${url.origin}/assets/images/pizza_cat3-BG.png`
      })
    }

    // example simple thumbnail alias
    if (url.pathname === "/og.png" || url.pathname === "/preview.png") {
      return env.ASSETS.fetch(
        new Request(new URL("/assets/images/pizza_cat3-BG.png", url.origin).toString(), req)
      )
    }

    // optional convenience: serve index.html for "/"
    if (url.pathname === "/") {
      return env.ASSETS.fetch(
        new Request(new URL("/index.html", url.origin).toString(), req)
      )
    }

    // everything else falls through to your static site
    return env.ASSETS.fetch(req)
  }
}
const SITE_PASSWORD = "roost2026";
const COOKIE_NAME = "roost_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function loginPage(error?: string) {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Talos</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; }
    .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; width: 100%; max-width: 360px; }
    h1 { font-size: 1.25rem; margin-bottom: 0.25rem; }
    p { font-size: 0.875rem; color: #94a3b8; margin-bottom: 1.5rem; }
    input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #334155; border-radius: 0.5rem; background: #0f172a; color: #e2e8f0; font-size: 1rem; outline: none; }
    input:focus { border-color: #3b82f6; }
    button { width: 100%; padding: 0.75rem; border: none; border-radius: 0.5rem; background: #3b82f6; color: white; font-size: 1rem; font-weight: 500; cursor: pointer; margin-top: 0.75rem; }
    button:hover { background: #2563eb; }
    .error { color: #f87171; font-size: 0.875rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <form class="card" method="POST">
    <h1>Talos</h1>
    <p>Enter the password to continue.</p>
    ${error ? `<div class="error">${error}</div>` : ""}
    <input type="password" name="password" placeholder="Password" autofocus required />
    <button type="submit">Enter</button>
  </form>
</body>
</html>`,
    {
      status: error ? 401 : 200,
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    }
  );
}

function getCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get("Cookie") || "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

// --- OG meta tag injection for dealer pages ---

const NON_DEALER_PREFIXES = new Set([
  '', 'demos', 'login', 'signup', 'forgot-password', 'reset-password', 'dashboard', 'api',
  'terms', 'privacy',
]);

interface DealerOGData {
  name: string
  slug: string
  logo?: string
  city?: string
  state?: string
  heroImage?: string
  heroSubtitle?: string
  heroSlides?: Array<{ image: string }>
}

function getDealerSlug(pathname: string): string | null {
  if (pathname.includes('.')) return null;
  const first = pathname.split('/').filter(Boolean)[0];
  if (!first || first.startsWith('_') || NON_DEALER_PREFIXES.has(first)) return null;
  return first;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function fetchDealerData(slug: string, apiUrl: string): Promise<DealerOGData | null> {
  const url = `${apiUrl}/dealers/${slug}`;
  const cache = (caches as any).default as Cache;
  const cacheKey = new Request(url);
  const cached = await cache.match(cacheKey);
  if (cached) return cached.json();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const dealer: DealerOGData = await res.json();
    await cache.put(cacheKey, new Response(JSON.stringify(dealer), {
      headers: { 'Cache-Control': 's-maxage=300' },
    }));
    return dealer;
  } catch {
    return null;
  }
}

class MetaTagInjector implements HTMLRewriterElementContentHandlers {
  private dealer: DealerOGData;
  private pageUrl: string;

  constructor(dealer: DealerOGData, pageUrl: string) {
    this.dealer = dealer;
    this.pageUrl = pageUrl;
  }

  element(element: Element) {
    const d = this.dealer;
    const location = d.city && d.state ? ` in ${d.city}, ${d.state}` : '';
    const title = `${d.name}${location}`;
    const description = d.heroSubtitle || `Shop powersports and marine at ${d.name}${location}.`;
    const image = d.logo || d.heroSlides?.[0]?.image || d.heroImage || '';

    const tags = [
      `<meta property="og:title" content="${escapeAttr(title)}" />`,
      `<meta property="og:description" content="${escapeAttr(description)}" />`,
      image && `<meta property="og:image" content="${escapeAttr(image)}" />`,
      `<meta property="og:url" content="${escapeAttr(this.pageUrl)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="Talos" />`,
      `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
      `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
      `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
      image && `<meta name="twitter:image" content="${escapeAttr(image)}" />`,
      `<meta name="description" content="${escapeAttr(description)}" />`,
    ].filter(Boolean);

    element.append(tags.join('\n'), { html: true });
  }
}

class TitleRewriter implements HTMLRewriterElementContentHandlers {
  private title: string;
  constructor(title: string) { this.title = title; }
  text(text: Text) {
    if (text.text.trim()) text.replace(this.title);
  }
}

async function serveWithOGTags(context: EventContext<{ API_URL?: string }, any, any>): Promise<Response> {
  const url = new URL(context.request.url);
  const slug = getDealerSlug(url.pathname);

  if (!slug) return context.next();

  const apiUrl = (context.env as any).API_URL || 'https://api.talosdealer.com/api';
  const [dealer, response] = await Promise.all([
    fetchDealerData(slug, apiUrl),
    context.next(),
  ]);

  if (!dealer) return response;

  const location = dealer.city && dealer.state ? ` in ${dealer.city}, ${dealer.state}` : '';
  const title = `${dealer.name}${location}`;

  return new HTMLRewriter()
    .on('head', new MetaTagInjector(dealer, url.href))
    .on('title', new TitleRewriter(title))
    .transform(response);
}

export const onRequest: PagesFunction = async (context) => {
  return serveWithOGTags(context); // password gate temporarily disabled
  const { request } = context;

  // POST = password submission
  if (request.method === "POST") {
    const formData = await request.formData();
    const password = formData.get("password");

    if (password === SITE_PASSWORD) {
      const url = new URL(request.url);
      return new Response(null, {
        status: 302,
        headers: {
          Location: url.origin + url.pathname,
          "Set-Cookie": `${COOKIE_NAME}=1; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
        },
      });
    }

    return loginPage("Wrong password.");
  }

  // Check for auth cookie
  if (getCookie(request, COOKIE_NAME) === "1") {
    return serveWithOGTags(context);
  }

  // No cookie = show login
  return loginPage();
};

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

export const onRequest: PagesFunction = async (context) => {
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
    return context.next();
  }

  // No cookie = show login
  return loginPage();
};

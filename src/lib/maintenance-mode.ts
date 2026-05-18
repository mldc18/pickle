type MaintenanceEnv = Record<string, string | undefined>;

type MaintenanceConfig = {
  enabled: boolean;
  title: string;
  message: string;
  retryAfterSeconds: number;
};

const DEFAULT_TITLE = "LAMPA is taking a short break";
const DEFAULT_MESSAGE = "We are doing a quick maintenance pass. Please check back soon.";
const DEFAULT_RETRY_AFTER_SECONDS = 600;

export function isMaintenanceModeEnabled(value: string | undefined): boolean {
  if (value === undefined) return true;
  return value !== "0" && value.toLowerCase() !== "false";
}

export function getMaintenanceModeConfig(env: MaintenanceEnv): MaintenanceConfig {
  const retryAfter = Number(env.MAINTENANCE_RETRY_AFTER);

  return {
    enabled: isMaintenanceModeEnabled(env.MAINTENANCE_MODE ?? env.NEXT_PUBLIC_MAINTENANCE_MODE),
    title: env.MAINTENANCE_TITLE || DEFAULT_TITLE,
    message: env.MAINTENANCE_MESSAGE || DEFAULT_MESSAGE,
    retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.round(retryAfter)
      : DEFAULT_RETRY_AFTER_SECONDS,
  };
}

export function getMaintenanceResponse(config: Omit<MaintenanceConfig, "enabled">): Response {
  const title = escapeHtml(config.title);
  const message = escapeHtml(config.message);

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f8faf8;
        color: #17231b;
      }
      main {
        width: min(100%, 420px);
        text-align: center;
      }
      img {
        width: 76px;
        height: 76px;
        border-radius: 999px;
        object-fit: cover;
        margin-bottom: 22px;
      }
      h1 {
        margin: 0;
        font-size: clamp(28px, 8vw, 40px);
        line-height: 1;
        letter-spacing: 0;
      }
      p {
        margin: 16px 0 0;
        color: #5d6b61;
        font-size: 16px;
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <main>
      <img src="/lampa-logo.webp" alt="LAMPA" />
      <h1>${title}</h1>
      <p>${message}</p>
    </main>
  </body>
</html>`,
    {
      status: 503,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "retry-after": String(config.retryAfterSeconds),
      },
    },
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

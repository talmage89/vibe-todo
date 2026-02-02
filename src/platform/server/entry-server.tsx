import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import logixlysia from "logixlysia";
import { renderToString } from "react-dom/server";
import { App } from "~/app";
import { registerApiRoutes } from "~/platform/api/routes";
import { registerGithubOAuth } from "~/platform/auth/github";
import { registerGoogleOAuth } from "~/platform/auth/google";
import { createAppRouter } from "~/platform/router/router";
import { env } from "~/platform/utils/env";

const { PORT: port } = env();

const app = new Elysia();

app.use(logixlysia({ config: { showStartupMessage: false, useColors: false } }));
app.use(staticPlugin({ assets: "dist/public", prefix: "public" }));

registerGoogleOAuth(app);
registerGithubOAuth(app);

// Register protected API routes
registerApiRoutes(app);

const HTML = (children: React.ReactNode) => (
  <html lang="en">
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Todo App</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
      />
      <link rel="stylesheet" href="/public/styles.css" />
    </head>
    <body>
      <div id="root">{children}</div>
      <script type="module" src="/public/entry-client.js"></script>
    </body>
  </html>
);

app.get("*", async ({ request }) => {
  const url = new URL(request.url);
  const router = createAppRouter(`${url.pathname}${url.search}`);
  await router.load();

  const html = renderToString(HTML(<App router={router} />));
  return new Response(`<!DOCTYPE html>${html}`, { headers: { "Content-Type": "text/html" } });
});

app.listen(port);
console.log(`Server running at http://localhost:${port}`);

import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import logixlysia from "logixlysia";
import { renderToString } from "react-dom/server";
import { App } from "~/app";
import { registerGithubOAuth, registerGoogleOAuth } from "~/platform/auth";
import { env } from "~/platform/utils/env";

const { PORT: port } = env();

const app = new Elysia();

app.use(logixlysia({ config: { showStartupMessage: false, useColors: false } }));
app.use(staticPlugin({ assets: "dist/public", prefix: "public" }));

registerGoogleOAuth(app);
registerGithubOAuth(app);

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

app.get("*", ({ path: _path }) => {
  const html = renderToString(HTML(<App />));
  return new Response(`<!DOCTYPE html>${html}`, { headers: { "Content-Type": "text/html" } });
});

app.listen(port);
console.log(`Server running at http://localhost:${port}`);

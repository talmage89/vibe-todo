import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import { renderToString } from "react-dom/server";
import { App } from "~/app";
import { registerGoogleOAuth, registerLogout } from "~/platform/auth";
import { env } from "~/platform/utils/env";

const { PORT: port } = env();

const app = new Elysia();

app.use(
  staticPlugin({
    assets: "dist/public",
    prefix: "public",
  }),
);

// Register auth routes
registerGoogleOAuth(app);
registerLogout(app);

const HTML = (children: React.ReactNode) => (
  <html lang="en">
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Todo App</title>
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

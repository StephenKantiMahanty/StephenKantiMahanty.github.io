## Website

<<<<<<< HEAD
## Secret projects

Click the voltage readout at the bottom of the homepage (initially `5.0V`) to open `/secret/`. Circular, Schematic Maker (`/cad-machining/`), Upload, and Abyss / Kalman Lab (`/kalman/`) appear as cards that open their projects in new tabs. The voltage slider remains independent of the link.

## Abyss / Kalman Lab

The standalone activity at `/kalman/` runs a genuine depth/vertical-velocity Kalman filter with seeded fixes, four mission scenarios, actual versus assumed noise controls, same-data baseline comparison, worked corrections, and a finite mission debrief. Inspect time while paused, match exact actual noise variances, or predict what happens during dropout and check your answer. No build, CDN, dependencies, or backend is needed. Run `node kalman/preview.cjs`, then open `http://127.0.0.1:8314/kalman/` (or `/secret/` for the launch journey). Run `node --test tests/*.test.cjs` for numerical and existing-site regression checks. See `DELIVERY.md` for verification and model limitations.

Run `node --test tests/secret-projects.test.cjs` to check navigation, keyboard handling, card destinations, assets, and Worker routing.

## Private file uploads

The hidden page at `/upload/` accepts any file type up to 10 MB. The viewer shows raster image previews and a download link for every file, including PDFs, documents, ZIP archives, and CAD files.

This feature requires a Cloudflare Worker with the R2 binding `UPLOADS_BUCKET` (the existing `private-image-uploads` bucket can keep its name). File URLs (`/uploads/{id}/file`), metadata, and deletion are restricted to the uploading browser's session cookie. Existing `/uploads/{id}/image.png` links still work. Files retain their names and types and download as attachments; only passive raster images can render inline.

GitHub Pages serves the static pages but cannot run `worker.js` or store uploads. Publish the Worker and its assets with `npx wrangler deploy`. The routes in `wrangler.toml` send `kantimahanty.com/upload`, `/upload/*`, `/uploads/*`, and `/api/uploads*` to this Worker; the remaining site continues using GitHub Pages. These routes require the domain to be proxied through Cloudflare and the `private-image-uploads` R2 bucket to exist in the deploying account. The `run_worker_first` setting keeps upload pages, session cookies, viewer URLs, and API requests under Worker control. An HTML response from `/api/uploads` indicates the request reached a static host or an upstream error page instead of the upload API. Publishing to GitHub Pages alone does not deploy the Worker.

The viewer at `/uploads/{id}/` provides **Delete and close** and sends a best-effort deletion request when it closes. A browser crash or interrupted connection can prevent automatic deletion; **Delete now** on the upload page confirms deletion through the server.

Run `node --test tests/*.test.cjs` for the navigation and private-file regression tests. Run `node tests/private-upload-server.cjs` for a local preview using the actual Worker and an in-memory bucket; preview uploads are discarded when that server stops.
=======
So, you found the GitHub. There's not much interesting stuff here, so just visit the website [here](https://kantimahanty.com/). I promise it's really cool!
>>>>>>> af78994225066a34e56287fb9d76cfec6f7404a3

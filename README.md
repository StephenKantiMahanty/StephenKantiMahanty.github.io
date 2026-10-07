## Website

## Secret projects

Click the voltage readout at the bottom of the homepage (initially `5.0V`) to open `/secret/`. Circular, Schematic Maker (`/cad-machining/`), Upload, and Abyss / Underwater Navigation (`/kalman/`) appear as cards that open their projects in new tabs. The voltage slider remains independent of the link.

## Abyss / Underwater Navigation

The showcase at `/kalman/` fuses acoustic ranges, Doppler velocity, pressure depth, and global-frame inertial acceleration in a six-state extended Kalman filter. A Three.js mission scene, uPlot charts, and Motion transitions present four seeded scenarios: survey, acoustic blackout, multipath interference, and cross-current. Replay, camera presets, covariance visualization, benchmarks, and CSV export use the actual computed state.

Run `node kalman/preview.cjs`, then open `http://127.0.0.1:8314/kalman/`. The checked-in static assets work on GitHub Pages; no backend or CDN is needed. Run `node --test tests/*.test.cjs` for numerical, project, and existing-site checks. To rebuild the pinned UI libraries, run `npm ci --prefix work/kalman-showcase-tools`, then `node work/kalman-showcase-tools/build-vendor.cjs` from the repository root. See `DELIVERY.md` for results, assumptions, and verification.

Run `node --test tests/secret-projects.test.cjs` to check navigation, keyboard handling, card destinations, assets, and Worker routing.

## Private file uploads

The hidden page at `/upload/` accepts any file type up to 10 MB. The viewer shows raster image previews and a download link for every file, including PDFs, documents, ZIP archives, and CAD files.

This feature requires a Cloudflare Worker with the R2 binding `UPLOADS_BUCKET` (the existing `private-image-uploads` bucket can keep its name). File URLs (`/uploads/{id}/file`), metadata, and deletion are restricted to the uploading browser's session cookie. Existing `/uploads/{id}/image.png` links still work. Files retain their names and types and download as attachments; only passive raster images can render inline.

GitHub Pages serves the static pages but cannot run `worker.js` or store uploads. Publish the Worker and its assets with `npx wrangler deploy`. The routes in `wrangler.toml` send `kantimahanty.com/upload`, `/upload/*`, `/uploads/*`, and `/api/uploads*` to this Worker; the remaining site continues using GitHub Pages. These routes require the domain to be proxied through Cloudflare and the `private-image-uploads` R2 bucket to exist in the deploying account. The `run_worker_first` setting keeps upload pages, session cookies, viewer URLs, and API requests under Worker control. An HTML response from `/api/uploads` indicates the request reached a static host or an upstream error page instead of the upload API. Publishing to GitHub Pages alone does not deploy the Worker.

The viewer at `/uploads/{id}/` provides **Delete and close** and sends a best-effort deletion request when it closes. A browser crash or interrupted connection can prevent automatic deletion; **Delete now** on the upload page confirms deletion through the server.

Run `node --test tests/*.test.cjs` for the navigation and private-file regression tests. Run `node tests/private-upload-server.cjs` for a local preview using the actual Worker and an in-memory bucket; preview uploads are discarded when that server stops.
So, you found the GitHub. There's not much interesting stuff here, so just visit the website [here](https://kantimahanty.com/). I promise it's really cool!

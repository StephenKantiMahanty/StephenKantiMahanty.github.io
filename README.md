# Stephen Kanti Mahanty

## Secret projects

Click the voltage readout at the bottom of the homepage (initially `5.0V`) to open `/secret/`. Circular, Schematic Maker (`/cad-machining/`), and Upload appear as cards that open their projects in new tabs. The voltage slider remains independent of the link.

Run `node --test tests/secret-projects.test.cjs` to check navigation, keyboard handling, card destinations, assets, and Worker routing.

## Private image uploads

The site now includes a hidden upload page at `/upload/` for private image uploads.

This feature is designed for a Cloudflare Workers deployment with an R2 bucket binding named `UPLOADS_BUCKET`. Uploaded images are stored behind private URLs such as `/uploads/{id}/image.png`, and the viewer page at `/uploads/{id}/` deletes the image when the tab closes.

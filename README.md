# Stephen Kanti Mahanty

## Secret projects

Click the voltage readout at the bottom of the homepage (initially `5.0V`) to open `/secret/`. Circular, Schematic Maker (`/cad-machining/`), and Upload appear as cards that open their projects in new tabs. The voltage slider remains independent of the link.

Run `node --test tests/secret-projects.test.cjs` to check navigation, keyboard handling, card destinations, assets, and Worker routing.

## Private file uploads

The hidden page at `/upload/` accepts any file type up to 10 MB. The viewer shows raster image previews and a download link for every file, including PDFs, documents, ZIP archives, and CAD files.

This feature requires a Cloudflare Worker with the R2 binding `UPLOADS_BUCKET` (the existing `private-image-uploads` bucket can keep its name). File URLs (`/uploads/{id}/file`), metadata, and deletion are restricted to the uploading browser's session cookie. Existing `/uploads/{id}/image.png` links still work. Files retain their names and types and download as attachments; only passive raster images can render inline.

The viewer at `/uploads/{id}/` provides **Delete and close** and sends a best-effort deletion request when it closes. A browser crash or interrupted connection can prevent automatic deletion; **Delete now** on the upload page confirms deletion through the server.

Run `node --test tests/*.test.cjs` for the navigation and private-file regression tests. Run `node tests/private-upload-server.cjs` for a local preview using the actual Worker and an in-memory bucket; preview uploads are discarded when that server stops.

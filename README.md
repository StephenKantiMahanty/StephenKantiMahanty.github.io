# Stephen Kanti Mahanty

## Private image uploads

The site now includes a hidden upload page at `/upload/` for private image uploads.

This feature is designed for a Cloudflare Workers deployment with an R2 bucket binding named `UPLOADS_BUCKET`. Uploaded images are stored behind private URLs such as `/uploads/{id}/image.png`, and the viewer page at `/uploads/{id}/` deletes the image when the tab closes.

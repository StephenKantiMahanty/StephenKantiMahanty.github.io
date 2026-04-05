const viewerImage = document.getElementById('viewer-image');
const viewerStatus = document.getElementById('viewer-status');
const openRawButton = document.getElementById('open-raw-button');
const closeDeleteButton = document.getElementById('close-delete-button');

let deleteRequested = false;
openRawButton.disabled = true;
closeDeleteButton.disabled = true;

function getUploadId() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const uploadsIndex = segments.indexOf('uploads');
  if (uploadsIndex === -1 || uploadsIndex + 1 >= segments.length) {
    return null;
  }

  return segments[uploadsIndex + 1];
}

function requestDeletion() {
  if (deleteRequested) {
    return;
  }

  const id = getUploadId();
  if (!id) {
    return;
  }

  deleteRequested = true;
  const beacon = new Blob([''], { type: 'text/plain' });
  const deleteUrl = new URL(`../../api/uploads/${id}/delete`, window.location.href).toString();

  if (navigator.sendBeacon && navigator.sendBeacon(deleteUrl, beacon)) {
    return;
  }

  fetch(deleteUrl, {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
  });
}

async function loadImage() {
  const id = getUploadId();
  if (!id) {
    viewerStatus.textContent = 'Invalid viewer URL.';
    return;
  }

  const imageUrl = new URL(`../../uploads/${id}/image.png`, window.location.href).toString();
  openRawButton.disabled = false;
  closeDeleteButton.disabled = false;
  openRawButton.addEventListener('click', () => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  });

  viewerImage.addEventListener('load', () => {
    viewerStatus.textContent = 'Private image loaded. Close this tab to delete it.';
    viewerImage.hidden = false;
  });

  viewerImage.addEventListener('error', () => {
    viewerStatus.textContent = 'This private image is unavailable or has already been deleted.';
    viewerImage.hidden = true;
  });

  viewerImage.src = imageUrl;
}

closeDeleteButton.addEventListener('click', async () => {
  requestDeletion();
  window.close();
  viewerStatus.textContent = 'Deletion requested.';
});

window.addEventListener('pagehide', requestDeletion);
window.addEventListener('beforeunload', requestDeletion);

loadImage();

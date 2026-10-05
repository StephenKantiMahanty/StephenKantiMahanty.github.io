const viewerImage = document.getElementById('viewer-image');
const viewerStatus = document.getElementById('viewer-status');
const fileDetails = document.getElementById('viewer-file-details');
const downloadLink = document.getElementById('download-file-link');
const closeDeleteButton = document.getElementById('close-delete-button');

let deleteRequested = false;
let currentUpload = null;
closeDeleteButton.disabled = true;

function getUploadId() {
  return window.location.pathname.match(/^\/uploads\/([^/]+)\/?$/)?.[1] || null;
}

function requestDeletion() {
  if (deleteRequested || !currentUpload) {
    return;
  }

  deleteRequested = true;
  const beacon = new Blob([''], { type: 'text/plain' });
  const deleteUrl = currentUpload.deleteUrl;

  if (navigator.sendBeacon && navigator.sendBeacon(deleteUrl, beacon)) {
    return;
  }

  fetch(deleteUrl, {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
  }).catch(() => { deleteRequested = false; });
}

async function loadFile() {
  const id = getUploadId();
  if (!id) {
    viewerStatus.textContent = 'Invalid viewer URL.';
    return;
  }

  try {
    const response = await fetch(`/api/uploads/${encodeURIComponent(id)}`, { credentials: 'include' });
    if (!response.ok) throw new Error('This private file is unavailable or has already been deleted.');
    currentUpload = await response.json();
    fileDetails.textContent = `${currentUpload.name} — ${(currentUpload.size / 1024 / 1024).toFixed(2)} MB — ${currentUpload.contentType}`;
    downloadLink.href = currentUpload.fileUrl;
    downloadLink.download = currentUpload.name;
    downloadLink.classList.remove('hidden');
    closeDeleteButton.disabled = false;
    viewerStatus.textContent = 'Private file ready to download. Close this tab to request deletion.';

    if (currentUpload.previewable) {
      viewerImage.addEventListener('load', () => { viewerImage.hidden = false; });
      viewerImage.addEventListener('error', () => {
        viewerImage.hidden = true;
        viewerStatus.textContent = 'Image preview unavailable. Use Download file to save the original.';
      });
      viewerImage.src = `${currentUpload.fileUrl}?preview=1`;
    }
  } catch (error) {
    viewerStatus.textContent = error.message;
  }
}

closeDeleteButton.addEventListener('click', async () => {
  if (!currentUpload || deleteRequested) return;
  closeDeleteButton.disabled = true;
  deleteRequested = true;
  try {
    const response = await fetch(currentUpload.deleteUrl, {
      method: 'POST', credentials: 'include', keepalive: true,
    });
    if (!response.ok) throw new Error('Unable to delete the file. Please try again.');
    viewerImage.hidden = true;
    viewerImage.removeAttribute('src');
    downloadLink.classList.add('hidden');
    fileDetails.textContent = '';
    currentUpload = null;
    viewerStatus.textContent = 'File deleted. You can close this tab.';
    window.close();
  } catch (error) {
    deleteRequested = false;
    closeDeleteButton.disabled = false;
    viewerStatus.textContent = error.message;
  }
});

window.addEventListener('pagehide', requestDeletion);
window.addEventListener('beforeunload', requestDeletion);

loadFile();

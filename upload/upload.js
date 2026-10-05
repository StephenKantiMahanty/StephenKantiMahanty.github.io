const form = document.getElementById('upload-form');
const input = document.getElementById('file-input');
const fileSummary = document.getElementById('file-summary');
const statusMessage = document.getElementById('status-message');
const previewPanel = document.getElementById('preview-panel');
const previewImage = document.getElementById('preview-image');
const previewDetails = document.getElementById('preview-details');
const resultPanel = document.getElementById('result-panel');
const viewerUrlEl = document.getElementById('viewer-url');
const fileUrlEl = document.getElementById('file-url');
const openViewerButton = document.getElementById('open-viewer-button');
const deleteButton = document.getElementById('delete-button');
const dropzone = document.querySelector('.upload-dropzone');
const uploadApiUrl = new URL('../api/uploads', window.location.href);

let previewObjectUrl = null;
let currentUpload = null;
const maxUploadBytes = 10 * 1024 * 1024;
const previewTypes = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif', 'image/bmp']);

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? '#ff8b8b' : 'var(--accent-green)';
}

function clearPreviewObjectUrl() {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }
}

function copyText(text) {
  return navigator.clipboard.writeText(text);
}

function renderUploadResult(data) {
  currentUpload = data;
  viewerUrlEl.textContent = data.viewerUrl;
  fileUrlEl.textContent = data.fileUrl;
  resultPanel.classList.remove('hidden');
  openViewerButton.disabled = false;
  deleteButton.disabled = false;
}

function resetUploadResult(clearPreview = false) {
  currentUpload = null;
  viewerUrlEl.textContent = '';
  fileUrlEl.textContent = '';
  resultPanel.classList.add('hidden');
  openViewerButton.disabled = true;
  deleteButton.disabled = true;

  if (clearPreview) {
    clearPreviewObjectUrl();
    previewImage.removeAttribute('src');
    previewImage.hidden = true;
    previewDetails.textContent = '';
    previewPanel.classList.add('hidden');
    input.value = '';
    fileSummary.textContent = 'No file selected.';
  }
}

async function deleteCurrentUpload() {
  if (!currentUpload) {
    return;
  }

  const response = await fetch(currentUpload.deleteUrl, {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
  });

  if (!response.ok) {
    throw new Error('Unable to delete the uploaded file.');
  }

  resetUploadResult(true);
  setStatus('Upload deleted.', false);
}

input.addEventListener('change', () => {
  clearPreviewObjectUrl();
  previewImage.hidden = true;
  previewImage.removeAttribute('src');
  previewDetails.textContent = '';

  const [file] = input.files || [];
  if (!file) {
    fileSummary.textContent = 'No file selected.';
    previewPanel.classList.add('hidden');
    previewImage.removeAttribute('src');
    return;
  }

  fileSummary.textContent = `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  previewDetails.textContent = `${file.name} (${file.type || 'Unknown file type'})`;
  if (previewTypes.has(file.type)) {
    previewObjectUrl = URL.createObjectURL(file);
    previewImage.src = previewObjectUrl;
    previewImage.hidden = false;
  } else {
    previewDetails.textContent += ' — Download this file from the private viewer after uploading.';
  }
  previewPanel.classList.remove('hidden');
  setStatus(file.size > maxUploadBytes ? 'File is too large. Please keep it at or below 10 MB.' : 'File ready to upload.', file.size > maxUploadBytes);
});

previewImage.addEventListener('error', () => {
  previewImage.hidden = true;
  previewDetails.textContent = 'Image preview unavailable. You can still upload and download the file.';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const [file] = input.files || [];
  if (!file) {
    setStatus('Choose a file before uploading.', true);
    return;
  }
  if (file.size > maxUploadBytes) {
    setStatus('File is too large. Please keep it at or below 10 MB.', true);
    return;
  }

  const payload = new FormData();
  payload.append('file', file);

  form.querySelectorAll('button, input').forEach((control) => {
    control.disabled = true;
  });

  setStatus('Uploading file...');

  try {
    const response = await fetch(uploadApiUrl, {
      method: 'POST',
      body: payload,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed.');
    }

    renderUploadResult(data);
    setStatus('File uploaded successfully.');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    form.querySelectorAll('button, input').forEach((control) => {
      control.disabled = false;
    });
  }
});

document.querySelectorAll('[data-copy-target]').forEach((button) => {
  button.addEventListener('click', async () => {
    const target = document.getElementById(button.dataset.copyTarget);
    if (!target || !target.textContent) {
      return;
    }

    try {
      await copyText(target.textContent);
      setStatus('Link copied to clipboard.');
    } catch (error) {
      setStatus('Clipboard access failed.', true);
    }
  });
});

openViewerButton.addEventListener('click', () => {
  if (!currentUpload) {
    setStatus('Upload a file first.', true);
    return;
  }

  window.open(currentUpload.viewerUrl, '_blank', 'noopener,noreferrer');
});

deleteButton.addEventListener('click', async () => {
  try {
    await deleteCurrentUpload();
  } catch (error) {
    setStatus(error.message, true);
  }
});

dropzone.addEventListener('dragenter', () => dropzone.classList.add('drag-active'));
dropzone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropzone.classList.add('drag-active');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-active'));
dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('drag-active');

  if (input.disabled) return;

  const [file] = event.dataTransfer.files || [];
  if (!file) {
    return;
  }

  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
  input.dispatchEvent(new Event('change'));
});

resetUploadResult();
setStatus('Pick a file to begin.');

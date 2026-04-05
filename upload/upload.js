const form = document.getElementById('upload-form');
const input = document.getElementById('image-input');
const fileSummary = document.getElementById('file-summary');
const statusMessage = document.getElementById('status-message');
const previewPanel = document.getElementById('preview-panel');
const previewImage = document.getElementById('preview-image');
const resultPanel = document.getElementById('result-panel');
const viewerUrlEl = document.getElementById('viewer-url');
const imageUrlEl = document.getElementById('image-url');
const openViewerButton = document.getElementById('open-viewer-button');
const deleteButton = document.getElementById('delete-button');
const dropzone = document.querySelector('.upload-dropzone');
const uploadApiUrl = new URL('../api/uploads', window.location.href);

let previewObjectUrl = null;
let currentUpload = null;

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
  clearPreviewObjectUrl();
  viewerUrlEl.textContent = data.viewerUrl;
  imageUrlEl.textContent = data.imageUrl;
  previewImage.src = data.imageUrl;
  resultPanel.classList.remove('hidden');
  openViewerButton.disabled = false;
  deleteButton.disabled = false;
}

function resetUploadResult(clearPreview = false) {
  currentUpload = null;
  viewerUrlEl.textContent = '';
  imageUrlEl.textContent = '';
  resultPanel.classList.add('hidden');
  openViewerButton.disabled = true;
  deleteButton.disabled = true;

  if (clearPreview) {
    clearPreviewObjectUrl();
    previewImage.removeAttribute('src');
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
    throw new Error('Unable to delete the uploaded image.');
  }

  resetUploadResult(true);
  setStatus('Upload deleted.', false);
}

input.addEventListener('change', () => {
  clearPreviewObjectUrl();

  const [file] = input.files || [];
  if (!file) {
    fileSummary.textContent = 'No file selected.';
    previewPanel.classList.add('hidden');
    previewImage.removeAttribute('src');
    return;
  }

  fileSummary.textContent = `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  previewObjectUrl = URL.createObjectURL(file);
  previewImage.src = previewObjectUrl;
  previewPanel.classList.remove('hidden');
  setStatus('Preview ready.', false);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const [file] = input.files || [];
  if (!file) {
    setStatus('Choose an image before uploading.', true);
    return;
  }

  const payload = new FormData();
  payload.append('image', file);

  form.querySelectorAll('button, input').forEach((control) => {
    control.disabled = true;
  });

  setStatus('Uploading image...');

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
    setStatus('Image uploaded successfully.');
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
    setStatus('Upload an image first.', true);
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
setStatus('Pick an image to begin.');

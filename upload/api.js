async function readUploadApiResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The upload service is unavailable. Please try again later.');
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('The upload service returned an invalid response. Please try again.');
  }
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'The file request failed. Please try again.');
  }
  return data;
}

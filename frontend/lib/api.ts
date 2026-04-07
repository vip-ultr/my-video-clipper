import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 180000 // 3 minutes for video processing
});

// Video upload
export async function uploadVideo(file: File, projectName: string) {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('projectName', projectName);

  return apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// Watermark upload
export async function uploadWatermark(file: File) {
  const formData = new FormData();
  formData.append('watermark', file);
  return apiClient.post('/watermark/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// Get watermarks
export async function getWatermarks() {
  return apiClient.get('/watermark/list');
}

// Delete watermark
export async function deleteWatermark(watermarkId: string) {
  return apiClient.delete(`/watermark/${watermarkId}`);
}

// Create clip
export async function createClip(settings: any) {
  return apiClient.post('/clips/create', settings);
}

// Get clips for video
export async function getClipsForVideo(videoId: string) {
  return apiClient.get(`/clips/video/${videoId}`);
}

// Download clip
export async function downloadClip(clipId: string) {
  return apiClient.get(`/download/${clipId}`, {
    responseType: 'blob'
  });
}

// Get clip info
export async function getClipInfo(clipId: string) {
  return apiClient.get(`/download/${clipId}/info`);
}

// Get processing status
export async function getProcessingStatus(videoId: string) {
  return apiClient.get(`/processing/${videoId}`);
}

// Start analysis
export async function startAnalysis(videoId: string) {
  return apiClient.post(`/processing/${videoId}/analyze`);
}

// Health check
export async function healthCheck() {
  return apiClient.get('/health');
}

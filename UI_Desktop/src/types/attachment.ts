export type ContentType = 'text' | 'image' | 'file' | 'system';

export interface Attachment {
  file_id: string;
  url: string;
  name: string;
  size: number;
  mime_type: string;
  thumbnail_url?: string;
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

export const ALLOWED_FILE_EXTS = [
  ...ALLOWED_IMAGE_EXTS,
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'txt',
  'zip',
  'rar',
];

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function isAllowedFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ALLOWED_FILE_EXTS.includes(ext);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  result?: Attachment;
  error?: string;
}

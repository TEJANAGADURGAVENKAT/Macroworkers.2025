import { supabase } from "@/integrations/supabase/client";

export interface FileUploadResult {
  fileName: string;
  filePath: string;
  metadata?: {
    size: number;
    type: string;
    lastModified: number;
  };
}

export interface SubmissionProof {
  text?: string;
  files?: FileUploadResult[];
}

/**
 * Upload a file to Supabase Storage for task submissions
 */
export async function uploadSubmissionFile(
  file: File, 
  workerId: string
): Promise<FileUploadResult> {
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `${workerId}/${fileName}`;
  
  const { error } = await supabase.storage
    .from('submission-files')
    .upload(filePath, file);

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return {
    fileName,
    filePath,
    metadata: {
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    }
  };
}

/**
 * Get signed URL for a submission file
 */
export async function getSubmissionFileUrl(
  workerId: string, 
  fileName: string, 
  expirySeconds: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('submission-files')
    .createSignedUrl(`${workerId}/${fileName}`, expirySeconds);

  if (error) {
    throw new Error(`Failed to get file URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Validate submission proof
 */
export function validateSubmissionProof(proof: SubmissionProof): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!proof.text && (!proof.files || proof.files.length === 0)) {
    errors.push('At least one proof (text or file) is required');
  }

  if (proof.text && proof.text.trim().length < 10) {
    errors.push('Text proof must be at least 10 characters long');
  }

  if (proof.files && proof.files.length > 5) {
    errors.push('Maximum 5 files allowed per submission');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get file type from filename
 */
export function getFileType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
    return 'image';
  }
  if (['pdf'].includes(extension || '')) {
    return 'pdf';
  }
  if (['doc', 'docx'].includes(extension || '')) {
    return 'document';
  }
  if (['txt', 'md'].includes(extension || '')) {
    return 'text';
  }
  if (['mp4', 'avi', 'mov', 'wmv'].includes(extension || '')) {
    return 'video';
  }
  if (['mp3', 'wav', 'ogg'].includes(extension || '')) {
    return 'audio';
  }
  
  return 'file';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file type is allowed
 */
export function isAllowedFileType(fileName: string): boolean {
  const allowedExtensions = [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
    'pdf', 'doc', 'docx', 'txt', 'md',
    'mp4', 'avi', 'mov', 'wmv',
    'mp3', 'wav', 'ogg'
  ];
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  return allowedExtensions.includes(extension || '');
}

/**
 * Get maximum file size (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Check if file size is within limits
 */
export function isFileSizeValid(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

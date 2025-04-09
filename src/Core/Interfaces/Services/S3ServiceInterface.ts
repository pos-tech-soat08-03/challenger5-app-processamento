export interface S3ServiceInterface {
  downloadVideo(fullPath: string, localPath: string): Promise<void>;
  uploadZip(bucket: string, key: string, zipPath: string): Promise<void>;
  generatePresignedUrl(bucket: string, key: string): Promise<string>;
  deleteVideo(fullPath: string): Promise<void>;
}
export interface ZipServiceInterface {
  createZip(videoId: string, framesDir: string): Promise<string>;
}

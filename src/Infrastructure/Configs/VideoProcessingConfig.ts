export class VideoProcessingConfig {
  constructor(
    public readonly tempDir: string = process.env.TEMP_DIR || "/tmp",
    public readonly processedPrefix: string = process.env.PROCESSED_PREFIX ||
      "processed"
  ) {}
}

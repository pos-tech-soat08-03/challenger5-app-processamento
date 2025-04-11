import { S3ServiceImpl } from "../../../../src/Infrastructure/Services/S3ServiceImpl";
import { S3Client, GetObjectCommandOutput } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as fsPromises from "fs/promises";
import * as fs from "fs";

// Mock do S3Client, fs.promises, fs e console.log
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(),
  GetObjectCommand: jest.fn((params) => params),
  PutObjectCommand: jest.fn((params) => params),
  DeleteObjectCommand: jest.fn((params) => params),
}));
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));
jest.mock("fs/promises", () => ({
  writeFile: jest.fn(),
  stat: jest.fn(),
}));
jest.mock("fs", () => ({
  createReadStream: jest.fn(),
}));
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation(() => {});

describe("S3ServiceImpl", () => {
  let s3Service: S3ServiceImpl;
  let mockS3Client: jest.Mocked<S3Client>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Configura o mock do S3Client
    mockS3Client = {
      send: jest.fn(),
    } as any; // Usamos any para simplificar, já que estamos mockando apenas `send`
    s3Service = new S3ServiceImpl(mockS3Client);

    // Mock básico para createReadStream
    (fs.createReadStream as jest.Mock).mockReturnValue({
      close: jest.fn(),
    });
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
  });

  it("should download video successfully", async () => {
    // Arrange
    const byteArray = new Uint8Array([1, 2, 3]);
    const mockBody = {
      transformToByteArray: jest.fn().mockResolvedValue(byteArray),
    };
    const mockResponse: GetObjectCommandOutput = {
      $metadata: {}, // Necessário para satisfazer GetObjectCommandOutput
      Body: mockBody as any, // Ainda usamos 'as any' para o Body, pois é um ReadableStream na vida real
    };
    mockS3Client.send.mockImplementationOnce(() =>
      Promise.resolve(mockResponse)
    );
    (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fsPromises.stat as jest.Mock).mockResolvedValue({
      size: byteArray.length,
    });

    // Act
    await s3Service.downloadVideo(
      "s3://my-bucket/videos/video-123.mp4",
      "/tmp/video.mp4"
    );

    // Assert
    expect(mockS3Client.send).toHaveBeenCalledWith({
      Bucket: "my-bucket",
      Key: "videos/video-123.mp4",
    });
    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      "/tmp/video.mp4",
      byteArray
    );
    expect(fsPromises.stat).toHaveBeenCalledWith("/tmp/video.mp4");
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "Tamanho do byteArray:",
      byteArray.length
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "Tamanho do arquivo salvo:",
      byteArray.length
    );
  });

  it("should upload zip successfully", async () => {
    // Arrange
    mockS3Client.send.mockImplementationOnce(() => Promise.resolve({}));
    const mockStream = { close: jest.fn() };
    (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

    // Act
    await s3Service.uploadZip(
      "my-bucket",
      "videos/processed/video-123.zip",
      "/tmp/video-123.zip"
    );

    // Assert
    expect(fs.createReadStream).toHaveBeenCalledWith("/tmp/video-123.zip");
    expect(mockS3Client.send).toHaveBeenCalledWith({
      Bucket: "my-bucket",
      Key: "videos/processed/video-123.zip",
      Body: mockStream,
      ContentType: "application/zip",
    });
    expect(mockStream.close).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "ZIP enviado para s3://my-bucket/videos/processed/video-123.zip"
    );
  });

  it("should generate presigned URL successfully", async () => {
    // Arrange
    const mockUrl = "https://s3.amazonaws.com/my-bucket/video-123.zip";
    (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

    // Act
    const url = await s3Service.generatePresignedUrl(
      "my-bucket",
      "videos/processed/video-123.zip"
    );

    // Assert
    expect(getSignedUrl).toHaveBeenCalledWith(
      mockS3Client,
      { Bucket: "my-bucket", Key: "videos/processed/video-123.zip" },
      { expiresIn: 3600 }
    );
    expect(url).toBe(mockUrl);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      `URL assinada gerada: ${mockUrl}`
    );
  });

  it("should delete video successfully", async () => {
    // Arrange
    mockS3Client.send.mockImplementationOnce(() => Promise.resolve({}));

    // Act
    await s3Service.deleteVideo("s3://my-bucket/videos/video-123.mp4");

    // Assert
    expect(mockS3Client.send).toHaveBeenCalledWith({
      Bucket: "my-bucket",
      Key: "videos/video-123.mp4",
    });
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "Vídeo original deletado do S3: s3://my-bucket/videos/video-123.mp4"
    );
  });

  it("should throw error when downloading video fails with NoSuchKey", async () => {
    // Arrange
    const mockError = { code: "NoSuchKey", message: "Key not found" };
    mockS3Client.send.mockImplementationOnce(() => Promise.reject(mockError));

    // Act & Assert
    await expect(
      s3Service.downloadVideo(
        "s3://my-bucket/videos/video-123.mp4",
        "/tmp/video.mp4"
      )
    ).rejects.toMatchObject({
      code: "NoSuchKey",
      message: "Key not found",
    });
    expect(mockS3Client.send).toHaveBeenCalledWith({
      Bucket: "my-bucket",
      Key: "videos/video-123.mp4",
    });
    expect(fsPromises.writeFile).not.toHaveBeenCalled();
  });
  it("should throw error when bucket is not specified in downloadVideo", async () => {
    // Act & Assert
    await expect(
      s3Service.downloadVideo("s3://", "/tmp/video.mp4")
    ).rejects.toThrow("Bucket não especificado no fullPath");
    expect(mockS3Client.send).not.toHaveBeenCalled();
  });

  it("should throw error when no body is returned in downloadVideo", async () => {
    // Arrange
    mockS3Client.send.mockImplementationOnce(() => Promise.resolve({
      Body: undefined
    }));

    // Act & Assert
    await expect(
      s3Service.downloadVideo(
        "s3://my-bucket/videos/video-123.mp4",
        "/tmp/video.mp4"
      )
    ).rejects.toThrow("Nenhum corpo retornado pelo S3");
    expect(mockS3Client.send).toHaveBeenCalledWith({
      Bucket: "my-bucket",
      Key: "videos/video-123.mp4",
    });
    expect(fsPromises.writeFile).not.toHaveBeenCalled();
  });

  it("should throw error when bucket is not specified in deleteVideo", async () => {
    // Act & Assert
    await expect(s3Service.deleteVideo("s3://")).rejects.toThrow(
      "Bucket não especificado para deleção"
    );
    expect(mockS3Client.send).not.toHaveBeenCalled();
  });
});

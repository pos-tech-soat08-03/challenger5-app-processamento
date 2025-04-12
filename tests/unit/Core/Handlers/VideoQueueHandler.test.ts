import { VideoQueueHandler } from "../../../../src/Core/Handlers/VideoQueueHandler";
import { QueueServiceInterface } from "../../../../src/Core/Interfaces/Services/QueueServiceInterface";
import { NotificationServiceInterface } from "../../../../src/Core/Interfaces/Services/NotificationServiceInterface";
import { S3ServiceInterface } from "../../../../src/Core/Interfaces/Services/S3ServiceInterface";
import { FrameExtractorServiceInterface } from "../../../../src/Core/Interfaces/Services/FrameExtractorServiceInterface";
import { ZipServiceInterface } from "../../../../src/Core/Interfaces/Services/ZipServiceInterface";
import { VideoProcessingConfig } from "../../../../src/Infrastructure/Configs/VideoProcessingConfig";
import { MessageVideoData } from "../../../../src/Core/Entity/MessageVideoData";

// Mock do console.log para verificar mensagens de log
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation(() => {});

describe("VideoQueueHandler", () => {
  // Mocks das dependências
  let queueService: jest.Mocked<QueueServiceInterface>;
  let notificationService: jest.Mocked<NotificationServiceInterface>;
  let s3Service: jest.Mocked<S3ServiceInterface>;
  let frameExtractorService: jest.Mocked<FrameExtractorServiceInterface>;
  let zipService: jest.Mocked<ZipServiceInterface>;
  let config: VideoProcessingConfig;
  let handler: VideoQueueHandler;

  // Dados de teste
  const videoData = new MessageVideoData(
    { idUsuario: "user-456", email: "user@example.com" },
    {
      idVideo: "video-123",
      title: "Test Video",
      description: "A test video",
      filename: "video.mp4",
      fullPath: "s3://my-bucket/videos/video-123.mp4",
      fileSize: 1000000,
      duration: 120,
      framerate: 24,
    },
    { outputFormat: "png", resolution: "1280x720", interval: 1 }
  );

  beforeEach(() => {
    // Reseta os mocks antes de cada teste
    jest.clearAllMocks();

    // Configuração dos mocks
    queueService = {
      receberProximaMensagem: jest.fn(),
      deletarMensagem: jest.fn(),
    } as jest.Mocked<QueueServiceInterface>;

    notificationService = {
      informarStatus: jest.fn(),
    } as jest.Mocked<NotificationServiceInterface>;

    s3Service = {
      downloadVideo: jest.fn(),
      uploadZip: jest.fn(),
      generatePresignedUrl: jest.fn(),
      deleteVideo: jest.fn(),
    } as jest.Mocked<S3ServiceInterface>;

    frameExtractorService = {
      extractFrames: jest.fn(),
    } as jest.Mocked<FrameExtractorServiceInterface>;

    zipService = {
      createZip: jest.fn(),
    } as jest.Mocked<ZipServiceInterface>;

    config = {
      tempDir: "/tmp",
      processedPrefix: "processed",
    } as VideoProcessingConfig;

    // Instancia o handler com os mocks
    handler = new VideoQueueHandler(
      queueService,
      notificationService,
      s3Service,
      frameExtractorService,
      zipService,
      config
    );

    // Mock do MessageVideoData.validate
    jest.spyOn(MessageVideoData, "validate").mockImplementation(() => {});
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
  });

  it("should log message and exit when no video is in queue", async () => {
    // Arrange
    queueService.receberProximaMensagem.mockResolvedValue(null);

    // Act
    await handler.handle();

    // Assert
    expect(queueService.receberProximaMensagem).toHaveBeenCalledTimes(1);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "Nenhum vídeo na fila no momento."
    );
    expect(queueService.deletarMensagem).not.toHaveBeenCalled();
  });

  it("should process video successfully and notify status", async () => {
    // Arrange
    queueService.receberProximaMensagem.mockResolvedValue(videoData);
    s3Service.downloadVideo.mockResolvedValue(undefined);
    frameExtractorService.extractFrames.mockResolvedValue(undefined);
    zipService.createZip.mockResolvedValue("/tmp/video-123.zip");
    s3Service.uploadZip.mockResolvedValue(undefined);
    s3Service.generatePresignedUrl.mockResolvedValue(
      "https://s3.amazonaws.com/my-bucket/video-123.zip"
    );
    s3Service.deleteVideo.mockResolvedValue(undefined);
    notificationService.informarStatus.mockResolvedValue(undefined);
    queueService.deletarMensagem.mockResolvedValue(undefined);

    // Act
    await handler.handle();

    // Assert
    expect(queueService.receberProximaMensagem).toHaveBeenCalledTimes(1);
    expect(MessageVideoData.validate).toHaveBeenCalledWith(videoData);
    expect(s3Service.downloadVideo).toHaveBeenCalledWith(
      "s3://my-bucket/videos/video-123.mp4",
      "/tmp/video.mp4"
    );
    expect(notificationService.informarStatus).toHaveBeenCalledTimes(2);
    expect(notificationService.informarStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        idVideo: "video-123",
        idUsuario: "user-456",
        status: "NOT_STARTED",
        percentage: 0.0,
      })
    );
    expect(frameExtractorService.extractFrames).toHaveBeenCalledWith(
      "/tmp/video.mp4",
      videoData,
      notificationService
    );
    expect(zipService.createZip).toHaveBeenCalledWith(
      "video-123",
      "/tmp/frames"
    );
    expect(s3Service.uploadZip).toHaveBeenCalledWith(
      "my-bucket",
      "videos/processed/video-123.zip",
      "/tmp/video-123.zip"
    );
    expect(s3Service.generatePresignedUrl).toHaveBeenCalledWith(
      "my-bucket",
      "videos/processed/video-123.zip"
    );
    expect(s3Service.deleteVideo).toHaveBeenCalledWith(
      "s3://my-bucket/videos/video-123.mp4"
    );
    expect(notificationService.informarStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        idVideo: "video-123",
        idUsuario: "user-456",
        status: "COMPLETED",
        percentage: 100.0,
        presignedUrl: "https://s3.amazonaws.com/my-bucket/video-123.zip",
      })
    );
    expect(queueService.deletarMensagem).toHaveBeenCalledWith(videoData);
  });

  it("should handle generic error and notify error status", async () => {
    // Arrange
    queueService.receberProximaMensagem.mockResolvedValue(videoData);
    s3Service.downloadVideo.mockRejectedValue(new Error("Download failed"));
    notificationService.informarStatus.mockResolvedValue(undefined);
    queueService.deletarMensagem.mockResolvedValue(undefined);

    // Act
    await handler.handle();

    // Assert
    expect(notificationService.informarStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        idVideo: "video-123",
        idUsuario: "user-456",
        status: "ERROR",
        errorMessage: "Download failed",
        statusTime: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
        ),
      })
    );
    expect(queueService.deletarMensagem).toHaveBeenCalledWith(videoData);
  });

  it("should handle NoSuchKey error from S3 and notify specific error status", async () => {
    // Arrange
    queueService.receberProximaMensagem.mockResolvedValue(videoData);
    s3Service.downloadVideo.mockRejectedValue(
      Object.assign(new Error("Key not found"), { Code: "NoSuchKey" })
    );
    notificationService.informarStatus.mockResolvedValue(undefined);
    queueService.deletarMensagem.mockResolvedValue(undefined);

    // Act
    await handler.handle();

    // Assert
    expect(notificationService.informarStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        idVideo: "video-123",
        idUsuario: "user-456",
        status: "ERROR",
        errorMessage:
          "Vídeo não encontrado no S3: s3://my-bucket/videos/video-123.mp4",
        statusTime: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
        ),
      })
    );
    expect(queueService.deletarMensagem).toHaveBeenCalledWith(videoData);
  });

  it("should handle interrupted error and notify interrupted status", async () => {
    // Arrange
    queueService.receberProximaMensagem.mockResolvedValue(videoData);
    s3Service.downloadVideo.mockResolvedValue(undefined);
    frameExtractorService.extractFrames.mockRejectedValue(
      new Error("Process killed with signal")
    );
    notificationService.informarStatus.mockResolvedValue(undefined);
    queueService.deletarMensagem.mockResolvedValue(undefined);

    // Act
    await handler.handle();

    // Assert
    expect(notificationService.informarStatus).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        idVideo: "video-123",
        idUsuario: "user-456",
        status: "INTERRUPTED",
        errorMessage: "Process killed with signal",
        statusTime: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
        ),
      })
    );
    expect(queueService.deletarMensagem).toHaveBeenCalledWith(videoData);
  });
});

afterAll(() => {
  mockConsoleLog.mockRestore();
});

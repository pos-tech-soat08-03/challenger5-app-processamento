import { FrameExtractorServiceImpl } from "../../../../src/Infrastructure/Services/FrameExtractorServiceImpl";
import { NotificationServiceInterface } from "../../../../src/Core/Interfaces/Services/NotificationServiceInterface";
import { MessageVideoData } from "../../../../src/Core/Entity/MessageVideoData";
import * as fsPromises from "fs/promises";

// Tipo simplificado para o mock do ffmpeg
type FfmpegCommandMock = {
  outputOptions: jest.Mock;
  output: jest.Mock;
  on: jest.Mock;
  run: jest.Mock;
};

// Função para criar um mock do ffmpeg com comportamento configurável
let ffmpegInstance: FfmpegCommandMock;

const createFfmpegMock = (options: {
  succeed: boolean;
  errorMessage?: string;
}) => {
  ffmpegInstance = {
    outputOptions: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    on: jest.fn((event: string, callback: (arg?: any) => void) => {
      if (event === "progress" && options.succeed) {
        callback({ percent: 50 });
      }
      if (event === "end" && options.succeed) {
        callback();
      }
      if (event === "error" && !options.succeed) {
        callback(new Error(options.errorMessage || "Erro genérico"));
      }
      return ffmpegInstance;
    }),
    run: jest.fn(),
  };
  return ffmpegInstance;
};

// Mock do fs.promises
jest.mock("fs/promises", () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

// Spies para console
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

describe("FrameExtractorServiceImpl - Nova Abordagem", () => {
  let service: FrameExtractorServiceImpl;
  let mockNotificationService: jest.Mocked<NotificationServiceInterface>;
  let videoData: MessageVideoData;

  // Configuração inicial antes de cada teste
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock do NotificationService
    mockNotificationService = {
      informarStatus: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<NotificationServiceInterface>;

    // Dados de entrada para o teste
    videoData = new MessageVideoData(
      { idUsuario: "user-123", email: "user@example.com" },
      {
        idVideo: "video-789",
        title: "Sample Video",
        description: "A sample video",
        filename: "sample.mp4",
        fullPath: "s3://bucket/sample.mp4",
        fileSize: 500000,
        duration: 60,
        framerate: 30,
      },
      { outputFormat: "jpg", resolution: "1920x1080", interval: 2 }
    );
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  it("deve extrair frames com sucesso e notificar progresso e conclusão", async () => {
    // Mock do fsPromises.mkdir
    (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);

    // Configura o mock do ffmpeg
    const ffmpegMock = () => createFfmpegMock({ succeed: true });
    service = new FrameExtractorServiceImpl(ffmpegMock);

    // Executa o método
    await service.extractFrames(
      "/tmp/sample.mp4",
      videoData,
      mockNotificationService
    );

    // Verificações
    expect(fsPromises.mkdir).toHaveBeenCalledWith("/tmp/frames", {
      recursive: true,
    });
    expect(ffmpegInstance.outputOptions).toHaveBeenCalledWith([
      "-vf fps=1/2",
      "-s 1920x1080",
    ]);
    expect(ffmpegInstance.output).toHaveBeenCalledWith(
      "/tmp/frames/frame-%04d.jpg"
    );
    expect(mockNotificationService.informarStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PROCESSING", percentage: 40 })
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "Frames extraídos com sucesso."
    );
  });

  /** Teste de Erro Genérico */
  it("deve tratar erro genérico do ffmpeg e notificar status de erro", async () => {
    const ffmpegMock = () =>
      createFfmpegMock({ succeed: false, errorMessage: "FFmpeg failed" });
    service = new FrameExtractorServiceImpl(ffmpegMock);

    await expect(
      service.extractFrames(
        "/tmp/sample.mp4",
        videoData,
        mockNotificationService
      )
    ).rejects.toThrow("FFmpeg failed");

    // Verifica notificação de erro
    expect(mockNotificationService.informarStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ERROR",
        errorMessage: "FFmpeg failed",
      })
    );
    expect(mockConsoleError).toHaveBeenCalledWith(
      "Erro ao extrair frames:",
      expect.any(Error)
    );
  });

  /** Teste de Interrupção */
  it("deve tratar erro de interrupção e notificar status interrompido", async () => {
    const ffmpegMock = () =>
      createFfmpegMock({
        succeed: false,
        errorMessage: "Process killed with signal",
      });
    service = new FrameExtractorServiceImpl(ffmpegMock);

    await expect(
      service.extractFrames(
        "/tmp/sample.mp4",
        videoData,
        mockNotificationService
      )
    ).rejects.toThrow("Process killed with signal");

    // Verifica notificação de interrupção
    expect(mockNotificationService.informarStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "INTERRUPTED",
        errorMessage: "Process killed with signal",
      })
    );
    expect(mockConsoleError).toHaveBeenCalledWith(
      "Erro ao extrair frames:",
      expect.any(Error)
    );
  });

  /** Teste de Falha na Criação do Diretório */
  it("deve lançar erro se a criação do diretório falhar", async () => {
    (fsPromises.mkdir as jest.Mock).mockRejectedValue(
      new Error("Directory creation failed")
    );
    const ffmpegMock = () => createFfmpegMock({ succeed: true });
    service = new FrameExtractorServiceImpl(ffmpegMock);

    await expect(
      service.extractFrames(
        "/tmp/sample.mp4",
        videoData,
        mockNotificationService
      )
    ).rejects.toThrow("Directory creation failed");

    // Verifica que o ffmpeg não foi chamado
    const ffmpegInstance = ffmpegMock();
    expect(ffmpegInstance.run).not.toHaveBeenCalled();
  });
});

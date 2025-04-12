import { ZipServiceImpl } from "../../../../src/Infrastructure/Services/ZipServiceImpl";
import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";

// Mock do fs e archiver como módulos
jest.mock("fs");
jest.mock("archiver");

describe("ZipServiceImpl", () => {
  let zipService: ZipServiceImpl;
  const mockCreateWriteStream = fs.createWriteStream as unknown as jest.Mock;
  const mockArchiver = archiver as unknown as jest.Mock;
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    zipService = new ZipServiceImpl();

    // Mock básico pro createWriteStream com controle manual do "close"
    mockCreateWriteStream.mockReturnValue({
      on: jest.fn(),
    });

    // Mock básico pro archiver
    mockArchiver.mockReturnValue({
      pipe: jest.fn(),
      directory: jest.fn(),
      finalize: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    });

    // Mock dos logs do console
    mockConsoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
    mockConsoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe("createZip", () => {
    it("should create a ZIP file successfully", async () => {
      // Arrange
      const videoId = "video-123";
      const framesDir = "/tmp/frames";
      const expectedOutputPath = path.join(
        path.dirname(framesDir),
        `video-${videoId}.zip`
      );
      let closeCallback: () => void; // Variável pra armazenar o callback
      mockCreateWriteStream.mockReturnValueOnce({
        on: jest.fn((event, callback) => {
          if (event === "close") closeCallback = callback; // Guarda o callback
        }),
      });

      // Act
      const promise = zipService.createZip(videoId, framesDir); // Inicia a Promise
      closeCallback!(); // Dispara o "close" manualmente
      const result = await promise; // Espera a Promise resolver

      // Assert
      expect(mockCreateWriteStream).toHaveBeenCalledWith(expectedOutputPath);
      expect(mockArchiver).toHaveBeenCalledWith("zip", { zlib: { level: 9 } });
      const archiveInstance = mockArchiver.mock.results[0].value;
      expect(archiveInstance.pipe).toHaveBeenCalledWith(
        mockCreateWriteStream.mock.results[0].value
      );
      expect(archiveInstance.directory).toHaveBeenCalledWith(framesDir, false);
      expect(archiveInstance.finalize).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        `ZIP criado em ${expectedOutputPath}`
      );
      expect(result).toBe(expectedOutputPath);
    });

    it("should throw an error if archiver fails", async () => {
      // Arrange
      const videoId = "video-123";
      const framesDir = "/tmp/frames";
      const expectedOutputPath = path.join(
        path.dirname(framesDir),
        `video-${videoId}.zip`
      );

      // Mock do archiver pra simular erro
      mockArchiver.mockReturnValueOnce({
        pipe: jest.fn(),
        directory: jest.fn(),
        finalize: jest.fn().mockImplementation(() => {
          throw new Error("Archiver failed"); // Simula erro direto no finalize
        }),
        on: jest.fn((event, callback) => {
          if (event === "error") callback(new Error("Archiver failed"));
        }),
      });

      // Act & Assert
      await expect(zipService.createZip(videoId, framesDir)).rejects.toThrow(
        "Archiver failed"
      );
      expect(mockCreateWriteStream).toHaveBeenCalledWith(expectedOutputPath);
      expect(mockArchiver).toHaveBeenCalledWith("zip", { zlib: { level: 9 } });
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Erro ao criar ZIP:",
        expect.any(Error)
      );
    });
  });
});

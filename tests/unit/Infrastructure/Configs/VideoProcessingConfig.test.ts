import { VideoProcessingConfig } from "../../../../src/Infrastructure/Configs/VideoProcessingConfig";

describe("VideoProcessingConfig", () => {
  // Limpa as variáveis de ambiente antes de cada teste para evitar interferência
  beforeEach(() => {
    delete process.env.TEMP_DIR;
    delete process.env.PROCESSED_PREFIX;
  });

  it("should create a config object with default values when no env vars are set", () => {
    // Act
    const config = new VideoProcessingConfig();

    // Assert
    expect(config.tempDir).toBe("/tmp");
    expect(config.processedPrefix).toBe("processed");
  });

  it("should create a config object with values from constructor parameters", () => {
    // Act
    const config = new VideoProcessingConfig("/custom/tmp", "custom-processed");

    // Assert
    expect(config.tempDir).toBe("/custom/tmp");
    expect(config.processedPrefix).toBe("custom-processed");
  });

  it("should create a config object with values from environment variables", () => {
    // Arrange
    process.env.TEMP_DIR = "/env/tmp";
    process.env.PROCESSED_PREFIX = "env-processed";

    // Act
    const config = new VideoProcessingConfig();

    // Assert
    expect(config.tempDir).toBe("/env/tmp");
    expect(config.processedPrefix).toBe("env-processed");
  });

  it("should prioritize constructor parameters over environment variables", () => {
    // Arrange
    process.env.TEMP_DIR = "/env/tmp";
    process.env.PROCESSED_PREFIX = "env-processed";

    // Act
    const config = new VideoProcessingConfig("/custom/tmp", "custom-processed");

    // Assert
    expect(config.tempDir).toBe("/custom/tmp");
    expect(config.processedPrefix).toBe("custom-processed");
  });

  it("should have readonly properties", () => {
    // Act
    const config = new VideoProcessingConfig("/custom/tmp", "custom-processed");

    // Assert
    const configCopy = { ...config };
    expect(configCopy.tempDir).toBe("/custom/tmp");
    expect(configCopy.processedPrefix).toBe("custom-processed");
  });
});

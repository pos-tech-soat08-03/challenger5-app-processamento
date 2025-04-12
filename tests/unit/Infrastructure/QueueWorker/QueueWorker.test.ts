import { QueueWorker } from "../../../../src/Infrastructure/QueueWorker/QueueWorkerSQS";
import { VideoQueueHandler } from "../../../../src/Core/Handlers/VideoQueueHandler";

const mockConsoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});
describe("QueueWorker", () => {
  let worker: QueueWorker;
  let mockHandler: jest.Mocked<VideoQueueHandler>;
  let mockSetTimeout: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    mockHandler = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<VideoQueueHandler>;

    worker = new QueueWorker(mockHandler);
    mockSetTimeout = jest.spyOn(global, "setTimeout");
  });

  afterEach(async () => {
    await worker.stop();
    jest.useRealTimers();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  const advanceTimers = async (ms: number) => {
    await jest.advanceTimersByTimeAsync(ms);
    await Promise.resolve(); // Processa microtasks
  };

  it("should implement exponential backoff on errors", async () => {
    mockHandler.handle.mockRejectedValue(new Error("Test error"));

    await worker.start();

    // Primeiro erro
    await advanceTimers(1000);
    expect(mockSetTimeout).toHaveBeenLastCalledWith(expect.any(Function), 2000);
    expect(mockConsoleError).toHaveBeenCalledWith(
      "Erro no processamento:",
      expect.any(Error)
    );

    // Segundo erro
    await advanceTimers(2000);
    expect(mockSetTimeout).toHaveBeenLastCalledWith(expect.any(Function), 4000);
    expect(mockConsoleError).toHaveBeenCalledWith(
      "Erro no processamento:",
      expect.any(Error)
    );

    // Terceiro erro
    await advanceTimers(4000);
    expect(mockSetTimeout).toHaveBeenLastCalledWith(expect.any(Function), 8000);
    expect(mockConsoleError).toHaveBeenCalledWith(
      "Erro no processamento:",
      expect.any(Error)
    );
  });

  it("should reset delay after successful processing", async () => {
    mockHandler.handle
      .mockRejectedValueOnce(new Error("Erro"))
      .mockResolvedValueOnce(undefined);

    await worker.start();

    // Primeiro erro
    await advanceTimers(1000);
    expect(mockSetTimeout).toHaveBeenLastCalledWith(expect.any(Function), 2000);

    // Sucesso
    await advanceTimers(2000);
    expect(mockSetTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);
  });

  // Mantemos o teste de concorrência corrigido
  it("should prevent multiple concurrent executions", async () => {
    let resolveHandler!: () => void;
    const blockingPromise = new Promise<void>((resolve) => {
      resolveHandler = resolve;
    });

    mockHandler.handle.mockImplementation(() => blockingPromise);

    const startPromise1 = worker.start();
    const startPromise2 = worker.start();

    expect(mockHandler.handle).toHaveBeenCalledTimes(1);

    resolveHandler();
    await Promise.all([startPromise1, startPromise2]);
  });

  it("should cap maximum delay at 30 seconds", async () => {
    mockHandler.handle.mockRejectedValue(new Error("Erro"));

    await worker.start();

    // Simula 10 erros consecutivos
    for (let i = 0; i < 10; i++) {
      await advanceTimers(1000 * 2 ** i);
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Erro no processamento:",
        expect.any(Error)
      );
    }

    expect(mockSetTimeout).toHaveBeenLastCalledWith(
      expect.any(Function),
      30000
    );
  });
});

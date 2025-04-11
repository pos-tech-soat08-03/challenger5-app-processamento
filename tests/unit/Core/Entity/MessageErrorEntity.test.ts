import { MessageErrorEntity } from "../../../../src/Core/Entity/MessageErrorEntity";
import { StatusError } from "../../../../src/Core/Types/Status";

describe("MessageErrorEntity", () => {
  const idVideo = "video-123";
  const idUsuario = "user-456";
  const status: StatusError = "ERROR";
  const errorMessage = "Algo deu errado";
  const customTime = "2025-04-10T12:00:00.000Z";

  it("should create an instance with all parameters provided", () => {
    const entity = new MessageErrorEntity(
      idVideo,
      idUsuario,
      status,
      errorMessage,
      customTime
    );

    expect(entity.idVideo).toBe(idVideo);
    expect(entity.idUsuario).toBe(idUsuario);
    expect(entity.status).toBe(status);
    expect(entity.errorMessage).toBe(errorMessage);
    expect(entity.statusTime).toBe(customTime);
  });

  it("should create an instance with default statusTime when not provided", () => {
    const before = new Date();
    const entity = new MessageErrorEntity(
      idVideo,
      idUsuario,
      status,
      errorMessage
    );
    const after = new Date();

    expect(entity.idVideo).toBe(idVideo);
    expect(entity.idUsuario).toBe(idUsuario);
    expect(entity.status).toBe(status);
    expect(entity.errorMessage).toBe(errorMessage);
    expect(entity.statusTime).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
    );
    const statusTimeDate = new Date(entity.statusTime);
    expect(statusTimeDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(statusTimeDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  // Teste 3: Criação via método create
  it("should create an instance using create method", () => {
    const entity = MessageErrorEntity.create(
      idVideo,
      idUsuario,
      status,
      errorMessage
    );

    expect(entity).toBeInstanceOf(MessageErrorEntity);
    expect(entity.idVideo).toBe(idVideo);
    expect(entity.idUsuario).toBe(idUsuario);
    expect(entity.status).toBe(status);
    expect(entity.errorMessage).toBe(errorMessage);
    expect(entity.statusTime).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
    );
  });

  it("should have readonly properties", () => {
    const entity = new MessageErrorEntity(
      idVideo,
      idUsuario,
      status,
      errorMessage
    );

    const entityCopy = { ...entity };
    expect(entityCopy.idVideo).toBe(idVideo);
    expect(entityCopy.idUsuario).toBe(idUsuario);
    expect(entityCopy.status).toBe(status);
    expect(entityCopy.errorMessage).toBe(errorMessage);
  });

  it("should only accept valid StatusError values", () => {
    const validStatuses: StatusError[] = ["ERROR", "INTERRUPTED"];
    validStatuses.forEach((validStatus) => {
      const entity = new MessageErrorEntity(
        idVideo,
        idUsuario,
        validStatus,
        errorMessage
      );
      expect(entity.status).toBe(validStatus);
    });
  });
});

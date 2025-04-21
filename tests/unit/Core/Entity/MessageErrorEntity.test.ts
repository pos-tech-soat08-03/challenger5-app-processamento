import { MessageErrorEntity } from "../../../../src/Core/Entity/MessageErrorEntity";
import { StatusError } from "../../../../src/Core/Types/Status";

describe("MessageErrorEntity", () => {
  const id_video = "video-123";
  const id_usuario = "user-456";
  const status: StatusError = "ERROR";
  const error_message = "Algo deu errado";
  const customTime = "2025-04-10T12:00:00.000Z";

  it("should create an instance with all parameters provided", () => {
    const entity = new MessageErrorEntity(
      id_video,
      id_usuario,
      status,
      error_message,
      customTime
    );

    expect(entity.id_video).toBe(id_video);
    expect(entity.id_usuario).toBe(id_usuario);
    expect(entity.status).toBe(status);
    expect(entity.error_message).toBe(error_message);
    expect(entity.status_time).toBe(customTime);
  });

  it("should create an instance with default status_time when not provided", () => {
    const before = new Date();
    const entity = new MessageErrorEntity(
      id_video,
      id_usuario,
      status,
      error_message
    );
    const after = new Date();

    expect(entity.id_video).toBe(id_video);
    expect(entity.id_usuario).toBe(id_usuario);
    expect(entity.status).toBe(status);
    expect(entity.error_message).toBe(error_message);
    expect(entity.status_time).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
    );
    const statusTimeDate = new Date(entity.status_time);
    expect(statusTimeDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(statusTimeDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  // Teste 3: Criação via método create
  it("should create an instance using create method", () => {
    const entity = MessageErrorEntity.create(
      id_video,
      id_usuario,
      status,
      error_message
    );

    expect(entity).toBeInstanceOf(MessageErrorEntity);
    expect(entity.id_video).toBe(id_video);
    expect(entity.id_usuario).toBe(id_usuario);
    expect(entity.status).toBe(status);
    expect(entity.error_message).toBe(error_message);
    expect(entity.status_time).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
    );
  });

  it("should have readonly properties", () => {
    const entity = new MessageErrorEntity(
      id_video,
      id_usuario,
      status,
      error_message
    );

    const entityCopy = { ...entity };
    expect(entityCopy.id_video).toBe(id_video);
    expect(entityCopy.id_usuario).toBe(id_usuario);
    expect(entityCopy.status).toBe(status);
    expect(entityCopy.error_message).toBe(error_message);
  });

  it("should only accept valid StatusError values", () => {
    const validStatuses: StatusError[] = ["ERROR", "INTERRUPTED"];
    validStatuses.forEach((validStatus) => {
      const entity = new MessageErrorEntity(
        id_video,
        id_usuario,
        validStatus,
        error_message
      );
      expect(entity.status).toBe(validStatus);
    });
  });
});

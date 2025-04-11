import { MessageStatusEntity } from "../../../../src/Core/Entity/MessageStatusEntity";
import { Status } from "../../../../src/Core/Types/Status";

describe("MessageStatusEntity", () => {
  const idVideo = "video-123";
  const idUsuario = "user-456";
  const status: Status = "NOT_STARTED";
  const percentage = 0;
  const presignedUrl = "https://s3.amazonaws.com/my-bucket/video-123.zip";
  const customTime = "2025-04-10T12:00:00.000Z";

  it("should create an instance with all parameters provided", () => {
    const entity = new MessageStatusEntity(
      idVideo,
      idUsuario,
      status,
      percentage,
      customTime,
      presignedUrl
    );

    expect(entity.idVideo).toBe(idVideo);
    expect(entity.idUsuario).toBe(idUsuario);
    expect(entity.status).toBe(status);
    expect(entity.percentage).toBe(percentage);
    expect(entity.statusTime).toBe(customTime);
    expect(entity.presignedUrl).toBe(presignedUrl);
  });

  it("should create an instance using create method without presignedUrl", () => {
    const before = new Date();
    const entity = MessageStatusEntity.create(
      idVideo,
      idUsuario,
      status,
      percentage
    );
    const after = new Date();

    expect(entity).toBeInstanceOf(MessageStatusEntity);
    expect(entity.idVideo).toBe(idVideo);
    expect(entity.idUsuario).toBe(idUsuario);
    expect(entity.status).toBe(status);
    expect(entity.percentage).toBe(percentage);
    expect(entity.presignedUrl).toBeUndefined();
    expect(entity.statusTime).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
    );
    const statusTimeDate = new Date(entity.statusTime as string);
    expect(statusTimeDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(statusTimeDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("should create an instance using create method with presignedUrl", () => {
    const before = new Date();
    const entity = MessageStatusEntity.create(
      idVideo,
      idUsuario,
      "COMPLETED",
      100,
      new Date().toISOString(),
      presignedUrl
    );
    const after = new Date();

    expect(entity).toBeInstanceOf(MessageStatusEntity);
    expect(entity.idVideo).toBe(idVideo);
    expect(entity.idUsuario).toBe(idUsuario);
    expect(entity.status).toBe("COMPLETED");
    expect(entity.percentage).toBe(100);
    expect(entity.presignedUrl).toBe(presignedUrl);
    expect(entity.statusTime).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
    );
    const statusTimeDate = new Date(entity.statusTime as string);
    expect(statusTimeDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(statusTimeDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("should have readonly properties", () => {
    const entity = MessageStatusEntity.create(
      idVideo,
      idUsuario,
      status,
      percentage
    );

    const entityCopy = { ...entity };
    expect(entityCopy.idVideo).toBe(idVideo);
    expect(entityCopy.idUsuario).toBe(idUsuario);
    expect(entityCopy.status).toBe(status);
    expect(entityCopy.percentage).toBe(percentage);
    expect(entityCopy.presignedUrl).toBeUndefined();
    expect(entityCopy.statusTime).toBeDefined();
  });

  it("should only accept valid Status values", () => {
    const validStatuses: Status[] = ["NOT_STARTED", "COMPLETED"]; // Ajuste conforme Status real
    validStatuses.forEach((validStatus) => {
      const entity = MessageStatusEntity.create(
        idVideo,
        idUsuario,
        validStatus,
        percentage
      );
      expect(entity.status).toBe(validStatus);
    });
  });
});

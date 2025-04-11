import { MessageVideoData } from "../../../../src/Core/Entity/MessageVideoData";

describe("MessageVideoData", () => {
  // Dados de teste válidos
  const validUser = { idUsuario: "user-456", email: "user@example.com" };
  const validVideo = {
    idVideo: "video-123",
    title: "Test Video",
    description: "A test video",
    filename: "video.mp4",
    fullPath: "s3://my-bucket/videos/video.mp4",
    fileSize: 1000000,
    duration: 120,
    framerate: 24,
  };
  const validConfig = {
    outputFormat: "png",
    resolution: "1280x720",
    interval: 1,
  };
  const receiptHandle = "receipt-789";

  // Teste 1: Criação via construtor com todos os parâmetros
  it("should create an instance with all parameters provided", () => {
    const entity = new MessageVideoData(
      validUser,
      validVideo,
      validConfig,
      receiptHandle
    );

    expect(entity.user).toEqual(validUser);
    expect(entity.video).toEqual(validVideo);
    expect(entity.config).toEqual(validConfig);
    expect(entity._receiptHandle).toBe(receiptHandle);
  });

  // Teste 2: Criação via fromSqsMessage com dados válidos
  it("should create an instance from valid SQS message data", () => {
    const sqsData = {
      user: { id_usuario: "user-456", email: "user@example.com" },
      video: {
        id_video: "video-123",
        title: "Test Video",
        description: "A test video",
        filename: "video.mp4",
        full_path: "s3://my-bucket/videos/video.mp4",
        file_size: 1000000,
        duration: 120,
        framerate: 24,
      },
      config: { output_format: "png", resolution: "1280x720", interval: 1 },
    };
    const entity = MessageVideoData.fromSqsMessage(sqsData, receiptHandle);

    expect(entity.user).toEqual(validUser);
    expect(entity.video).toEqual(validVideo);
    expect(entity.config).toEqual(validConfig);
    expect(entity._receiptHandle).toBe(receiptHandle);
  });

  // Teste 3: Validação bem-sucedida com dados completos
  it("should pass validation with complete data", () => {
    const entity = new MessageVideoData(validUser, validVideo, validConfig);
    expect(() => MessageVideoData.validate(entity)).not.toThrow();
  });

  // Teste 4: Validação falha com campos ausentes
  it("should throw error on validation with missing fields", () => {
    const invalidEntity = new MessageVideoData(
      { idUsuario: "", email: "" }, // Campos vazios
      {
        idVideo: "",
        title: "",
        description: "",
        filename: "",
        fullPath: "",
        fileSize: 0,
        duration: 0,
        framerate: 0,
      },
      { outputFormat: "", resolution: "", interval: 0 }
    );

    expect(() => MessageVideoData.validate(invalidEntity)).toThrow(
      "Campos obrigatórios ausentes em MessageVideoData: user.idUsuario, user.email, video.idVideo, video.title, video.description, video.filename, video.fullPath, config.outputFormat, config.resolution"
    );
  });

  // Teste 5: fromSqsMessage com dados incompletos
  it("should create instance from incomplete SQS data but fail validation", () => {
    const incompleteSqsData = {
      user: { id_usuario: "user-456" }, // email ausente
      video: { id_video: "video-123" }, // outros campos ausentes
      config: { output_format: "png" }, // resolution e interval ausentes
    };
    const entity = MessageVideoData.fromSqsMessage(incompleteSqsData);

    expect(entity.user.idUsuario).toBe("user-456");
    expect(entity.user.email).toBeUndefined();
    expect(entity.video.idVideo).toBe("video-123");
    expect(entity.video.title).toBeUndefined();
    expect(entity.config.outputFormat).toBe("png");
    expect(entity.config.resolution).toBeUndefined();

    expect(() => MessageVideoData.validate(entity)).toThrow(
      "Campos obrigatórios ausentes em MessageVideoData: user.email, video.title, video.description, video.filename, video.fullPath, video.fileSize, video.duration, video.framerate, config.resolution, config.interval"
    );
  });

  // Teste 6: Propriedades são readonly
  it("should have readonly properties", () => {
    const entity = new MessageVideoData(validUser, validVideo, validConfig);

    const entityCopy = { ...entity };
    expect(entityCopy.user).toEqual(validUser);
    expect(entityCopy.video).toEqual(validVideo);
    expect(entityCopy.config).toEqual(validConfig);
  });
});

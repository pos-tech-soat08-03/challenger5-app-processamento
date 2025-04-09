// src/Core/Entity/VideoEntity.ts
import { v4 as uuidv4 } from "uuid";

export class VideoEntity {
  private readonly id: string;
  private readonly usuarioId: string; // Adicionado conforme recomendação
  private readonly titulo: string;
  private readonly descricao: string;
  private readonly fileName: string;
  private readonly fileExtension: string;
  private readonly path: string;
  private readonly fileSize: number;
  private readonly encoding: string;
  private readonly duration: number; // in seconds
  private readonly fps: number;

  constructor(
    usuarioId: string,
    titulo: string,
    descricao: string,
    fileName: string,
    fileExtension: string,
    path: string,
    fileSize: number,
    encoding: string,
    duration: number,
    fps: number,
    id?: string
  ) {
    this.usuarioId = usuarioId;
    this.titulo = titulo;
    this.descricao = descricao;
    this.fileName = fileName;
    this.fileExtension = fileExtension;
    this.path = path;
    this.fileSize = fileSize;
    this.encoding = encoding;
    this.duration = duration;
    this.fps = fps;

    if (!id) {
      id = uuidv4();
    }
    this.id = id;
  }

  public getId(): string {
    return this.id;
  }

  public getUsuarioId(): string {
    return this.usuarioId;
  }

  public getTitulo(): string {
    return this.titulo;
  }

  public getDescricao(): string {
    return this.descricao;
  }

  public getFileName(): string {
    return this.fileName;
  }

  public getFileExtension(): string {
    return this.fileExtension;
  }

  public getPath(): string {
    return this.path;
  }

  public getFileSize(): number {
    return this.fileSize;
  }

  public getEncoding(): string {
    return this.encoding;
  }

  public getDuration(): number {
    return this.duration;
  }

  public getFps(): number {
    return this.fps;
  }
}

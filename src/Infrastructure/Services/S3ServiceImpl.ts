import { S3ServiceInterface } from "../../Core/Interfaces/Services/S3ServiceInterface";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as fsPromises from "fs/promises";
import * as fs from "fs";

export class S3ServiceImpl implements S3ServiceInterface {
  constructor(private readonly s3Client: S3Client) {}

  async downloadVideo(fullPath: string, localPath: string): Promise<void> {
    const normalizedPath = fullPath.replace("s3://", "");
    console.log("fullPath original:", normalizedPath);
    const [bucket, ...keyParts] = normalizedPath.split("/");
    if (!bucket) {
      throw new Error("Bucket não especificado no fullPath");
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: keyParts.join("/"),
    });

    console.log("Salvando em:", localPath);
    const response = await this.s3Client.send(command);
    if (!response.Body) {
      throw new Error("Nenhum corpo retornado pelo S3");
    }
    const byteArray = await response.Body.transformToByteArray();
    console.log("Tamanho do byteArray:", byteArray.length);
    await fsPromises.writeFile(localPath, byteArray);
    const stats = await fsPromises.stat(localPath);
    console.log("Tamanho do arquivo salvo:", stats.size);
  }

  async uploadZip(bucket: string, key: string, zipPath: string): Promise<void> {
    console.log("Bucket para upload:", bucket);
    console.log("Key para upload:", key);

    const fileStream = fs.createReadStream(zipPath);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileStream,
      ContentType: "application/zip",
    });

    try {
      await this.s3Client.send(command);
      console.log(`ZIP enviado para s3://${bucket}/${key}`);
    } finally {
      fileStream.close();
    }
  }

  async generatePresignedUrl(bucket: string, key: string): Promise<string> {
    console.log("Bucket para URL assinada:", bucket);
    console.log("Key para URL assinada:", key);

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    console.log(`URL assinada gerada: ${url}`);
    return url;
  }

  async deleteVideo(fullPath: string): Promise<void> {
    const normalizedPath = fullPath.replace("s3://", "");
    console.log("fullPath para deleção:", normalizedPath);
    const [bucket, ...keyParts] = normalizedPath.split("/");
    const key = keyParts.join("/");
    console.log("Bucket para deleção:", bucket);
    console.log("Key para deleção:", key);

    if (!bucket) {
      throw new Error("Bucket não especificado para deleção");
    }
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await this.s3Client.send(command);
    console.log(`Vídeo original deletado do S3: s3://${bucket}/${key}`);
  }
}

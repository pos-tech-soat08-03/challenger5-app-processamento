import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";
import { ZipServiceInterface } from "../../Core/Interfaces/Services/ZipServiceInterface";

export class ZipServiceImpl implements ZipServiceInterface {
  async createZip(videoId: string, framesDir: string): Promise<string> {
    const zipPath = path.join(path.dirname(framesDir), `video-${videoId}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on("close", () => {
        console.log(`ZIP criado em ${zipPath}`);
        resolve(zipPath);
      });
      archive.on("error", (err) => {
        console.error("Erro ao criar ZIP:", err);
        reject(err);
      });
      archive.pipe(output);
      archive.directory(framesDir, false);
      archive.finalize();
    });
  }
}

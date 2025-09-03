import { Injectable } from '@nestjs/common';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileService {
  public static uploadFile(
    file: Express.Multer.File,
    fileDir: string = 'files',
    name: string = '',
  ): null | string {
    if (!file) {
      return null;
    }

    let fileName = null;
    if (!name) {
      fileName =
        Date.now() +
        Math.floor(Math.random() * 1000) +
        '.' +
        file.originalname.split('.').pop();
    } else {
      fileName =
        name +
        '_' +
        Date.now() +
        Math.floor(Math.random() * 1000) +
        '.' +
        file.originalname.split('.').pop();
    }
    const filePath = fileDir + '/' + fileName;
    // Use project root uploads directory instead of dist/utilis/file storage
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    const fullStoragePath = path.join(projectRoot, 'uploads', fileDir);
    // console.log('Full storage path:', fullStoragePath);
    // console.log('File dirname:', __dirname);
    // console.log('File buffer size:', file.buffer.length);

    // Create directory if it doesn't exist
    if (!fs.existsSync(fullStoragePath)) {
      fs.mkdirSync(fullStoragePath, { recursive: true });
    }

    // Save the file to the uploads directory in project root
    fs.writeFileSync(path.join(projectRoot, 'uploads', filePath), file.buffer);

    // console.log('File uploaded successfully:', filePath);

    return filePath;
  }

  public static updateFile(
    newFile: Express.Multer.File,
    oldFile: string = null,
    fileDir: string = 'files',
    name: string = '',
  ): string {
    if (!newFile) {
      return oldFile;
    }

    // Delete the old file
    if (oldFile) {
      this.deleteFile(oldFile);
    }

    // Upload the new file
    return this.uploadFile(newFile, fileDir, name);
  }

  public static deleteFile(filePath: string): void {
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    const fileLocation = path.join(projectRoot, 'uploads', filePath);
    if (fs.existsSync(fileLocation)) {
      fs.unlinkSync(fileLocation); // Delete the file
    }
  }

  public static saveBufferFile(
    buffer: Buffer,
    fileName: string,
    ext: string = 'xlsx',
    fileDir: string = 'files'
  ): string {
    const filePath = fileDir + '/' + fileName + '.' + ext;
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    const fullStoragePath = path.join(projectRoot, 'uploads', fileDir);

    if (!fs.existsSync(fullStoragePath)) {
      fs.mkdirSync(fullStoragePath, { recursive: true });
    }

    fs.writeFileSync(path.join(projectRoot, 'uploads', filePath), buffer);

    return filePath; // relative path (e.g. files/users_export_123.xlsx)
  }
}

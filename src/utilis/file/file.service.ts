import { Injectable } from '@nestjs/common';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileService {

  static uploadFile(file: Express.Multer.File, fileDir: string = 'files', name: string = ''): null | string {
    if (!file) {
      return null;
    }

    let fileName = null;
    if (!name) {
        fileName = Date.now() + Math.floor(Math.random() * 1000) + '.' + file.originalname.split('.').pop();
    }else{
        fileName = name + '_' + Date.now() + Math.floor(Math.random() * 1000) + '.' + file.originalname.split('.').pop();
    }
    const filePath = fileDir + '/' + fileName;

    // Save the file to the storage (public or wherever you prefer)
    fs.writeFileSync(path.join(__dirname, '..', 'storage', filePath), file.buffer);

    return filePath;
  }

  static updateFile(newFile: Express.Multer.File, oldFile: string = null, fileDir: string = 'files', name: string = ''): string {
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

  static deleteFile(filePath: string): void {
    const fileLocation = path.join(__dirname, '..', 'storage', filePath);
    if (fs.existsSync(fileLocation)) {
      fs.unlinkSync(fileLocation); // Delete the file
    }
  }
}

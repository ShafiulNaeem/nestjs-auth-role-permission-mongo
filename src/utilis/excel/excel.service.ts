import { Injectable } from '@nestjs/common';
import * as Excel from 'exceljs';
import { FileService as File } from '../file/file.service';

@Injectable()
export class ExcelService {
  // async generateUsersWorkbook(data: Array<Partial<ImportUserDto>>) {
  public static async generateWorkbook(
    data: any[],
    columns: any[],
    worksheet: string,
  ) {
    const workbook = new Excel.Workbook();
    const ws = workbook.addWorksheet(worksheet);

    ws.columns = columns.map((col: any) => ({
      header: col.header,
      key: col.key,
      width: col.width,
    }));

    // Header style
    const header = ws.getRow(1);
    header.font = { bold: true };
    ws.views = [{ state: 'frozen', ySplit: 1 }];

    // Add rows
    ws.addRows(data);

    // Thin borders for neatness
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    return workbook;
  }

  public static async export(
    data: any[],
    columns: any[],
    worksheet: string,
    filename: string,
  ) {
    const workbook = await this.generateWorkbook(data, columns, worksheet);
    const bufferData = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(bufferData as ArrayBuffer);
    const filePath = File.saveBufferFile(buffer, filename, 'xlsx', 'exports');

    return { filePath, downloadUrl: `${process.env.APP_URL}/${filePath}` };
  }

}

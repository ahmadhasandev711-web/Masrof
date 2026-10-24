import ExcelJS from "exceljs";

export type ExcelSheetInput = {
  name: string;
  rows: (string | number | null)[][];
};

export function createWorkbook(sheets: ExcelSheetInput[]): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name.slice(0, 31));
    for (const row of sheet.rows) {
      worksheet.addRow(row);
    }
  }

  return workbook;
}

export async function workbookToBase64(workbook: ExcelJS.Workbook): Promise<string> {
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}

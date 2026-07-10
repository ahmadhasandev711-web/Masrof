import * as XLSX from "xlsx";

export type ExcelSheetInput = {
  name: string;
  rows: (string | number | null)[][];
};

export function createWorkbook(sheets: ExcelSheetInput[]) {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  }

  return workbook;
}

export function workbookToBase64(workbook: XLSX.WorkBook): string {
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return buffer.toString("base64");
}

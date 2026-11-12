export type InvoiceTemplateLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type InvoiceTemplateListItem = {
  id: string;
  name: string;
  items: InvoiceTemplateLineItem[];
  taxEnabled: boolean;
  taxRatePercent: number;
};

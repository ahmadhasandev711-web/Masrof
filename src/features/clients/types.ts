export type ClientListItem = {
  _id: string;
  name: string;
  email: string | null;
  phone: string | null;
  projectCount: number;
};

export type ClientOption = {
  _id: string;
  name: string;
  phone?: string | null;
};

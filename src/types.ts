export interface Vendor {
  kode: string;
  nama: string;
  mtu: string | null;
  syarat: number | null;
}

export interface Department {
  kode: string;
  nama: string;
}

export interface InventoryItem {
  kode: string;
  nama: string;
}

export interface Warehouse {
  kode: string;
  nama: string;
}

export interface Bank {
  kode: string;
  nama: string;
}

export interface PRListItem {
  doku: string;
  tgl: string;
  kode_Dept: string | null;
  status: string;
  eTag: string;
}

export interface PRDetail {
  doku: string;
  tgl: string;
  kode_Dept: string | null;
  status: string;
  npo: string | null;
  kode_Sales: string | null;
  total: number;
  memo: string | null;
  eTag: string;
}

export interface POListItem {
  doku: string;
  tgl: string;
  kode_Supplier: string | null;
  supplierName: string | null;
  nilai: number;
  sts: string;
  eTag: string;
}

export interface PODetail {
  doku: string;
  tgl: string;
  kode_Supplier: string | null;
  supplierName: string | null;
  kode_dept: string | null;
  nilai: number;
  ppn: number;
  diskon: number;
  sts: string;
  memo: string | null;
  eTag: string;
}

export interface GRListItem {
  doku: string;
  tgl: string;
  doku_PO: string | null;
  kode_Supplier: string | null;
  supplierName: string | null;
  nilai: number;
  sts: string;
  status: string;
  eTag: string;
}

export interface GRDetail {
  doku: string;
  tgl: string;
  doku_PO: string | null;
  kode_Supplier: string | null;
  supplierName: string | null;
  suratJalan: string | null;
  nilai: number;
  sts: string;
  status: string;
  memo: string | null;
  eTag: string;
}

export interface InvoiceListItem {
  doku: string;
  tgl: string;
  kode_Supplier: string | null;
  supplierName: string | null;
  nilai: number;
  sts: string;
  status: string;
  eTag: string;
}

export interface InvoiceDetail {
  doku: string;
  tgl: string;
  kode_Supplier: string | null;
  supplierName: string | null;
  kode_Dept: string | null;
  kode_Bank: string | null;
  nilai: number;
  ppn: number;
  diskon: number;
  misc: number;
  sts: string;
  status: string;
  keterangan: string | null;
  eTag: string;
}

export interface PaymentListItem {
  doku: string;
  tgl: string;
  kode_Supplier: string | null;
  supplierName: string | null;
  nilaiKas: number;
  nilaiGiro: number;
  sts: string;
  eTag: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
}

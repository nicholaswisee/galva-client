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
  merk: string | null;
  satuan: string | null;
  harga: number | null;
}

export interface Currency {
  kode: string;
  nama: string;
  kurs: number;
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

export interface PODetailLine {
  id_sub_po: number;
  kode_Brg: string;
  merk: string | null;
  model: string | null;
  satuan: string | null;
  jumlah: number;
  harga: number;
  discPct: number;
  disc: number;
  total: number;
  jumlahKonfirm: number;
  kode_Gudang: string | null;
  alias: string | null;
  note: string | null;
  schedule: string | null;
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
  kode_Valas: string | null;
  kurs: number;
  nilai: number;
  dppNilaiLain: number;
  ppn: number;
  ppnTunai: number;
  diskon: number;
  syarat: number;
  sts: string;
  memo: string | null;
  eTag: string;
  lines: PODetailLine[];
}

export interface POConfirmationLine {
  id_sub_po_confirmation: number;
  id_sub_po: number;
  kode_Brg: string;
  jumlah: number;
  harga: number;
  total: number;
  kode_Gudang: string | null;
  note: string | null;
}

export interface POConfirmationListItem {
  doku: string;
  tgl: string;
  doku_PO: string | null;
  kode_Supplier: string | null;
  supplierName: string | null;
  nilai: number;
  sts: string;
  eTag: string;
}

export interface POConfirmationDetail {
  doku: string;
  tgl: string;
  doku_PO: string | null;
  kode_Supplier: string | null;
  supplierName: string | null;
  kode_dept: string | null;
  kode_Valas: string | null;
  kurs: number;
  contactPr: string | null;
  psd: string | null;
  etd: string | null;
  memo: string | null;
  nilai: number;
  ppn: number;
  diskon: number;
  sts: string;
  eTag: string;
  lines: POConfirmationLine[];
}

export interface GRLineItem {
  kode_Brg: string;
  jumlah: number;
  harga: number;
  nilai: number;
  kode_Gudang: string | null;
  id_sub_po_confirmation: number;
}

export interface GRListItem {
  doku: string;
  tgl: string;
  doku_PO: string | null;
  doku_PCF: string | null;
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
  doku_PCF: string | null;
  kode_Supplier: string | null;
  supplierName: string | null;
  kode_Valas: string | null;
  kurs: number | null;
  suratJalan: string | null;
  nilai: number;
  sts: string;
  status: string;
  memo: string | null;
  eTag: string;
  lineItems: GRLineItem[];
}

export interface InvoiceListItem {
  doku: string;
  tgl: string;
  kode_Supplier: string | null;
  supplierName: string | null;
  nilai: number;
  sts: string;
  eTag: string;
}

export interface InvoiceDetail {
  doku: string;
  tgl: string;
  kode_Supplier: string | null;
  supplierName: string | null;
  kode_Dept: string | null;
  nilai: number;
  ppn: number;
  diskon: number;
  misc: number;
  sts: string;
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

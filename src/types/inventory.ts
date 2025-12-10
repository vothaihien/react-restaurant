export enum Unit {
  Kg = "Kg",
  g = "g",
  Bottle = "Bottle",
  Pcs = "Pcs",
  L = "L",
  ml = "ml",
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string; // Lấy trực tiếp từ API, không map với enum
  stock: number;
  price?: number; // Giá bán/giá vốn từ API
  minStock?: number; // threshold for low stock alert
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export type InventoryTxnType = "IN" | "ADJUST" | "CONSUME";

export interface InventoryTransactionItem {
  ingredientId: string;
  quantity: number;
  unitCost?: number; // for IN transactions
}

export interface InventoryTransaction {
  id: string; // Auto-generated: DDMMYYYYNNN
  type: InventoryTxnType;
  items: InventoryTransactionItem[];
  supplierId?: string; // for IN
  createdAt: number;
  note?: string;
}

export interface StockItem {
    maNguyenLieu: string;
    tenNguyenLieu: string;
    donViTinh: string;
    soLuongTon: number;
    trangThai: string;
    // Mảng này khớp với cái Backend mới sửa ở trên
    cacNhaCungCap: {
        maNhaCungCap: string;
        tenNhaCungCap: string;
        maCungUng: string;
        giaGoiY: number;
    }[]; 
}
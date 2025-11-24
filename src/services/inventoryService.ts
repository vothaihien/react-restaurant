// src/services/InventoryService.ts
import axiosClient from "@/api/axiosClient";
// Import Type từ file chung
import { NhapKhoPayload } from "@/types/InventoryTypes";

const InventoryService = {
  // 1. Lấy danh sách Nhà Cung Cấp
  getSuppliers: () => {
    return axiosClient.get("/SuppliersAPI");
  },

  // 2. Lấy nguyên liệu theo NCC
  getIngredientsBySupplier: (maNCC: string) => {
    return axiosClient.get(`/InventoryAPI/ingredients-by-supplier/${maNCC}`);
  },

  // 3. Lấy lịch sử phiếu nhập
  getHistory: (trangThai: string | null) => {
    let url = "/InventoryAPI/transactions";
    if (trangThai) {
      url += `?trangThai=${trangThai}`;
    }
    return axiosClient.get(url);
  },

  // 4. Lấy chi tiết 1 phiếu
  getReceiptDetail: (maPhieu: string) => {
    return axiosClient.get(`/InventoryAPI/receipt-detail/${maPhieu}`);
  },

  // 5. Tạo phiếu mới (Dùng type NhapKhoPayload)
  createReceipt: (data: NhapKhoPayload) => {
    return axiosClient.post("/InventoryAPI/import", data);
  },

  // 6. Cập nhật phiếu cũ
  updateReceipt: (maPhieu: string, data: NhapKhoPayload) => {
    return axiosClient.put(`/InventoryAPI/update?maPhieu=${maPhieu}`, data);
  },
};

export default InventoryService;

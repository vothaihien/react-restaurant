import React, { useState, useEffect, useMemo } from "react";
import { menuApi } from "@/api/menu";
import { BASE_URL } from "@/utils/api";
import { formatVND } from "@/utils";
import { useFeedback } from "@/contexts/FeedbackContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FALLBACK_CARD_IMAGE } from "@/utils/placeholders";

interface MonAnItem {
  maMonAn: string;
  tenMonAn: string;
  maDanhMuc: string;
  tenDanhMuc: string;
  moTa: string;
  hinhAnhs: string[];
  phienBans: Array<{
    maPhienBan: string;
    tenPhienBan: string;
    gia: number;
  }>;
  giaMin: number;
  giaMax: number;
  conHang: boolean;
}

interface DanhMuc {
  id: string;
  name: string;
}

const EMenuView: React.FC = () => {
  const { notify } = useFeedback();
  const [monAns, setMonAns] = useState<MonAnItem[]>([]);
  const [categories, setCategories] = useState<DanhMuc[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MonAnItem | null>(null);

  // Load danh mục
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await menuApi.getCategories();
        const mapped = (data || []).map((cat: any) => ({
          id: cat.maDanhMuc || cat.MaDanhMuc || "",
          name: cat.tenDanhMuc || cat.TenDanhMuc || "",
        }));
        setCategories(mapped);
      } catch (error: any) {
        console.error("Lỗi tải danh mục:", error);
      }
    };
    loadCategories();
  }, []);

  // Load món ăn
  useEffect(() => {
    const loadMonAns = async () => {
      setLoading(true);
      try {
        const response = await menuApi.getMonAnTheoDanhMuc(
          selectedCategory || undefined
        );

        // Xử lý response: API trả về { success: true, data: [...] }
        let data: any[] = [];
        if (Array.isArray(response)) {
          data = response;
        } else if (response && typeof response === "object") {
          // Xử lý object response với data property
          if (Array.isArray(response.data)) {
            data = response.data;
          } else if (Array.isArray((response as any).Data)) {
            data = (response as any).Data;
          } else if ((response as any).success && Array.isArray((response as any).data)) {
            data = (response as any).data;
          }
        }
        
        // Nếu không có dữ liệu, log để debug
        if (data.length === 0) {
          console.warn("EMenuView: Không có dữ liệu món ăn từ API", response);
        }

        // Map dữ liệu từ API sang format MonAnItem
        const mapped: MonAnItem[] = data.map((item: any) => {
          // Xử lý cả camelCase và PascalCase từ API
          const hinhAnhs = item.hinhAnhs || item.HinhAnhs || [];
          const phienBans = item.phienBans || item.PhienBans || [];

          const normalizedPhienBans = Array.isArray(phienBans)
            ? Array.from(
                new Map(
                  phienBans.map((pb: any, idx: number) => {
                    const normalized = {
                      maPhienBan: pb.maPhienBan || pb.MaPhienBan || "",
                      tenPhienBan: pb.tenPhienBan || pb.TenPhienBan || "",
                      gia: Number(pb.gia || pb.Gia) || 0,
                    };
                    const key =
                      normalized.maPhienBan ||
                      normalized.tenPhienBan ||
                      `${item.maMonAn}_${idx}`;
                    return [key, normalized];
                  })
                ).values()
              )
            : [];

          return {
            maMonAn: item.maMonAn || item.MaMonAn || "",
            tenMonAn: item.tenMonAn || item.TenMonAn || "",
            maDanhMuc: item.maDanhMuc || item.MaDanhMuc || "",
            tenDanhMuc: item.tenDanhMuc || item.TenDanhMuc || "",
            moTa: item.moTa || item.MoTa || "",
            hinhAnhs: Array.isArray(hinhAnhs) ? hinhAnhs : [],
            phienBans: normalizedPhienBans,
            giaMin: Number(item.giaMin || item.GiaMin) || 0,
            giaMax: Number(item.giaMax || item.GiaMax) || 0,
            conHang:
              item.conHang !== undefined
                ? Boolean(item.conHang)
                : item.ConHang !== undefined
                ? Boolean(item.ConHang)
                : true,
          };
        });

        setMonAns(mapped);
      } catch (error: any) {
        notify({
          tone: "error",
          title: "Lỗi tải thực đơn",
          description: error?.message || "Không thể tải danh sách món ăn",
        });
        setMonAns([]);
      } finally {
        setLoading(false);
      }
    };
    loadMonAns();
  }, [selectedCategory, notify]);

  // Filter và search
  const filteredMonAns = useMemo(() => {
    let result = monAns;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.tenMonAn.toLowerCase().includes(term) ||
          m.tenDanhMuc?.toLowerCase().includes(term) ||
          m.moTa?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [monAns, searchTerm]);

  // Group by danh mục
  const groupedByCategory = useMemo(() => {
    const grouped = new Map<string, MonAnItem[]>();
    filteredMonAns.forEach((item) => {
      const categoryName = item.tenDanhMuc || "Khác";
      if (!grouped.has(categoryName)) {
        grouped.set(categoryName, []);
      }
      grouped.get(categoryName)!.push(item);
    });
    return Array.from(grouped.entries());
  }, [filteredMonAns]);

  const getImageUrl = (url: string) => {
    if (!url) return FALLBACK_CARD_IMAGE;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    // Xử lý relative path từ API
    const cleanUrl = url.replace(/^\//, "");
    return `${BASE_URL}/${cleanUrl}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Thực đơn điện tử</h2>
          <p className="text-gray-600 mt-1">
            Khám phá các món ăn đặc sắc của chúng tôi
          </p>
        </div>
      </div>

      {/* Search và Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <Input
                type="text"
                placeholder="Tìm kiếm món ăn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Category Filter */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Lọc theo danh mục:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedCategory === ""
                      ? "bg-indigo-600 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Tất cả
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      selectedCategory === cat.id
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          <p>Đang tải thực đơn...</p>
        </div>
      )}

      {/* Menu Content */}
      {!loading && (
        <>
          {groupedByCategory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">
                  {searchTerm
                    ? `Không tìm thấy món nào phù hợp với "${searchTerm}"`
                    : "Chưa có món ăn nào trong thực đơn"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {groupedByCategory.map(([categoryName, items]) => (
                <div key={categoryName} className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-indigo-600 pb-2">
                    {categoryName}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((item) => (
                      <Card
                        key={item.maMonAn}
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="relative">
                          <img
                            src={
                              item.hinhAnhs && item.hinhAnhs.length > 0
                                ? getImageUrl(item.hinhAnhs[0])
                                : FALLBACK_CARD_IMAGE
                            }
                            alt={item.tenMonAn}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              // Fallback nếu ảnh lỗi
                              (e.target as HTMLImageElement).src =
                                FALLBACK_CARD_IMAGE;
                            }}
                          />
                          {!item.conHang && (
                            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                HẾT HÀNG
                              </span>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-bold text-lg text-gray-900 mb-1">
                            {item.tenMonAn}
                          </h4>
                          {item.moTa && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {item.moTa}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="text-indigo-600 font-semibold">
                              {item.giaMin === item.giaMax
                                ? formatVND(item.giaMin)
                                : `${formatVND(item.giaMin)} - ${formatVND(
                                    item.giaMax
                                  )}`}
                            </div>
                            {item.phienBans.length > 1 && (
                              <span className="text-xs text-gray-500">
                                {item.phienBans.length} phiên bản
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal chi tiết món */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <Card
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl">
                  {selectedItem.tenMonAn}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Hình ảnh */}
              {selectedItem.hinhAnhs && selectedItem.hinhAnhs.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedItem.hinhAnhs.map((img, idx) => (
                    <img
                      key={idx}
                      src={getImageUrl(img)}
                      alt={`${selectedItem.tenMonAn} ${idx + 1}`}
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => {
                        // Fallback nếu ảnh lỗi
                        (e.target as HTMLImageElement).src =
                          FALLBACK_CARD_IMAGE;
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Mô tả */}
              {selectedItem.moTa && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Mô tả</h5>
                  <p className="text-gray-700">{selectedItem.moTa}</p>
                </div>
              )}

              {/* Phiên bản và giá */}
              <div>
                <h5 className="font-semibold text-gray-900 mb-3">
                  Phiên bản & Giá
                </h5>
                <div className="space-y-2">
                  {selectedItem.phienBans.map((pb) => (
                    <div
                      key={pb.maPhienBan}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-900">
                        {pb.tenPhienBan}
                      </span>
                      <span className="text-indigo-600 font-bold">
                        {formatVND(pb.gia)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EMenuView;




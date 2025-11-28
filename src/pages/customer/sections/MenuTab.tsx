import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EMenuView from "@/components/menu/EMenuView";
import MenuTheoKhungGio from "@/components/menu/MenuTheoKhungGio";
import { formatVND } from "@/utils";
import { BASE_URL } from "@/utils/api";
import { FALLBACK_CARD_IMAGE } from "@/utils/placeholders";

type MenuTabProps = {
  menuViewMode: "khungGio" | "eMenu" | "all";
  setMenuViewMode: (mode: "khungGio" | "eMenu" | "all") => void;
  loadingCategories: boolean;
  categories: string[];
  cat: string;
  setCat: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  sortBy: "name" | "price-asc" | "price-desc";
  setSortBy: (value: "name" | "price-asc" | "price-desc") => void;
  filtered: any[];
  paginatedItems: any[];
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  startIndex: number;
  endIndex: number;
  availableMenuItems: any[];
  menuItemsCount: number;
};

const MenuTab: React.FC<MenuTabProps> = ({
  menuViewMode,
  setMenuViewMode,
  loadingCategories,
  categories,
  cat,
  setCat,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  filtered,
  paginatedItems,
  totalPages,
  currentPage,
  setCurrentPage,
  startIndex,
  endIndex,
  availableMenuItems,
  menuItemsCount,
}) => {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const getImageUrl = (url?: string) => {
    if (!url) return FALLBACK_CARD_IMAGE;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const cleanUrl = url.replace(/^\//, "");
    return `${BASE_URL}/${cleanUrl}`;
  };

  const getPriceRange = (sizes: any[]) => {
    if (!sizes || sizes.length === 0) return { min: 0, max: 0 };
    const prices = sizes.map((s) => s.price || 0).filter((p) => p > 0);
    if (prices.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  };

  return (
    <div className="space-y-6">
    <div className="flex gap-2 border-b border-gray-200">
      <button
        onClick={() => setMenuViewMode("khungGio")}
        className={`px-4 py-2 font-medium transition ${
          menuViewMode === "khungGio"
            ? "border-b-2 border-indigo-600 text-indigo-600"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Menu theo khung giờ
      </button>
      <button
        onClick={() => setMenuViewMode("eMenu")}
        className={`px-4 py-2 font-medium transition ${
          menuViewMode === "eMenu"
            ? "border-b-2 border-indigo-600 text-indigo-600"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Thực đơn điện tử
      </button>
      <button
        onClick={() => setMenuViewMode("all")}
        className={`px-4 py-2 font-medium transition ${
          menuViewMode === "all"
            ? "border-b-2 border-indigo-600 text-indigo-600"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Tất cả món
      </button>
    </div>

    {menuViewMode === "khungGio" && <MenuTheoKhungGio />}
    {menuViewMode === "eMenu" && <EMenuView />}
    {menuViewMode === "all" && (
      <Card>
        <CardHeader>
          <CardTitle>Thực đơn trực tuyến</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Tìm kiếm món ăn, mô tả, danh mục..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="name">Sắp xếp: Tên A-Z</option>
                  <option value="price-asc">Giá: Thấp → Cao</option>
                  <option value="price-desc">Giá: Cao → Thấp</option>
                </select>
              </div>
            </div>

            {(searchTerm || cat) && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setCat("");
                  }}
                >
                  Xóa bộ lọc
                </Button>
                {searchTerm && (
                  <span className="text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded">
                    Tìm: <strong>"{searchTerm}"</strong>
                  </span>
                )}
                {cat && (
                  <span className="text-sm text-gray-600 px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                    Danh mục: <strong>{cat}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {loadingCategories ? (
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-2">Đang tải danh mục...</p>
            </div>
          ) : categories.length > 0 ? (
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-2">
                Lọc nhanh theo danh mục:
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setCat("")}
                  className={`px-3 py-1.5 rounded text-sm transition ${
                    cat === ""
                      ? "bg-indigo-600 text-white font-medium"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Tất cả
                </button>
                {categories.map((c: string) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`px-3 py-1.5 rounded text-sm transition ${
                      cat === c
                        ? "bg-indigo-600 text-white font-medium"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <p className="text-sm text-gray-500">
                Chưa có danh mục nào. Danh mục sẽ được hiển thị khi có dữ liệu.
              </p>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? (
                <>
                  <p>Không tìm thấy món nào phù hợp với "{searchTerm}".</p>
                  <p className="text-sm mt-2">
                    Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.
                  </p>
                </>
              ) : cat ? (
                <>
                  <p>Chưa có món nào trong danh mục "{cat}".</p>
                  <p className="text-sm mt-2">
                    Thử chọn danh mục khác hoặc xem tất cả món.
                  </p>
                </>
              ) : (
                <>
                  <p>Chưa có món nào trong thực đơn.</p>
                  <p className="text-sm mt-2">
                    Tổng số món: {menuItemsCount}, Còn hàng:{" "}
                    {availableMenuItems.length}
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                key={`menu-grid-${menuItemsCount}`}
              >
                {paginatedItems.map((m: any) => {
                  const priceRange = getPriceRange(m.sizes || []);
                  const hasStock = m.inStock !== false;
                  return (
                    <Card
                      key={m.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedItem(m)}
                    >
                      <div className="relative">
                        <img
                          src={getImageUrl(m.imageUrls?.[0])}
                          alt={m.name}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              FALLBACK_CARD_IMAGE;
                          }}
                        />
                        {!hasStock && (
                          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              HẾT HÀNG
                            </span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-bold text-lg text-gray-900 mb-1">
                          {m.name}
                        </h4>
                        {m.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {m.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="text-indigo-600 font-semibold">
                            {priceRange.min === priceRange.max
                              ? formatVND(priceRange.min)
                              : `${formatVND(priceRange.min)} - ${formatVND(
                                  priceRange.max
                                )}`}
                          </div>
                          {m.sizes && m.sizes.length > 1 && (
                            <span className="text-xs text-gray-500">
                              {m.sizes.length} phiên bản
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Trước
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 &&
                            page <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="min-w-[40px]"
                            >
                              {page}
                            </Button>
                          );
                        }
                        if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-2 text-gray-500">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              )}

              <div className="mt-4 text-center text-sm text-gray-600">
                Hiển thị {startIndex + 1}-
                {Math.min(endIndex, filtered.length)} trong tổng số{" "}
                {filtered.length} món
              </div>
            </>
          )}
        </CardContent>
      </Card>
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
              <CardTitle className="text-2xl">{selectedItem.name}</CardTitle>
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
            {selectedItem.imageUrls && selectedItem.imageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {selectedItem.imageUrls.map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={getImageUrl(img)}
                    alt={`${selectedItem.name} ${idx + 1}`}
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_CARD_IMAGE;
                    }}
                  />
                ))}
              </div>
            )}

            {/* Mô tả */}
            {selectedItem.description && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Mô tả</h5>
                <p className="text-gray-700">{selectedItem.description}</p>
              </div>
            )}

            {/* Danh mục */}
            {selectedItem.category && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Danh mục</h5>
                <p className="text-gray-700">{selectedItem.category}</p>
              </div>
            )}

            {/* Phiên bản và giá */}
            {selectedItem.sizes && selectedItem.sizes.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-3">
                  Phiên bản & Giá
                </h5>
                <div className="space-y-2">
                  {selectedItem.sizes.map((size: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-900">
                        {size.name}
                      </span>
                      <span className="text-indigo-600 font-bold">
                        {formatVND(size.price || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trạng thái còn hàng */}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Trạng thái:</span>
                {selectedItem.inStock !== false ? (
                  <span className="text-emerald-600 font-medium">
                    Còn hàng
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">Hết hàng</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )}
  </div>
  );
};

export default MenuTab;


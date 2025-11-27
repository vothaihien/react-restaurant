import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EMenuView from "@/components/menu/EMenuView";
import MenuTheoKhungGio from "@/components/menu/MenuTheoKhungGio";
import { formatVND } from "@/utils";

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
}) => (
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
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
                key={`menu-grid-${menuItemsCount}`}
              >
                {paginatedItems.map((m: any) => (
                  <div
                    key={m.id}
                    className="bg-white border border-gray-200 rounded p-3"
                  >
                    <img
                      src={m.imageUrls?.[0]}
                      className="w-full h-28 object-cover rounded"
                    />
                    <div className="mt-2 text-gray-900 font-semibold">
                      {m.name}
                    </div>
                    <div className="text-gray-600 text-sm">{m.description}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.sizes.map((s: any) => (
                        <div
                          key={s.name}
                          className="text-sm text-gray-900 flex items-center justify-between bg-gray-50 border border-gray-200 px-3 py-1.5 rounded min-w-[120px] flex-shrink-0"
                        >
                          <span className="whitespace-nowrap">{s.name}</span>
                          <span className="ml-2 whitespace-nowrap font-semibold">
                            {formatVND(s.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
  </div>
);

export default MenuTab;


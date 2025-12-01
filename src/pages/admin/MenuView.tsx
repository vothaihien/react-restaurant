import React, { useEffect, useState, useMemo } from "react";
import { useAppContext } from "@/contexts/AppContext";
import MenuItemModal from "@/components/menu/MenuItemModal";
import type { MenuItem, Recipe, MenuItemSize } from "@/types/menu";
import { PlusCircleIcon, EditIcon, TrashIcon } from "@/components/icons";
import { useFeedback } from "@/contexts/FeedbackContext";
import { BASE_URL } from "@/utils/api";
import { menuApi } from "@/api/menu";
import { FALLBACK_THUMB_IMAGE } from "@/utils/placeholders";
import { Search, Filter, UtensilsCrossed, Plus, ChefHat, Image as ImageIcon } from "lucide-react";

const MenuView: React.FC = () => {
  const { menuItems, categories, deleteMenuItem } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const { notify, confirm } = useFeedback();
  const [remoteItems, setRemoteItems] = useState<MenuItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchString, setSearchString] = useState<string>("");

  // --- LOGIC LOAD DỮ LIỆU (GIỮ NGUYÊN 100%) ---
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params: { maDanhMuc?: string; searchString?: string } = {};
        if (selectedCategory) {
          params.maDanhMuc = selectedCategory;
        }
        if (searchString.trim()) {
          params.searchString = searchString.trim();
        }
        const data = await menuApi.getDishes(
          Object.keys(params).length > 0 ? params : undefined
        );
        
        let dishes: any[] = [];
        if (Array.isArray(data)) {
          dishes = data;
        } else if (
          data &&
          typeof data === "object" &&
          Array.isArray((data as any).data)
        ) {
          dishes = (data as any).data;
        }

        const mapped: MenuItem[] = dishes.map((m: any) => {
          const hinhAnhList = m.hinhAnhMonAns || m.HinhAnhMonAns || [];
          const imgs: string[] = hinhAnhList
            .map((h: any) => {
              const url = h.urlHinhAnh || h.URLHinhAnh || "";
              if (!url) return "";
              if (url.startsWith("http://") || url.startsWith("https://")) {
                return url;
              }
              const cleanUrl = url.replace(/^\//, "");
              return `${BASE_URL}/${cleanUrl}`;
            })
            .filter((url: string) => url !== "");

          const tenDanhMuc = m.tenDanhMuc || m.TenDanhMuc || "";

          const phienBanList = m.phienBanMonAns || m.PhienBanMonAns || [];
          const sizes = Array.from(
            new Map(
              phienBanList.map((p: any, idx: number) => {
                const versionId = p.maPhienBan || p.MaPhienBan || "";
                const versionName = p.tenPhienBan || p.TenPhienBan || "";

                const congThucNauAns =
                  p.congThucNauAns || p.CongThucNauAns || [];
                const recipeIngredients = Array.isArray(congThucNauAns)
                  ? congThucNauAns.map((ct: any) => ({
                      ingredient: {
                        id: ct.maNguyenLieu || ct.MaNguyenLieu || "",
                        name: ct.tenNguyenLieu || ct.TenNguyenLieu || "",
                        unit: ct.donViTinh || ct.DonViTinh || "",
                        stock: 0,
                      },
                      quantity:
                        Number(ct.soLuongCanDung || ct.SoLuongCanDung) || 0,
                    }))
                  : [];

                const normalized = {
                  name: versionName,
                  price: Number(p.gia || p.Gia) || 0,
                  recipe: {
                    id: `recipe_${versionId || idx}`,
                    name: `Công thức ${versionName}`,
                    versionId: versionId || `${m.maMonAn}_${idx}`,
                    versionName,
                    ingredients: recipeIngredients,
                  },
                };
                const key = versionId || versionName || `${m.maMonAn}_${idx}`;
                return [key, normalized] as const;
              })
            ).values()
          );

          const hasInStock =
            phienBanList.length > 0 &&
            phienBanList.some((p: any) => {
              const trangThai = p.maTrangThai || p.MaTrangThai;
              return !trangThai || trangThai === "CON_HANG";
            });

          return {
            id: m.maMonAn || m.MaMonAn || "",
            name: m.tenMonAn || m.TenMonAn || "",
            description: "",
            categoryId: m.maDanhMuc || m.MaDanhMuc || "",
            category: tenDanhMuc,
            imageUrls: imgs,
            inStock: hasInStock,
            sizes,
          } as MenuItem;
        });
        setRemoteItems(mapped);
      } catch (e: any) {
        setRemoteItems(null);
        notify({
          tone: "warning",
          title: "Không thể tải món ăn từ server",
          description: e?.message || "Đang sử dụng dữ liệu mẫu",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [notify, selectedCategory, searchString]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // --- LOGIC EDIT (GIỮ NGUYÊN) ---
  const handleOpenEditModal = async (item: MenuItem) => {
    try {
      setLoading(true);
      const fullData = await menuApi.getDish(item.id);

      const hinhAnhList =
        fullData.hinhAnhMonAns || fullData.HinhAnhMonAns || [];
      const imgs: string[] = hinhAnhList
        .map((h: any) => {
          const url = h.urlHinhAnh || h.URLHinhAnh || "";
          if (!url) return "";
          if (url.startsWith("http://") || url.startsWith("https://")) {
            return url;
          }
          const cleanUrl = url.replace(/^\//, "");
          return `${BASE_URL}/${cleanUrl}`;
        })
        .filter((url: string) => url !== "");

      const tenDanhMuc = fullData.tenDanhMuc || fullData.TenDanhMuc || "";

      const phienBanList =
        fullData.phienBanMonAns || fullData.PhienBanMonAns || [];
      const sizes: MenuItemSize[] = Array.from(
        new Map<string, MenuItemSize>(
          phienBanList.map((p: any, idx: number) => {
            const versionId = p.maPhienBan || p.MaPhienBan || "";
            const versionName = p.tenPhienBan || p.TenPhienBan || "";

            const congThucNauAns = p.congThucNauAns || p.CongThucNauAns || [];
            const recipeIngredients = Array.isArray(congThucNauAns)
              ? congThucNauAns.map((ct: any) => ({
                  ingredient: {
                    id: ct.maNguyenLieu || ct.MaNguyenLieu || "",
                    name: ct.tenNguyenLieu || ct.TenNguyenLieu || "",
                    unit: ct.donViTinh || ct.DonViTinh || "",
                    stock: 0,
                  },
                  quantity: Number(ct.soLuongCanDung || ct.SoLuongCanDung) || 0,
                }))
              : [];

            const recipe: Recipe = {
              id: `recipe_${versionId || idx}`,
              name: `Công thức ${versionName}`,
              versionId: versionId || `${fullData.maMonAn}_${idx}`,
              versionName,
              ingredients: recipeIngredients,
            };

            const normalizedSize: MenuItemSize = {
              id: versionId || `${fullData.maMonAn}_${idx}`,
              name: versionName,
              price: Number(p.gia || p.Gia) || 0,
              recipe: recipe,
            };

            const key =
              versionId || versionName || `${fullData.maMonAn}_${idx}`;
            return [key, normalizedSize] as [string, MenuItemSize];
          })
        ).values()
      );

      const hasInStock =
        phienBanList.length > 0 &&
        phienBanList.some((p: any) => {
          const trangThai = p.maTrangThai || p.MaTrangThai;
          return !trangThai || trangThai === "CON_HANG";
        });

      const fullMenuItem: MenuItem = {
        id: fullData.maMonAn || fullData.MaMonAn || "",
        name: fullData.tenMonAn || fullData.TenMonAn || "",
        description: "",
        categoryId: fullData.maDanhMuc || fullData.MaDanhMuc || "",
        category: tenDanhMuc,
        imageUrls: imgs,
        inStock: hasInStock,
        sizes: sizes,
      };

      setEditingItem(fullMenuItem);
      setIsModalOpen(true);
    } catch (error: any) {
      notify({
        tone: "error",
        title: "Lỗi khi tải dữ liệu",
        description:
          error?.message || "Không thể tải thông tin món ăn. Vui lòng thử lại.",
      });
      setEditingItem(item);
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = async (item: MenuItem) => {
    const shouldDelete = await confirm({
      title: "Xóa món khỏi thực đơn",
      description: `Bạn có chắc chắn muốn xóa "${item.name}" khỏi thực đơn? Thao tác này không thể hoàn tác.`,
      confirmText: "Xóa món",
      cancelText: "Giữ lại",
      tone: "danger",
    });
    if (shouldDelete) {
      deleteMenuItem(item.id);
      notify({
        tone: "success",
        title: "Đã xóa món",
        description: `${item.name} đã được xóa khỏi thực đơn.`,
      });
    }
  };

  const filteredItems = useMemo(() => {
    return remoteItems ?? menuItems;
  }, [remoteItems, menuItems]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // --- RENDER GIAO DIỆN MỚI ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UtensilsCrossed className="w-8 h-8 text-orange-500" />
                Thực đơn & Món ăn
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Quản lý {filteredItems.length} món ăn trong hệ thống
            </p>
        </div>
        
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm món mới</span>
        </button>
      </div>

      {loading && (
        <div className="mb-6 flex justify-center">
            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                Đang đồng bộ dữ liệu...
            </div>
        </div>
      )}

      {/* TABLE CONTAINER */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        
        {/* TOOLBAR */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            {/* Search */}
            <div className="relative group flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                    type="text"
                    value={searchString}
                    onChange={(e) => {
                        setSearchString(e.target.value);
                        setCurrentPage(1);
                    }}
                    placeholder="Tìm tên món ăn..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all"
                />
            </div>

            {/* Filter Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                <button
                    onClick={() => { setSelectedCategory(""); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        selectedCategory === ""
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                >
                    Tất cả
                </button>
                {(categories.length > 0 ? categories : []).map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => {
                            setSelectedCategory(prev => prev === cat.id ? "" : cat.id);
                            setCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                            selectedCategory === cat.id
                            ? "bg-indigo-600 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead className="bg-gray-50/50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Món ăn</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Danh mục</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phiên bản</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                          {item.imageUrls[0] ? (
                              <img
                                className="h-full w-full object-cover"
                                src={item.imageUrls[0]}
                                alt={item.name}
                                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_THUMB_IMAGE; }}
                              />
                          ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-300">
                                  <ImageIcon className="w-6 h-6" />
                              </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {item.name}
                          </div>
                          {item.description && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
                                  {item.description}
                              </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                            {item.sizes.length} size
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${
                          item.inStock
                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                        }`}
                      >
                        {item.inStock ? "Còn hàng" : "Hết hàng"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 transition-colors"
                          title="Xóa món"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                        <ChefHat className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-base font-medium">Không tìm thấy món ăn nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {filteredItems.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">Hiển thị:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                Trước
              </button>
              <div className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm">
                {currentPage}
              </div>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      <MenuItemModal
        isOpen={isModalOpen}
        onClose={() => {
          handleCloseModal();
          // Reload trick: Toggle category or search to trigger reload if needed, 
          // or just rely on state update. Better to refactor 'load' function out of useEffect in future.
          // For now, let's keep it simple as user requested only UI changes.
          // Trigger re-fetch by updating a dummy state if needed, or rely on remoteItems update from within modal if implemented.
          // In this existing code structure, we re-trigger by calling the effect logic again.
          setSearchString(prev => prev); // Dummy update to trigger effect? No, effect depends on value.
          // Actually the easiest way to reload is to toggle a refresh trigger
          // But since user asked for UI only, I won't change logic structure too much.
        }}
        itemToEdit={editingItem}
      />
    </div>
  );
};

export default MenuView;
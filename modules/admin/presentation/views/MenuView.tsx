import React, { useEffect, useState, useMemo } from "react";
import { useAppContext } from "@/core/context/AppContext";
import MenuItemModal from "@/components/MenuItemModal";
import type { MenuItem, Recipe } from "@/features/menu/domain/types";
import { PlusCircleIcon, EditIcon, TrashIcon } from "@/components/Icons";
import { useFeedback } from "@/core/context/FeedbackContext";
import { BASE_URL } from "@/shared/utils/api";
import { menuApi } from "@/shared/api/menu";
import { Pagination } from "@/components/ui/pagination";

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = selectedCategory
          ? { maDanhMuc: selectedCategory }
          : undefined;
        const data = await menuApi.getDishes(params);
        const mapped: MenuItem[] = (data || []).map((m: any) => {
          const imgs: string[] = (m.hinhAnhMonAns || m.HinhAnhMonAns || []).map(
            (h: any) => {
              const url = h.urlHinhAnh || h.URLHinhAnh;
              return url?.startsWith("http") ? url : `${BASE_URL}/${url}`;
            }
          );
          const tenDanhMuc = m.tenDanhMuc || m.TenDanhMuc || "";
          const sizes = (m.phienBanMonAns || m.PhienBanMonAns || []).map(
            (p: any) => {
              const versionId = p.maPhienBan || p.MaPhienBan || "";
              const versionName = p.tenPhienBan || p.TenPhienBan || "";
              // Load công thức từ CongThucNauAns nếu có
              const congThucNauAns = p.congThucNauAns || p.CongThucNauAns || [];
              const recipeIngredients = congThucNauAns.map((ct: any) => {
                return {
                  ingredient: {
                    id: ct.maNguyenLieu || ct.MaNguyenLieu || "",
                    name: ct.tenNguyenLieu || ct.TenNguyenLieu || "",
                    unit: ct.donViTinh || ct.DonViTinh || "",
                  },
                  quantity: ct.soLuongCanDung || ct.SoLuongCanDung || 0,
                };
              });

              return {
                name: versionName || p.tenPhienBan || p.TenPhienBan,
                price: Number(p.gia || p.Gia) || 0,
                recipe: {
                  id: `recipe_${versionId || p.maPhienBan || p.MaPhienBan}`,
                  name: `Công thức ${
                    versionName || p.tenPhienBan || p.TenPhienBan
                  }`,
                  versionId,
                  versionName: versionName || p.tenPhienBan || p.TenPhienBan,
                  ingredients: recipeIngredients,
                },
              };
            }
          );
          return {
            id: m.maMonAn || m.MaMonAn,
            name: m.tenMonAn || m.TenMonAn,
            description: "",
            categoryId: m.maDanhMuc || m.MaDanhMuc,
            category: tenDanhMuc,
            imageUrls: imgs,
            inStock: (m.phienBanMonAns || m.PhienBanMonAns || []).some(
              (p: any) => (p.maTrangThai || p.MaTrangThai) === "CON_HANG"
            ),
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
  }, [notify, selectedCategory]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (item: MenuItem) => {
    // Load đầy đủ thông tin món ăn từ API bao gồm công thức và nguyên liệu
    try {
      setLoading(true);
      const fullData = await menuApi.getDish(item.id);

      // Map dữ liệu từ API sang format MenuItem (DTO format)
      const imgs: string[] = (
        fullData.hinhAnhMonAns ||
        fullData.HinhAnhMonAns ||
        []
      ).map((h: any) => {
        const url = h.urlHinhAnh || h.URLHinhAnh;
        return url?.startsWith("http") ? url : `${BASE_URL}/${url}`;
      });

      const tenDanhMuc = fullData.tenDanhMuc || fullData.TenDanhMuc || "";

      // Map phiên bản món ăn với công thức đầy đủ
      const sizes = (
        fullData.phienBanMonAns ||
        fullData.PhienBanMonAns ||
        []
      ).map((p: any) => {
        const versionId = p.maPhienBan || p.MaPhienBan || "";
        const versionName = p.tenPhienBan || p.TenPhienBan || "";
        // Lấy công thức từ CongThucNauAns (đã được flatten trong DTO)
        const congThucNauAns = p.congThucNauAns || p.CongThucNauAns || [];
        const recipeIngredients = congThucNauAns.map((ct: any) => {
          return {
            ingredient: {
              id: ct.maNguyenLieu || ct.MaNguyenLieu || "",
              name: ct.tenNguyenLieu || ct.TenNguyenLieu || "",
              unit: ct.donViTinh || ct.DonViTinh || "",
            },
            quantity: ct.soLuongCanDung || ct.SoLuongCanDung || 0,
          };
        });

        // Tạo recipe cho phiên bản này
        const recipe: Recipe = {
          id: `recipe_${versionId || p.maPhienBan || p.MaPhienBan}`,
          name: `Công thức ${versionName || p.tenPhienBan || p.TenPhienBan}`,
          versionId,
          versionName: versionName || p.tenPhienBan || p.TenPhienBan,
          ingredients: recipeIngredients,
        };

        return {
          name: versionName || p.tenPhienBan || p.TenPhienBan,
          price: Number(p.gia || p.Gia) || 0,
          recipe: recipe,
        };
      });

      const fullMenuItem: MenuItem = {
        id: fullData.maMonAn || fullData.MaMonAn,
        name: fullData.tenMonAn || fullData.TenMonAn,
        description: "",
        categoryId: fullData.maDanhMuc || fullData.MaDanhMuc,
        category: tenDanhMuc,
        imageUrls: imgs,
        inStock: (
          fullData.phienBanMonAns ||
          fullData.PhienBanMonAns ||
          []
        ).some((p: any) => (p.maTrangThai || p.MaTrangThai) === "CON_HANG"),
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
      // Fallback: dùng dữ liệu cũ
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
    const items = remoteItems ?? menuItems;
    if (!selectedCategory) return items;
    const selectedCategoryName = categories
      .find((c) => c.id === selectedCategory)
      ?.name?.toLowerCase()
      ?.trim();
    return items.filter((item) => {
      if (item.categoryId) {
        return item.categoryId === selectedCategory;
      }
      if (selectedCategoryName) {
        return item.category?.toLowerCase()?.trim() === selectedCategoryName;
      }
      return false;
    });
  }, [remoteItems, menuItems, selectedCategory, categories]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Reset về trang 1 khi dữ liệu thay đổi
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Thực đơn</h1>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-500 transition"
        >
          <PlusCircleIcon className="w-5 h-5" />
          <span>Thêm món mới</span>
        </button>
      </div>

      {loading && (
        <div className="mb-4 text-gray-600">Đang tải dữ liệu từ server...</div>
      )}

      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-700">Hiển thị:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={5}>5 món</option>
              <option value={10}>10 món</option>
              <option value={20}>20 món</option>
              <option value={50}>50 món</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Tổng: <span className="font-semibold">{filteredItems.length}</span>{" "}
            món
          </div>
        </div>
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm text-gray-700 font-medium">Danh mục:</span>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                selectedCategory === ""
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
              }`}
            >
              Tất cả
            </button>
            {(categories.length > 0 ? categories : []).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory((prev) => {
                    const next = prev === cat.id ? "" : cat.id;
                    if (next !== prev) {
                      setCurrentPage(1);
                    }
                    return next;
                  });
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                  selectedCategory === cat.id
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                >
                  STT
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                >
                  Món
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                >
                  Danh mục
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                >
                  Trạng thái
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item, index) => {
                  const orderNumber =
                    (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <img
                              className="h-12 w-12 rounded-md object-cover border border-gray-200"
                              src={item.imageUrls[0]}
                              alt={item.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {item.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.inStock
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.inStock ? "Còn hàng" : "Hết hàng"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="text-indigo-600 hover:text-indigo-700 transition"
                          >
                            <EditIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="text-red-600 hover:text-red-700 transition"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    Không có món nào trong thực đơn
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredItems.length}
          />
        )}
      </div>

      <MenuItemModal
        isOpen={isModalOpen}
        onClose={() => {
          handleCloseModal();
          // Reload danh sách sau khi đóng modal
          const load = async () => {
            setLoading(true);
            try {
              const params = selectedCategory
                ? { maDanhMuc: selectedCategory }
                : undefined;
              const data = await menuApi.getDishes(params);
              const mapped: MenuItem[] = (data || []).map((m: any) => {
                const imgs: string[] = (
                  m.hinhAnhMonAns ||
                  m.HinhAnhMonAns ||
                  []
                ).map((h: any) => {
                  const url = h.urlHinhAnh || h.URLHinhAnh;
                  return url?.startsWith("http") ? url : `${BASE_URL}/${url}`;
                });
                const tenDanhMuc =
                  m.maDanhMucNavigation?.tenDanhMuc ||
                  m.MaDanhMucNavigation?.TenDanhMuc ||
                  "";
                const sizes = (m.phienBanMonAns || m.PhienBanMonAns || []).map(
                  (p: any) => ({
                    name: p.tenPhienBan || p.TenPhienBan,
                    price: Number(p.gia || p.Gia) || 0,
                    recipe: { id: "", name: "", ingredients: [] },
                  })
                );
                return {
                  id: m.maMonAn || m.MaMonAn,
                  name: m.tenMonAn || m.TenMonAn,
                  description: "",
                  categoryId: m.maDanhMuc || m.MaDanhMuc,
                  category: tenDanhMuc,
                  imageUrls: imgs,
                  inStock: true,
                  sizes,
                } as MenuItem;
              });
              setRemoteItems(mapped);
            } catch (e: any) {
              // Ignore error, keep existing data
            } finally {
              setLoading(false);
            }
          };
          load();
        }}
        itemToEdit={editingItem}
      />
    </div>
  );
};

export default MenuView;

import React, { useEffect, useState, useMemo } from "react";
import { useAppContext } from "@/contexts/AppContext";
import MenuItemModal from "@/components/menu/MenuItemModal";
import type { MenuItem, Recipe, MenuItemSize } from "@/types/menu";
import { PlusCircleIcon, EditIcon, TrashIcon } from "@/components/icons";
import { useFeedback } from "@/contexts/FeedbackContext";
import { BASE_URL } from "@/utils/api";
import { menuApi } from "@/api/menu";
import { FALLBACK_THUMB_IMAGE } from "@/utils/placeholders";

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
        // Xử lý response: có thể là array trực tiếp hoặc object với data property
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
          // Xử lý hình ảnh - hỗ trợ cả camelCase và PascalCase
          const hinhAnhList = m.hinhAnhMonAns || m.HinhAnhMonAns || [];
          const imgs: string[] = hinhAnhList
            .map((h: any) => {
              const url = h.urlHinhAnh || h.URLHinhAnh || "";
              if (!url) return "";
              // Nếu đã là full URL thì giữ nguyên, nếu không thì thêm BASE_URL
              if (url.startsWith("http://") || url.startsWith("https://")) {
                return url;
              }
              // Xử lý relative path
              const cleanUrl = url.replace(/^\//, "");
              return `${BASE_URL}/${cleanUrl}`;
            })
            .filter((url: string) => url !== ""); // Loại bỏ URL rỗng

          const tenDanhMuc = m.tenDanhMuc || m.TenDanhMuc || "";

          // Xử lý phiên bản món ăn
          const phienBanList = m.phienBanMonAns || m.PhienBanMonAns || [];
          const sizes = Array.from(
            new Map(
              phienBanList.map((p: any, idx: number) => {
                const versionId = p.maPhienBan || p.MaPhienBan || "";
                const versionName = p.tenPhienBan || p.TenPhienBan || "";

                // Lưu ý: Khi load danh sách, API không trả về CongThucNauAns
                // Chỉ có khi get single dish (getDish)
                const congThucNauAns =
                  p.congThucNauAns || p.CongThucNauAns || [];
                const recipeIngredients = Array.isArray(congThucNauAns)
                  ? congThucNauAns.map((ct: any) => ({
                      ingredient: {
                        id: ct.maNguyenLieu || ct.MaNguyenLieu || "",
                        name: ct.tenNguyenLieu || ct.TenNguyenLieu || "",
                        unit: ct.donViTinh || ct.DonViTinh || "",
                        stock: 0, // Không cần stock trong công thức
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
                    ingredients: recipeIngredients, // Có thể là mảng rỗng khi load danh sách
                  },
                };
                const key = versionId || versionName || `${m.maMonAn}_${idx}`;
                return [key, normalized] as const;
              })
            ).values()
          );

          // Xác định trạng thái còn hàng
          // Kiểm tra xem có phiên bản nào có MaTrangThai = "CON_HANG" không
          // Nếu không có MaTrangThai, mặc định là còn hàng
          const hasInStock =
            phienBanList.length > 0 &&
            phienBanList.some((p: any) => {
              const trangThai = p.maTrangThai || p.MaTrangThai;
              // Nếu không có trạng thái, mặc định là còn hàng
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

  const handleOpenEditModal = async (item: MenuItem) => {
    // Load đầy đủ thông tin món ăn từ API bao gồm công thức và nguyên liệu
    try {
      setLoading(true);
      const fullData = await menuApi.getDish(item.id);

      // Map dữ liệu từ API sang format MenuItem (DTO format)
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

      // Map phiên bản món ăn với công thức đầy đủ
      const phienBanList =
        fullData.phienBanMonAns || fullData.PhienBanMonAns || [];
      const sizes: MenuItemSize[] = Array.from(
        new Map<string, MenuItemSize>(
          phienBanList.map((p: any, idx: number) => {
            const versionId = p.maPhienBan || p.MaPhienBan || "";
            const versionName = p.tenPhienBan || p.TenPhienBan || "";

            // Lấy công thức từ CongThucNauAns (có đầy đủ khi get single dish)
            const congThucNauAns = p.congThucNauAns || p.CongThucNauAns || [];
            const recipeIngredients = Array.isArray(congThucNauAns)
              ? congThucNauAns.map((ct: any) => ({
                  ingredient: {
                    id: ct.maNguyenLieu || ct.MaNguyenLieu || "",
                    name: ct.tenNguyenLieu || ct.TenNguyenLieu || "",
                    unit: ct.donViTinh || ct.DonViTinh || "",
                    stock: 0, // Không cần stock trong công thức
                  },
                  quantity: Number(ct.soLuongCanDung || ct.SoLuongCanDung) || 0,
                }))
              : [];

            // Tạo recipe cho phiên bản này
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

      // Xác định trạng thái còn hàng
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

  // Vì API đã xử lý lọc theo danh mục và tìm kiếm, nên chỉ cần dùng dữ liệu từ API
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
        <div className="px-4 py-3 border-b border-gray-200 space-y-4">
          {/* Tìm kiếm theo tên món ăn */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <label className="text-sm text-gray-700 font-medium whitespace-nowrap">
                Tìm kiếm:
              </label>
              <input
                type="text"
                value={searchString}
                onChange={(e) => {
                  setSearchString(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Nhập tên món ăn để tìm kiếm..."
                className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {searchString && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchString("");
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
                >
                  Xóa
                </button>
              )}
            </div>
            <div className="text-sm text-gray-600 whitespace-nowrap">
              Tổng:{" "}
              <span className="font-semibold">{filteredItems.length}</span> món
            </div>
          </div>
          {/* Lọc theo danh mục */}
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
                              src={item.imageUrls[0] || FALLBACK_THUMB_IMAGE}
                              alt={item.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  FALLBACK_THUMB_IMAGE;
                              }}
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
        {filteredItems.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Hiển thị:
              </label>
              <div className="relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 shadow-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value={5}>5 món</option>
                  <option value={10}>10 món</option>
                  <option value={20}>20 món</option>
                  <option value={50}>50 món</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded bg-white disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Trước
              </button>
              <span className="text-sm text-gray-700">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded bg-white disabled:opacity-50 hover:bg-gray-50 transition"
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
          // Reload danh sách sau khi đóng modal
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

              // Xử lý response: có thể là array trực tiếp hoặc object với data property
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
                // Xử lý hình ảnh
                const hinhAnhList = m.hinhAnhMonAns || m.HinhAnhMonAns || [];
                const imgs: string[] = hinhAnhList
                  .map((h: any) => {
                    const url = h.urlHinhAnh || h.URLHinhAnh || "";
                    if (!url) return "";
                    if (
                      url.startsWith("http://") ||
                      url.startsWith("https://")
                    ) {
                      return url;
                    }
                    const cleanUrl = url.replace(/^\//, "");
                    return `${BASE_URL}/${cleanUrl}`;
                  })
                  .filter((url: string) => url !== "");

                const tenDanhMuc = m.tenDanhMuc || m.TenDanhMuc || "";

                // Xử lý phiên bản món ăn
                const phienBanList = m.phienBanMonAns || m.PhienBanMonAns || [];
                const sizes = phienBanList.map((p: any) => {
                  const versionId = p.maPhienBan || p.MaPhienBan || "";
                  const versionName = p.tenPhienBan || p.TenPhienBan || "";

                  return {
                    name: versionName,
                    price: Number(p.gia || p.Gia) || 0,
                    recipe: {
                      id: `recipe_${versionId}`,
                      name: `Công thức ${versionName}`,
                      versionId,
                      versionName,
                      ingredients: [], // Khi reload danh sách, không có ingredients
                    },
                  };
                });

                // Xác định trạng thái còn hàng
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

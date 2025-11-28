import React, { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import MenuManagementView from "./MenuManagementView";
import { menuApi } from "@/api/menu";
import { useFeedback } from "@/contexts/FeedbackContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MasterDataView: React.FC = () => {
  const { suppliers, addSupplier } = useAppContext() as any;
  const [name, setName] = useState<string>("");

  const add = () => {
    if (!name.trim()) return;
    addSupplier({ name });
    setName("");
  };

  // Main tabs: Quản lý danh mục và Menu
  const mainTabs = [
    { id: "categories", label: "Quản lý danh mục" },
    { id: "menu", label: "Menu" },
  ] as const;
  const [activeMainTab, setActiveMainTab] =
    useState<(typeof mainTabs)[number]["id"]>("categories");

  // Sub-tabs cho Quản lý danh mục
  const categoryTabs = [
    { id: "suppliers", label: "Nhà cung cấp" },
    { id: "dishCategories", label: "Danh mục món ăn" },
  ] as const;
  const [activeCategoryTab, setActiveCategoryTab] =
    useState<(typeof categoryTabs)[number]["id"]>("suppliers");

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Quản lý Danh mục & Menu</h2>

      {/* Main tabs */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 flex flex-wrap gap-2 px-4 pt-4">
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id)}
              className={`px-4 py-2 rounded-t font-semibold ${
                activeMainTab === tab.id
                  ? "bg-white border border-b-white border-gray-200 text-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-4">
          {activeMainTab === "categories" && (
            <div className="space-y-4">
              {/* Sub-tabs cho Quản lý danh mục */}
              <div className="border-b border-gray-200 flex flex-wrap gap-2 mb-4">
                {categoryTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategoryTab(tab.id)}
                    className={`px-4 py-2 rounded-t font-medium text-sm ${
                      activeCategoryTab === tab.id
                        ? "bg-indigo-50 border border-b-indigo-50 border-gray-200 text-indigo-600"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content cho từng sub-tab */}
              {activeCategoryTab === "suppliers" && (
                <>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className="bg-white text-gray-900 rounded px-3 py-2 border border-gray-300 flex-1"
                      placeholder="Tên nhà cung cấp"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <button
                      onClick={add}
                      className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      Thêm
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(suppliers || []).map((s: any) => (
                      <div
                        key={s.id}
                        className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900"
                      >
                        {s.name}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeCategoryTab === "dishCategories" && (
                <DishCategoryManagementComponent />
              )}
            </div>
          )}

          {activeMainTab === "menu" && (
            <div className="space-y-4">
              {/* Quản lý menu combo */}
              <MenuManagementView />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Component quản lý danh mục món ăn
const DishCategoryManagementComponent: React.FC = () => {
  const { notify, confirm } = useFeedback();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Load danh sách danh mục
  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await menuApi.getCategories();
      const mapped = (data || []).map((cat: any) => ({
        maDanhMuc: cat.maDanhMuc || cat.MaDanhMuc || "",
        tenDanhMuc: cat.tenDanhMuc || cat.TenDanhMuc || "",
      }));
      setCategories(mapped);
    } catch (error: any) {
      notify({
        tone: "error",
        title: "Lỗi tải danh mục",
        description: error?.message || "Không thể tải danh sách danh mục",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async () => {
    if (!categoryName.trim()) {
      notify({
        tone: "warning",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên danh mục",
      });
      return;
    }

    try {
      await menuApi.createCategory({ TenDanhMuc: categoryName.trim() });
      notify({
        tone: "success",
        title: "Đã tạo danh mục",
        description: "Danh mục đã được tạo thành công",
      });
      setCategoryName("");
      loadCategories();
    } catch (error: any) {
      notify({
        tone: "error",
        title: "Lỗi tạo danh mục",
        description: error?.message || "Không thể tạo danh mục",
      });
    }
  };

  const handleStartEdit = (maDanhMuc: string, tenDanhMuc: string) => {
    setEditingId(maDanhMuc);
    setEditingName(tenDanhMuc);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleUpdate = async (maDanhMuc: string) => {
    if (!editingName.trim()) {
      notify({
        tone: "warning",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên danh mục",
      });
      return;
    }

    try {
      await menuApi.updateCategory(maDanhMuc, {
        TenDanhMuc: editingName.trim(),
      });
      notify({
        tone: "success",
        title: "Đã cập nhật danh mục",
        description: "Danh mục đã được cập nhật thành công",
      });
      setEditingId(null);
      setEditingName("");
      loadCategories();
    } catch (error: any) {
      notify({
        tone: "error",
        title: "Lỗi cập nhật danh mục",
        description: error?.message || "Không thể cập nhật danh mục",
      });
    }
  };

  const handleDelete = async (maDanhMuc: string, tenDanhMuc: string) => {
    const shouldDelete = await confirm({
      title: "Xóa danh mục",
      description: `Bạn có chắc chắn muốn xóa danh mục "${tenDanhMuc}"?`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      tone: "danger",
    });

    if (!shouldDelete) return;

    try {
      await menuApi.deleteCategory(maDanhMuc);
      notify({
        tone: "success",
        title: "Đã xóa danh mục",
        description: "Danh mục đã được xóa thành công",
      });
      loadCategories();
    } catch (error: any) {
      notify({
        tone: "error",
        title: "Lỗi xóa danh mục",
        description: error?.message || "Không thể xóa danh mục",
      });
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Đang tải danh sách danh mục...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Form thêm danh mục */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Tên danh mục món ăn"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          className="flex-1"
        />
        <Button onClick={handleAdd}>Thêm danh mục</Button>
      </div>

      {/* Danh sách danh mục */}
      {categories.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Chưa có danh mục nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.maDanhMuc}
              className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900 flex items-center justify-between"
            >
              {editingId === cat.maDanhMuc ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleUpdate(cat.maDanhMuc);
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => handleUpdate(cat.maDanhMuc)}
                    className="bg-indigo-600 hover:bg-indigo-500"
                  >
                    Lưu
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Hủy
                  </Button>
                </div>
              ) : (
                <>
                  <span className="font-medium">{cat.tenDanhMuc}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStartEdit(cat.maDanhMuc, cat.tenDanhMuc)
                      }
                    >
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleDelete(cat.maDanhMuc, cat.tenDanhMuc)
                      }
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Xóa
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MasterDataView;

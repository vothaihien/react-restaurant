import React, { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import MenuManagementView from "./MenuManagementView"; // Giữ nguyên component con này
import { menuApi } from "@/api/menu";
import { useFeedback } from "@/contexts/FeedbackContext";
import { 
  LayoutGrid, UtensilsCrossed, Truck, Layers, Plus, 
  Edit2, Trash2, Save, X, Search 
} from "lucide-react";

const MasterDataView: React.FC = () => {
  const { suppliers, addSupplier } = useAppContext() as any;
  const [name, setName] = useState<string>("");

  const add = () => {
    if (!name.trim()) return;
    addSupplier({ name });
    setName("");
  };

  // Main tabs
  const mainTabs = [
    { id: "categories", label: "Danh mục & Đối tác", icon: <Layers className="w-4 h-4" /> },
    { id: "menu", label: "Quản lý Thực đơn", icon: <UtensilsCrossed className="w-4 h-4" /> },
  ] as const;
  const [activeMainTab, setActiveMainTab] = useState<(typeof mainTabs)[number]["id"]>("categories");

  // Sub-tabs
  const categoryTabs = [
    { id: "suppliers", label: "Nhà cung cấp", icon: <Truck className="w-4 h-4" /> },
    { id: "dishCategories", label: "Danh mục món ăn", icon: <LayoutGrid className="w-4 h-4" /> },
  ] as const;
  const [activeCategoryTab, setActiveCategoryTab] = useState<(typeof categoryTabs)[number]["id"]>("suppliers");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300 font-sans">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <LayoutGrid className="w-8 h-8 text-indigo-600" />
          Dữ liệu nguồn (Master Data)
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Thiết lập danh mục món ăn, nhà cung cấp và thực đơn bán hàng.
        </p>
      </div>

      {/* MAIN TABS */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Tab Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 px-4 pt-4 flex gap-1 overflow-x-auto">
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-semibold text-sm transition-all relative ${
                activeMainTab === tab.id
                  ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-[0_-2px_4px_rgba(0,0,0,0.02)] z-10"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeMainTab === tab.id && (
                <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 min-h-[500px]">
          {activeMainTab === "categories" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* SIDEBAR SUB-TABS (Left Column) */}
              <div className="lg:col-span-1 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Cài đặt chung</p>
                {categoryTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategoryTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                      activeCategoryTab === tab.id
                        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* CONTENT AREA (Right Column) */}
              <div className="lg:col-span-3">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  
                  {/* --- TAB: NHÀ CUNG CẤP --- */}
                  {activeCategoryTab === "suppliers" && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Truck className="w-5 h-5 text-indigo-600" />
                                Danh sách Nhà Cung Cấp
                            </h3>
                        </div>

                        {/* Input thêm mới */}
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all"
                                    placeholder="Nhập tên nhà cung cấp mới..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && add()}
                                />
                            </div>
                            <button
                                onClick={add}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Thêm
                            </button>
                        </div>

                        {/* Danh sách */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(suppliers || []).map((s: any) => (
                            <div
                                key={s.id}
                                className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                        <Truck className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-800 dark:text-white">{s.name}</span>
                                </div>
                                {/* Nút xóa giả lập (nếu cần thêm chức năng xóa NCC sau này) */}
                                {/* <button className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button> */}
                            </div>
                            ))}
                            {(suppliers || []).length === 0 && (
                                <p className="col-span-2 text-center text-gray-500 py-8">Chưa có nhà cung cấp nào</p>
                            )}
                        </div>
                    </div>
                  )}

                  {/* --- TAB: DANH MỤC MÓN ĂN --- */}
                  {activeCategoryTab === "dishCategories" && (
                    <DishCategoryManagementComponent />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: QUẢN LÝ MENU (Nhúng component cũ) --- */}
          {activeMainTab === "menu" && (
            <div className="animate-in fade-in zoom-in duration-300">
              <MenuManagementView />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT CON: QUẢN LÝ DANH MỤC MÓN ĂN (Được làm đẹp lại) ---
const DishCategoryManagementComponent: React.FC = () => {
  const { notify, confirm } = useFeedback();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

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
      notify({ tone: "error", title: "Lỗi tải danh mục", description: error?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const handleAdd = async () => {
    if (!categoryName.trim()) return notify({ tone: "warning", title: "Thiếu thông tin", description: "Nhập tên danh mục!" });
    try {
      await menuApi.createCategory({ TenDanhMuc: categoryName.trim() });
      notify({ tone: "success", title: "Thành công", description: "Đã tạo danh mục mới" });
      setCategoryName(""); loadCategories();
    } catch (error: any) {
      notify({ tone: "error", title: "Lỗi", description: "Không thể tạo danh mục" });
    }
  };

  const handleUpdate = async (maDanhMuc: string) => {
    if (!editingName.trim()) return notify({ tone: "warning", title: "Thiếu thông tin", description: "Tên không được để trống" });
    try {
      await menuApi.updateCategory(maDanhMuc, { TenDanhMuc: editingName.trim() });
      notify({ tone: "success", title: "Thành công", description: "Cập nhật xong" });
      setEditingId(null); setEditingName(""); loadCategories();
    } catch (error: any) {
      notify({ tone: "error", title: "Lỗi", description: "Cập nhật thất bại" });
    }
  };

  const handleDelete = async (maDanhMuc: string, tenDanhMuc: string) => {
    const shouldDelete = await confirm({
      title: "Xóa danh mục",
      description: `Xóa danh mục "${tenDanhMuc}"?`,
      confirmText: "Xóa ngay", cancelText: "Hủy", tone: "danger",
    });
    if (!shouldDelete) return;
    try {
      await menuApi.deleteCategory(maDanhMuc);
      notify({ tone: "success", title: "Đã xóa", description: `Đã xóa ${tenDanhMuc}` });
      loadCategories();
    } catch (error: any) {
      notify({ tone: "error", title: "Lỗi", description: "Không thể xóa danh mục này" });
    }
  };

  if (loading && categories.length === 0) return <div className="text-center py-12 text-gray-500">Đang tải...</div>;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-indigo-600" />
                Danh mục món ăn
            </h3>
        </div>

        {/* Form Thêm */}
        <div className="flex gap-3">
            <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all"
                    placeholder="Tên danh mục món ăn (Ví dụ: Khai vị, Đồ uống...)"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                />
            </div>
            <button
                onClick={handleAdd}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2"
            >
                <Plus className="w-4 h-4" /> Thêm danh mục
            </button>
        </div>

        {/* Danh sách */}
        {categories.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                <p className="text-gray-500 dark:text-gray-400">Chưa có danh mục nào</p>
            </div>
        ) : (
            <div className="space-y-3">
            {categories.map((cat) => (
                <div
                key={cat.maDanhMuc}
                className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-between hover:shadow-md transition-all group"
                >
                {editingId === cat.maDanhMuc ? (
                    <div className="flex items-center gap-3 flex-1 animate-in fade-in slide-in-from-left-2">
                        <input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-sm focus:outline-none dark:text-white"
                            autoFocus
                            onKeyPress={(e) => {
                                if (e.key === "Enter") handleUpdate(cat.maDanhMuc);
                                if (e.key === "Escape") { setEditingId(null); setEditingName(""); }
                            }}
                        />
                        <button onClick={() => handleUpdate(cat.maDanhMuc)} className="p-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"><Save className="w-4 h-4" /></button>
                        <button onClick={() => { setEditingId(null); setEditingName(""); }} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><X className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                <Layers className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-gray-800 dark:text-white">{cat.tenDanhMuc}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => { setEditingId(cat.maDanhMuc); setEditingName(cat.tenDanhMuc); }}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                title="Sửa"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(cat.maDanhMuc, cat.tenDanhMuc)}
                                className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                title="Xóa"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
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
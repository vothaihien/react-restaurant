import React, { useState, useEffect, useMemo } from 'react';
import { promotionsApi, Promotion, CreatePromotionData, UpdatePromotionData } from 'src/api/khuyenmai';
import { 
  Tag, Plus, Search, Calendar, DollarSign, Percent, 
  Trash2, Edit, X, Filter, CheckCircle2, AlertCircle, Gift 
} from 'lucide-react';

const PromotionManagement: React.FC = () => {
  // --- STATE & LOGIC (GIỮ NGUYÊN) ---
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  // State bộ lọc
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [promotionSearch, setPromotionSearch] = useState(''); // Tìm kiếm danh sách KM bên ngoài

  // Generate Code
  const generatePromoCode = () => {
    const prefix = 'KM';
    const timestamp = new Date().getTime().toString().slice(-4);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  const [formData, setFormData] = useState({
    maKhuyenMai: generatePromoCode(),
    tenKhuyenMai: '',
    loaiKhuyenMai: 'PHAN_TRAM' as 'PHAN_TRAM' | 'TIEN',
    giaTri: 0,
    ngayBatDau: '',
    ngayKetThuc: '',
    trangThai: 'ACTIVE',
    moTa: '',
    apDungToiThieu: 0,
    apDungSanPhams: [] as { maCongThuc?: string; maDanhMuc?: string }[]
  });

  // --- API CALLS ---
  useEffect(() => {
    fetchPromotions();
    fetchRecipes();
    fetchCategories();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const data = await promotionsApi.getPromotions();
      setPromotions(data);
    } catch (error) {
      console.error('Lỗi tải KM:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipes = async () => {
    try {
      const data = await promotionsApi.getRecipes();
      setRecipes(data);
    } catch (error) { console.error(error); }
  };

  const fetchCategories = async () => {
    try {
      const data = await promotionsApi.getCategories();
      setCategories(data);
    } catch (error) { console.error(error); }
  };

  // --- HELPER FUNCTIONS ---
  const getFilteredRecipes = () => {
    let filtered = recipes;
    if (selectedCategoryFilter) {
      filtered = filtered.filter(recipe => recipe.maDanhMuc === selectedCategoryFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(recipe => 
        recipe.tenMonAn.toLowerCase().includes(term) ||
        recipe.tenPhienBan.toLowerCase().includes(term) ||
        recipe.tenDanhMuc.toLowerCase().includes(term)
      );
    }
    return filtered;
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    const today = new Date().toISOString().split('T')[0];
    
    if (!formData.ngayBatDau) errors.ngayBatDau = 'Chọn ngày bắt đầu';
    if (!formData.ngayKetThuc) errors.ngayKetThuc = 'Chọn ngày kết thúc';
    else if (formData.ngayKetThuc < formData.ngayBatDau) errors.ngayKetThuc = 'Ngày kết thúc không hợp lệ';

    if (formData.giaTri <= 0) errors.giaTri = 'Giá trị > 0';
    if (formData.loaiKhuyenMai === 'PHAN_TRAM' && formData.giaTri > 100) errors.giaTri = 'Phần trăm <= 100';
    if (!formData.tenKhuyenMai.trim()) errors.tenKhuyenMai = 'Nhập tên khuyến mãi';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAddRecipe = (maCongThuc: string) => {
    if (!formData.apDungSanPhams.some(item => item.maCongThuc === maCongThuc)) {
      setFormData(prev => ({ ...prev, apDungSanPhams: [...prev.apDungSanPhams, { maCongThuc }] }));
    }
  };

  const handleAddCategory = (maDanhMuc: string) => {
    if (!formData.apDungSanPhams.some(item => item.maDanhMuc === maDanhMuc)) {
      setFormData(prev => ({ ...prev, apDungSanPhams: [...prev.apDungSanPhams, { maDanhMuc }] }));
    }
  };

  const removeAppliedItem = (index: number) => {
    setFormData(prev => ({ ...prev, apDungSanPhams: prev.apDungSanPhams.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        // Đảm bảo dữ liệu đúng kiểu
        giaTri: Number(formData.giaTri),
        apDungToiThieu: Number(formData.apDungToiThieu)
      };

      if (editingPromotion) {
        await promotionsApi.updatePromotion(editingPromotion.maKhuyenMai, payload as UpdatePromotionData);
        alert('Cập nhật thành công!');
      } else {
        await promotionsApi.createPromotion(payload as CreatePromotionData);
        alert('Tạo mới thành công!');
      }
      setShowForm(false);
      setEditingPromotion(null);
      resetForm();
      fetchPromotions();
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra');
    }
  };

  const resetForm = () => {
    setFormData({
      maKhuyenMai: generatePromoCode(),
      tenKhuyenMai: '',
      loaiKhuyenMai: 'PHAN_TRAM',
      giaTri: 0,
      ngayBatDau: '',
      ngayKetThuc: '',
      trangThai: 'ACTIVE',
      moTa: '',
      apDungToiThieu: 0,
      apDungSanPhams: []
    });
    setFormErrors({});
    setSelectedCategoryFilter('');
    setSearchTerm('');
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      ...promotion,
      ngayBatDau: promotion.ngayBatDau.split('T')[0],
      ngayKetThuc: promotion.ngayKetThuc.split('T')[0],
      moTa: promotion.moTa || '',
      apDungToiThieu: promotion.apDungToiThieu || 0,
      apDungSanPhams: promotion.apDungSanPhams || []
    });
    setShowForm(true);
  };

  const handleDelete = async (maKhuyenMai: string) => {
    if (window.confirm('Xóa khuyến mãi này?')) {
      try {
        await promotionsApi.deletePromotion(maKhuyenMai);
        alert('Đã xóa!');
        fetchPromotions();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  // Helpers hiển thị
  const getRecipeName = (maCongThuc: string) => {
    const recipe = recipes.find(r => r.maCongThuc === maCongThuc);
    return recipe ? `${recipe.tenMonAn} (${recipe.tenPhienBan})` : maCongThuc;
  };

  const getCategoryName = (maDanhMuc: string) => {
    const cat = categories.find(c => c.maDanhMuc === maDanhMuc);
    return cat ? cat.tenDanhMuc : maDanhMuc;
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = promotions.length;
    const active = promotions.filter(p => p.trangThai === 'ACTIVE').length;
    const expired = promotions.filter(p => p.trangThai === 'EXPIRED').length;
    return { total, active, expired };
  }, [promotions]);

  // Filter list hiển thị bên ngoài
  const displayPromotions = useMemo(() => {
    if (!promotionSearch) return promotions;
    return promotions.filter(p => 
        p.tenKhuyenMai.toLowerCase().includes(promotionSearch.toLowerCase()) ||
        p.maKhuyenMai.toLowerCase().includes(promotionSearch.toLowerCase())
    );
  }, [promotions, promotionSearch]);

  const filteredRecipes = getFilteredRecipes();

  // --- RENDER UI ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300 font-sans text-gray-900 dark:text-white">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Gift className="w-8 h-8 text-pink-500" />
                Quản lý Khuyến mãi
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Thiết lập các chương trình ưu đãi cho nhà hàng</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Thêm chương trình
        </button>
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Tag className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tổng chương trình</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Đang chạy</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
                <AlertCircle className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Hết hạn / Tắt</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.expired + (stats.total - stats.active - stats.expired)}</p>
            </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
            type="text" 
            placeholder="Tìm kiếm khuyến mãi..." 
            value={promotionSearch}
            onChange={e => setPromotionSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white"
        />
      </div>

      {/* LIST PROMOTIONS */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</div>
        ) : displayPromotions.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                <Gift className="w-16 h-16 opacity-20 mb-4" />
                <p>Chưa có chương trình khuyến mãi nào</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase text-xs font-semibold">
                        <tr>
                            <th className="p-4">Mã KM</th>
                            <th className="p-4">Tên Chương Trình</th>
                            <th className="p-4">Giảm Giá</th>
                            <th className="p-4">Thời Gian</th>
                            <th className="p-4 text-center">Trạng Thái</th>
                            <th className="p-4 text-right">Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {displayPromotions.map((promo) => (
                            <tr key={promo.maKhuyenMai} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{promo.maKhuyenMai}</td>
                                <td className="p-4 font-medium">
                                    <div className="text-gray-900 dark:text-white">{promo.tenKhuyenMai}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{promo.moTa}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold ${
                                        promo.loaiKhuyenMai === 'PHAN_TRAM' 
                                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' 
                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}>
                                        {promo.loaiKhuyenMai === 'PHAN_TRAM' ? <Percent className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                                        {promo.loaiKhuyenMai === 'PHAN_TRAM' ? `${promo.giaTri}%` : formatCurrency(promo.giaTri)}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-gray-400">Từ: {new Date(promo.ngayBatDau).toLocaleDateString('vi-VN')}</span>
                                        <span className="text-xs text-gray-400">Đến: {new Date(promo.ngayKetThuc).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                        promo.trangThai === 'ACTIVE' 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                        {promo.trangThai === 'ACTIVE' ? 'Hoạt động' : 'Đã tắt'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleEdit(promo)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(promo.maKhuyenMai)} className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* --- MODAL FORM --- */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {editingPromotion ? <Edit className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                    {editingPromotion ? 'Cập nhật Khuyến mãi' : 'Tạo Khuyến mãi Mới'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Modal Body: Grid 2 Cột */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
                
                {/* CỘT TRÁI: THÔNG TIN CHUNG */}
                <div className="p-6 overflow-y-auto border-r border-gray-100 dark:border-gray-700 space-y-5">
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">1. Thông tin cơ bản</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Tên chương trình <span className="text-red-500">*</span></label>
                            <input 
                                type="text" name="tenKhuyenMai" value={formData.tenKhuyenMai} onChange={handleInputChange} 
                                className={`w-full p-2.5 rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 ${formErrors.tenKhuyenMai ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="VD: Mừng khai trương..."
                            />
                            {formErrors.tenKhuyenMai && <p className="text-xs text-red-500 mt-1">{formErrors.tenKhuyenMai}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Mã KM (Auto)</label>
                                <input type="text" value={formData.maKhuyenMai} disabled className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-mono" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Trạng thái</label>
                                <select name="trangThai" value={formData.trangThai} onChange={handleInputChange} className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white">
                                    <option value="ACTIVE">Đang chạy</option>
                                    <option value="INACTIVE">Tạm dừng</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-indigo-900 dark:text-indigo-300">Loại giảm giá</label>
                                <select name="loaiKhuyenMai" value={formData.loaiKhuyenMai} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-indigo-200 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                                    <option value="PHAN_TRAM">Theo %</option>
                                    <option value="TIEN">Theo tiền mặt</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-indigo-900 dark:text-indigo-300">Giá trị giảm <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input 
                                        type="number" name="giaTri" value={formData.giaTri} onChange={handleInputChange} 
                                        className="w-full p-2.5 rounded-lg border border-indigo-200 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white pr-8 font-bold text-indigo-600"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                                        {formData.loaiKhuyenMai === 'PHAN_TRAM' ? '%' : 'đ'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Từ ngày</label>
                                <input type="date" name="ngayBatDau" value={formData.ngayBatDau} onChange={handleInputChange} className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Đến ngày</label>
                                <input type="date" name="ngayKetThuc" value={formData.ngayKetThuc} onChange={handleInputChange} className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Điều kiện: Đơn tối thiểu</label>
                            <div className="relative">
                                <input type="number" name="apDungToiThieu" value={formData.apDungToiThieu} onChange={handleInputChange} className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white pl-8" />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Mô tả chi tiết</label>
                            <textarea name="moTa" value={formData.moTa} onChange={handleInputChange} rows={3} className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white resize-none" placeholder="Nhập mô tả..." />
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: PHẠM VI ÁP DỤNG */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex flex-col h-full overflow-hidden">
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex justify-between items-center">
                        2. Phạm vi áp dụng
                        <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-2 py-0.5 rounded text-xs">
                            {formData.apDungSanPhams.length} mục đã chọn
                        </span>
                    </h3>

                    {/* Toolbar Lọc */}
                    <div className="flex gap-2 mb-3">
                        <select 
                            value={selectedCategoryFilter} onChange={e => setSelectedCategoryFilter(e.target.value)}
                            className="flex-1 p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">Tất cả danh mục</option>
                            {categories.map(c => <option key={c.maDanhMuc} value={c.maDanhMuc}>{c.tenDanhMuc}</option>)}
                        </select>
                        <input 
                            type="text" placeholder="Tìm món..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="flex-1 p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                        />
                    </div>

                    {/* List chọn món */}
                    <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-4 shadow-inner">
                        {filteredRecipes.length > 0 ? filteredRecipes.map(recipe => {
                            const isSelected = formData.apDungSanPhams.some(item => item.maCongThuc === recipe.maCongThuc);
                            return (
                                <div 
                                    key={recipe.maCongThuc} 
                                    onClick={() => !isSelected && handleAddRecipe(recipe.maCongThuc)}
                                    className={`p-3 border-b dark:border-gray-700 flex justify-between items-center cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 opacity-70' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                >
                                    <div>
                                        <p className={`text-sm font-medium ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'dark:text-white'}`}>{recipe.tenMonAn}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{recipe.tenPhienBan} • {formatCurrency(recipe.gia)}</p>
                                    </div>
                                    {isSelected ? <CheckCircle2 className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-gray-400 hover:text-indigo-500" />}
                                </div>
                            )
                        }) : <div className="p-4 text-center text-sm text-gray-500">Không tìm thấy món nào</div>}
                    </div>

                    {/* List danh mục (Optional) */}
                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block">Thêm nhanh theo danh mục:</label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => {
                                const isSelected = formData.apDungSanPhams.some(item => item.maDanhMuc === cat.maDanhMuc);
                                return (
                                    <button 
                                        key={cat.maDanhMuc} type="button"
                                        onClick={() => !isSelected && handleAddCategory(cat.maDanhMuc)}
                                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${isSelected ? 'bg-green-100 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 dark:text-gray-300'}`}
                                    >
                                        {cat.tenDanhMuc}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Danh sách đã chọn (Tags) */}
                    <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-700 max-h-32 overflow-y-auto">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Đã chọn:</span>
                            {formData.apDungSanPhams.length > 0 && (
                                <button type="button" onClick={() => setFormData(prev => ({...prev, apDungSanPhams: []}))} className="text-xs text-red-500 hover:underline">Xóa hết</button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.apDungSanPhams.length === 0 && <span className="text-xs text-gray-400 italic">Chưa chọn mục nào (Áp dụng toàn bộ)</span>}
                            {formData.apDungSanPhams.map((item, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-xs dark:text-gray-200">
                                    {item.maCongThuc ? getRecipeName(item.maCongThuc) : `[DM] ${getCategoryName(item.maDanhMuc!)}`}
                                    <button type="button" onClick={() => removeAppliedItem(idx)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors">Hủy bỏ</button>
                <button type="submit" onClick={handleSubmit} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-colors">
                    {editingPromotion ? 'Lưu thay đổi' : 'Tạo khuyến mãi'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionManagement;
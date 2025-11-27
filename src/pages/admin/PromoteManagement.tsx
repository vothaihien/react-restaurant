// components/PromotionManagement.tsx
import React, { useState, useEffect } from 'react';
import { promotionsApi, Promotion, CreatePromotionData, UpdatePromotionData } from 'src/api/khuyenmai';

const PromotionManagement: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  // State cho bộ lọc
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Tạo mã khuyến mãi tự động
  const generatePromoCode = () => {
    const prefix = 'KM';
    const timestamp = new Date().getTime().toString().slice(-6);
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

  // Load dữ liệu
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
      console.error('Lỗi khi tải danh sách khuyến mãi:', error);
      alert('Lỗi khi tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipes = async () => {
    try {
      const data = await promotionsApi.getRecipes();
      console.log('Recipes data:', data); // Debug
      setRecipes(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách công thức:', error);
      alert('Lỗi khi tải danh sách công thức');
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await promotionsApi.getCategories();
      console.log('Categories data:', data); // Debug
      setCategories(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách danh mục:', error);
      alert('Lỗi khi tải danh sách danh mục');
    }
  };

  // Lọc công thức theo danh mục và tìm kiếm
  const getFilteredRecipes = () => {
    let filtered = recipes;
    
    // Lọc theo danh mục
    if (selectedCategoryFilter) {
      filtered = filtered.filter(recipe => recipe.maDanhMuc === selectedCategoryFilter);
    }
    
    // Lọc theo từ khóa tìm kiếm
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

  // Validate form
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    const today = new Date().toISOString().split('T')[0];
    const startDate = new Date(formData.ngayBatDau);
    const endDate = new Date(formData.ngayKetThuc);

    if (!formData.ngayBatDau) {
      errors.ngayBatDau = 'Vui lòng chọn ngày bắt đầu';
    } else if (formData.ngayBatDau < today) {
      errors.ngayBatDau = 'Ngày bắt đầu không được trong quá khứ';
    }

    if (!formData.ngayKetThuc) {
      errors.ngayKetThuc = 'Vui lòng chọn ngày kết thúc';
    } else if (formData.ngayKetThuc < formData.ngayBatDau) {
      errors.ngayKetThuc = 'Ngày kết thúc phải sau ngày bắt đầu';
    }

    if (formData.giaTri <= 0) {
      errors.giaTri = 'Giá trị phải lớn hơn 0';
    }

    if (formData.loaiKhuyenMai === 'PHAN_TRAM' && formData.giaTri > 100) {
      errors.giaTri = 'Giá trị phần trăm không được vượt quá 100%';
    }

    if (!formData.tenKhuyenMai.trim()) {
      errors.tenKhuyenMai = 'Vui lòng nhập tên khuyến mãi';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Xử lý form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error khi người dùng sửa
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Thêm công thức vào danh sách áp dụng
  const handleAddRecipe = (maCongThuc: string) => {
    if (!formData.apDungSanPhams.some(item => item.maCongThuc === maCongThuc)) {
      setFormData(prev => ({
        ...prev,
        apDungSanPhams: [...prev.apDungSanPhams, { maCongThuc }]
      }));
    }
  };

  // Thêm danh mục vào danh sách áp dụng
  const handleAddCategory = (maDanhMuc: string) => {
    if (!formData.apDungSanPhams.some(item => item.maDanhMuc === maDanhMuc)) {
      setFormData(prev => ({
        ...prev,
        apDungSanPhams: [...prev.apDungSanPhams, { maDanhMuc }]
      }));
    }
  };

  const removeAppliedItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      apDungSanPhams: prev.apDungSanPhams.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (editingPromotion) {
        const updateData: UpdatePromotionData = {
          tenKhuyenMai: formData.tenKhuyenMai,
          loaiKhuyenMai: formData.loaiKhuyenMai,
          giaTri: formData.giaTri,
          ngayBatDau: formData.ngayBatDau,
          ngayKetThuc: formData.ngayKetThuc,
          trangThai: formData.trangThai,
          moTa: formData.moTa,
          apDungToiThieu: formData.apDungToiThieu,
          apDungSanPhams: formData.apDungSanPhams
        };
        await promotionsApi.updatePromotion(editingPromotion.maKhuyenMai, updateData);
        alert('Cập nhật khuyến mãi thành công!');
      } else {
        const createData: CreatePromotionData = {
          maKhuyenMai: formData.maKhuyenMai,
          tenKhuyenMai: formData.tenKhuyenMai,
          loaiKhuyenMai: formData.loaiKhuyenMai,
          giaTri: formData.giaTri,
          ngayBatDau: formData.ngayBatDau,
          ngayKetThuc: formData.ngayKetThuc,
          trangThai: formData.trangThai,
          moTa: formData.moTa,
          apDungToiThieu: formData.apDungToiThieu,
          apDungSanPhams: formData.apDungSanPhams
        };
        await promotionsApi.createPromotion(createData);
        alert('Tạo khuyến mãi thành công!');
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
      maKhuyenMai: promotion.maKhuyenMai,
      tenKhuyenMai: promotion.tenKhuyenMai,
      loaiKhuyenMai: promotion.loaiKhuyenMai,
      giaTri: promotion.giaTri,
      ngayBatDau: promotion.ngayBatDau.split('T')[0],
      ngayKetThuc: promotion.ngayKetThuc.split('T')[0],
      trangThai: promotion.trangThai,
      moTa: promotion.moTa || '',
      apDungToiThieu: promotion.apDungToiThieu || 0,
      apDungSanPhams: promotion.apDungSanPhams || []
    });
    setShowForm(true);
  };

  const handleDelete = async (maKhuyenMai: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
      try {
        await promotionsApi.deletePromotion(maKhuyenMai);
        alert('Xóa khuyến mãi thành công!');
        fetchPromotions();
      } catch (error: any) {
        alert(error.message || 'Có lỗi xảy ra khi xóa khuyến mãi');
      }
    }
  };

  const getRecipeName = (maCongThuc: string) => {
    const recipe = recipes.find(r => r.maCongThuc === maCongThuc);
    if (recipe) {
      return `${recipe.tenMonAn} - ${recipe.tenPhienBan}`;
    }
    return maCongThuc;
  };

  const getCategoryName = (maDanhMuc: string) => {
    const category = categories.find(c => c.maDanhMuc === maDanhMuc);
    return category ? category.tenDanhMuc : maDanhMuc;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Đang hoạt động';
      case 'INACTIVE': return 'Đã tắt';
      case 'EXPIRED': return 'Hết hạn';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-red-100 text-red-800';
      case 'EXPIRED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRecipes = getFilteredRecipes();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Khuyến mãi</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Thêm khuyến mãi
        </button>
      </div>

      {/* Form thêm/sửa khuyến mãi */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingPromotion ? 'Cập nhật khuyến mãi' : 'Thêm khuyến mãi mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Các trường thông tin cơ bản - giữ nguyên */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mã khuyến mãi *</label>
                  <input
                    type="text"
                    name="maKhuyenMai"
                    value={formData.maKhuyenMai}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded bg-gray-100"
                    required
                    disabled
                    placeholder="Mã sẽ được tạo tự động"
                  />
                  <p className="text-xs text-gray-500 mt-1">Mã khuyến mãi được tạo tự động</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tên khuyến mãi *</label>
                  <input
                    type="text"
                    name="tenKhuyenMai"
                    value={formData.tenKhuyenMai}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${formErrors.tenKhuyenMai ? 'border-red-500' : ''}`}
                    required
                    placeholder="VD: Ưu đãi khai trương"
                  />
                  {formErrors.tenKhuyenMai && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.tenKhuyenMai}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Loại khuyến mãi *</label>
                  <select
                    name="loaiKhuyenMai"
                    value={formData.loaiKhuyenMai}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="PHAN_TRAM">Phần trăm</option>
                    <option value="TIEN">Giảm tiền</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Giá trị * {formData.loaiKhuyenMai === 'PHAN_TRAM' ? '(%)' : '(VND)'}
                  </label>
                  <input
                    type="number"
                    name="giaTri"
                    value={formData.giaTri}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${formErrors.giaTri ? 'border-red-500' : ''}`}
                    required
                    min="0"
                    max={formData.loaiKhuyenMai === 'PHAN_TRAM' ? 100 : undefined}
                    step={formData.loaiKhuyenMai === 'PHAN_TRAM' ? 0.1 : 1000}
                  />
                  {formErrors.giaTri && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.giaTri}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày bắt đầu *</label>
                  <input
                    type="date"
                    name="ngayBatDau"
                    value={formData.ngayBatDau}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${formErrors.ngayBatDau ? 'border-red-500' : ''}`}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {formErrors.ngayBatDau && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.ngayBatDau}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Ngày kết thúc *</label>
                  <input
                    type="date"
                    name="ngayKetThuc"
                    value={formData.ngayKetThuc}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${formErrors.ngayKetThuc ? 'border-red-500' : ''}`}
                    required
                    min={formData.ngayBatDau || new Date().toISOString().split('T')[0]}
                  />
                  {formErrors.ngayKetThuc && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.ngayKetThuc}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Áp dụng tối thiểu (VND)</label>
                <input
                  type="number"
                  name="apDungToiThieu"
                  value={formData.apDungToiThieu}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  min="0"
                  step="1000"
                  placeholder="0 = không có điều kiện"
                />
                <p className="text-xs text-gray-500 mt-1">Số tiền tối thiểu để áp dụng khuyến mãi</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                <select
                  name="trangThai"
                  value={formData.trangThai}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Đã tắt</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea
                  name="moTa"
                  value={formData.moTa}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                  placeholder="Mô tả về chương trình khuyến mãi..."
                />
              </div>

              {/* Phạm vi áp dụng - GIAO DIỆN MỚI */}
              <div className="border rounded p-4 bg-gray-50">
                <label className="block text-sm font-medium mb-3">Phạm vi áp dụng</label>
                
                {/* Bộ lọc */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Lọc theo danh mục</label>
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Tất cả danh mục</option>
                      {categories.map(category => (
                        <option key={category.maDanhMuc} value={category.maDanhMuc}>
                          {category.tenDanhMuc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Tìm kiếm</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Tìm theo tên món, phiên bản..."
                    />
                  </div>
                </div>

                {/* Danh sách sản phẩm */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Công thức */}
                  <div className="border rounded">
                    <div className="bg-blue-50 p-3 border-b">
                      <h3 className="font-medium">Công thức món ăn ({filteredRecipes.length})</h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredRecipes.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          {recipes.length === 0 ? 'Đang tải...' : 'Không tìm thấy công thức nào'}
                        </div>
                      ) : (
                        filteredRecipes.map(recipe => (
                          <div
                            key={recipe.maCongThuc}
                            className="p-3 border-b hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                            onClick={() => handleAddRecipe(recipe.maCongThuc)}
                          >
                            <div>
                              <div className="font-medium">{recipe.tenMonAn}</div>
                              <div className="text-sm text-gray-600">
                                {recipe.tenPhienBan} • {recipe.tenDanhMuc}
                              </div>
                              <div className="text-sm font-medium text-green-600">
                                {formatCurrency(recipe.gia)}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="text-blue-500 hover:text-blue-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddRecipe(recipe.maCongThuc);
                              }}
                            >
                              Thêm
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/*{/* Danh mục *
                  <div className="border rounded">
                    <div className="bg-green-50 p-3 border-b">
                      <h3 className="font-medium">Danh mục ({categories.length})</h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {categories.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">Đang tải...</div>
                      ) : (
                        categories.map(category => (
                          <div
                            key={category.maDanhMuc}
                            className="p-3 border-b hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                            onClick={() => handleAddCategory(category.maDanhMuc)}
                          >
                            <div className="font-medium">{category.tenDanhMuc}</div>
                            <button
                              type="button"
                              className="text-blue-500 hover:text-blue-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddCategory(category.maDanhMuc);
                              }}
                            >
                              Thêm
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>*/}
                </div>

                {/* Danh sách đã chọn */}
                <div className="mt-4 border rounded bg-white">
                  <div className="bg-yellow-50 p-3 border-b">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Danh sách áp dụng</h3>
                      <span className="text-sm text-gray-600">
                        {formData.apDungSanPhams.length} mục đã chọn
                      </span>
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {formData.apDungSanPhams.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Chưa có mục nào được chọn (áp dụng toàn bộ menu)
                      </div>
                    ) : (
                      formData.apDungSanPhams.map((item, index) => (
                        <div key={index} className="p-3 border-b flex justify-between items-center">
                          <div className="flex items-center">
                            {item.maCongThuc ? (
                              <>
                                <span className="text-blue-600 mr-2">🍳</span>
                                <div>
                                  <div className="font-medium">{getRecipeName(item.maCongThuc)}</div>
                                  <div className="text-xs text-gray-500">Công thức</div>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-green-600 mr-2">📁</span>
                                <div>
                                  <div className="font-medium">{getCategoryName(item.maDanhMuc!)}</div>
                                  <div className="text-xs text-gray-500">Toàn bộ danh mục</div>
                                </div>
                              </>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAppliedItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  {formData.apDungSanPhams.length > 0 && (
                    <div className="p-3 border-t">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, apDungSanPhams: [] }))}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {editingPromotion ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPromotion(null);
                    resetForm();
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bảng danh sách khuyến mãi*/}
            <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-4 text-center">Đang tải...</div>
        ) : promotions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">Chưa có khuyến mãi nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Mã KM</th>
                  <th className="px-4 py-3 text-left">Tên khuyến mãi</th>
                  <th className="px-4 py-3 text-left">Loại</th>
                  <th className="px-4 py-3 text-left">Giá trị</th>
                  <th className="px-4 py-3 text-left">Thời gian</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {promotions.map(promotion => (
                  <tr key={promotion.maKhuyenMai} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{promotion.maKhuyenMai}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{promotion.tenKhuyenMai}</div>
                        {promotion.moTa && (
                          <div className="text-sm text-gray-500">{promotion.moTa}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {promotion.loaiKhuyenMai === 'PHAN_TRAM' ? 'Phần trăm' : 'Giảm tiền'}
                    </td>
                    <td className="px-4 py-3">
                      {promotion.loaiKhuyenMai === 'PHAN_TRAM' 
                        ? `${promotion.giaTri}%`
                        : `${formatCurrency(promotion.giaTri)}`
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div>Từ: {new Date(promotion.ngayBatDau).toLocaleDateString('vi-VN')}</div>
                        <div>Đến: {new Date(promotion.ngayKetThuc).toLocaleDateString('vi-VN')}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(promotion.trangThai)}`}>
                        {getStatusText(promotion.trangThai)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(promotion)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(promotion.maKhuyenMai)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Xóa
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
      {/* ... */}
    </div>
  );
};

export default PromotionManagement;
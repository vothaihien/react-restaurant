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
  const [formData, setFormData] = useState({
    maKhuyenMai: '',
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
      setRecipes(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách công thức:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await promotionsApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách danh mục:', error);
    }
  };

  // Xử lý form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleRecipeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRecipeId = e.target.value;
    if (selectedRecipeId && !formData.apDungSanPhams.some(item => item.maCongThuc === selectedRecipeId)) {
      setFormData(prev => ({
        ...prev,
        apDungSanPhams: [...prev.apDungSanPhams, { maCongThuc: selectedRecipeId }]
      }));
    }
  };

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCategoryId = e.target.value;
    if (selectedCategoryId && !formData.apDungSanPhams.some(item => item.maDanhMuc === selectedCategoryId)) {
      setFormData(prev => ({
        ...prev,
        apDungSanPhams: [...prev.apDungSanPhams, { maDanhMuc: selectedCategoryId }]
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
      maKhuyenMai: '',
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
      return `${recipe.tenMonAn} - ${recipe.tenPhienBan} (${formatCurrency(recipe.gia)})`;
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Khuyến mãi</h1>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingPromotion ? 'Cập nhật khuyến mãi' : 'Thêm khuyến mãi mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mã khuyến mãi *</label>
                  <input
                    type="text"
                    name="maKhuyenMai"
                    value={formData.maKhuyenMai}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                    disabled={!!editingPromotion}
                    placeholder="VD: KHAI_TRUONG_10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tên khuyến mãi *</label>
                  <input
                    type="text"
                    name="tenKhuyenMai"
                    value={formData.tenKhuyenMai}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                    placeholder="VD: Ưu đãi khai trương"
                  />
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
                    className="w-full p-2 border rounded"
                    required
                    min="0"
                    step={formData.loaiKhuyenMai === 'PHAN_TRAM' ? 0.1 : 1000}
                  />
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
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Ngày kết thúc *</label>
                  <input
                    type="date"
                    name="ngayKetThuc"
                    value={formData.ngayKetThuc}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
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

              {/* Phạm vi áp dụng */}
              <div>
                <label className="block text-sm font-medium mb-2">Phạm vi áp dụng</label>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Thêm công thức</label>
                    <select
                      onChange={handleRecipeSelect}
                      className="w-full p-2 border rounded"
                      defaultValue=""
                    >
                      <option value="">Chọn công thức</option>
                      {recipes.map(recipe => (
                        <option key={recipe.maCongThuc} value={recipe.maCongThuc}>
                          {recipe.tenMonAn} - {recipe.tenPhienBan} ({formatCurrency(recipe.gia)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Thêm danh mục</label>
                    <select
                      onChange={handleCategorySelect}
                      className="w-full p-2 border rounded"
                      defaultValue=""
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map(category => (
                        <option key={category.maDanhMuc} value={category.maDanhMuc}>
                          {category.tenDanhMuc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Danh sách áp dụng */}
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2">Danh sách áp dụng:</h4>
                  {formData.apDungSanPhams.length === 0 ? (
                    <p className="text-gray-500">Chưa có công thức/danh mục nào được chọn (áp dụng toàn bộ menu)</p>
                  ) : (
                    <ul className="space-y-2">
                      {formData.apDungSanPhams.map((item, index) => (
                        <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <span>
                            {item.maCongThuc ? `Công thức: ${getRecipeName(item.maCongThuc)}` : 
                             item.maDanhMuc ? `Danh mục: ${getCategoryName(item.maDanhMuc)}` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAppliedItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
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

      {/* Bảng danh sách khuyến mãi */}
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
    </div>
  );
};

export default PromotionManagement;
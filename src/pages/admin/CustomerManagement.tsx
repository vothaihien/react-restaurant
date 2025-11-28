// components/CustomerManagement.tsx
import React, { useState, useEffect } from 'react';
import customerApi, { 
  KhachHang, 
  KhachHangCreateModel, 
  KhachHangUpdateModel,
  ThongKeKhachHang,
  ChiTietKhachHangResponse
} from 'src/api/khachhang';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<KhachHang[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ThongKeKhachHang>({
    TongKhachHang: 0,
    KhachHangMoiThang: 0,
    KhachHangThanThiet: 0,
    SinhNhatThang: 0
  });
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [selectedCustomer, setSelectedCustomer] = useState<ChiTietKhachHangResponse | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<KhachHang | null>(null);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'orders', 'bookings'
  const [formData, setFormData] = useState({
    HoTen: '',
    SoDienThoai: '',
    Email: '',
    HinhAnh: ''
  });

  // Lấy thống kê
  const fetchStats = async () => {
    try {
      const data = await customerApi.layThongKe();
      setStats(data);
    } catch (error) {
      console.error('Lỗi khi lấy thống kê:', error);
      alert('Lỗi khi tải thống kê');
    }
  };

  // Lấy danh sách khách hàng
  const fetchCustomers = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await customerApi.layDanhSach(search, page, pagination.pageSize);
      setCustomers(response.Data);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: response.TotalRecords
      }));
    } catch (error) {
      console.error('Lỗi khi lấy danh sách khách hàng:', error);
      alert('Lỗi khi tải danh sách khách hàng');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    fetchCustomers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(1, searchText);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('vi-VN');
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'Chưa có dữ liệu';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
  };

  const showCustomerDetail = async (customer: KhachHang) => {
    try {
      const response = await customerApi.layChiTiet(customer.MaKhachHang);
      if (response.Success) {
        setSelectedCustomer(response.Data);
        setDetailModalVisible(true);
        setActiveTab('profile');
      } else {
        alert('Không tìm thấy thông tin khách hàng');
      }
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết khách hàng:', error);
      alert('Lỗi khi tải thông tin chi tiết');
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setFormData({
      HoTen: '',
      SoDienThoai: '',
      Email: '',
      HinhAnh: ''
    });
    setFormModalVisible(true);
  };

  const handleEditCustomer = (customer: KhachHang) => {
    setEditingCustomer(customer);
    setFormData({
      HoTen: customer.HoTen,
      SoDienThoai: customer.SoDienThoai,
      Email: customer.Email || '',
      HinhAnh: customer.HinhAnh || ''
    });
    setFormModalVisible(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customerApi.capNhatKhachHang(editingCustomer.MaKhachHang, formData as KhachHangUpdateModel);
        alert('Cập nhật khách hàng thành công');
      } else {
        await customerApi.themKhachHang(formData as KhachHangCreateModel);
        alert('Thêm khách hàng thành công');
      }
      
      setFormModalVisible(false);
      fetchCustomers(pagination.current, searchText);
      fetchStats();
    } catch (error: any) {
      console.error('Lỗi khi lưu khách hàng:', error);
      if (error.response && error.response.data) {
        alert(error.response.data.Message);
      } else {
        alert('Lỗi khi lưu thông tin khách hàng');
      }
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await customerApi.xuatExcel(searchText);
      if (response.Success) {
        // Tạo file Excel từ dữ liệu
        console.log('Dữ liệu xuất Excel:', response.Data);
        alert('Dữ liệu đã sẵn sàng để xuất Excel');
      }
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
      alert('Lỗi khi xuất dữ liệu Excel');
    }
  };

  const getStatusColor = (count: number) => {
    if (count >= 5) return 'bg-yellow-100 text-yellow-800';
    if (count >= 3) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getAvatar = (customer: KhachHang) => {
    if (customer.HinhAnh) {
      return <img src={customer.HinhAnh} alt={customer.HoTen} className="w-10 h-10 rounded-full" />;
    }
    const firstLetter = customer.HoTen ? customer.HoTen.charAt(0).toUpperCase() : 'K';
    return (
      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
        {firstLetter}
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* A. Thanh thống kê nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Tổng số khách hàng</h3>
          <p className="text-3xl font-bold text-green-600">{stats.TongKhachHang}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Khách hàng mới (Tháng này)</h3>
          <p className="text-3xl font-bold text-blue-600">+{stats.KhachHangMoiThang}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Khách hàng thân thiết</h3>
          <p className="text-3xl font-bold text-red-600">{stats.KhachHangThanThiet}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Sinh nhật trong tháng</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.SinhNhatThang}</p>
        </div>
      </div>

      {/* B. Thanh công cụ */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Tìm kiếm theo tên, số điện thoại hoặc email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Tìm kiếm
              </button>
            </form>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddCustomer}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-2"
            >
              <span>+</span>
              Thêm khách hàng mới
            </button>
            <button 
              onClick={handleExportExcel}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center gap-2"
            >
              <span></span>
              Xuất Excel
            </button>
          </div>
        </div>
      </div>

      {/* C. Bảng dữ liệu chính */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Danh sách khách hàng ({pagination.total} khách hàng)</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số điện thoại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số lần ăn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lần cuối đến
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng chi tiêu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.MaKhachHang} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getAvatar(customer)}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.HoTen}
                          </div>
                          {customer.Email && (
                            <div className="text-sm text-gray-500">{customer.Email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPhone(customer.SoDienThoai)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(customer.SoLanAnTichLuy)}`}>
                        {customer.SoLanAnTichLuy} lần
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTimeAgo(customer.LanCuoiDen || '')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(customer.TongChiTieu || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => showCustomerDetail(customer)}
                          className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50"
                        >
                          👁️ Xem
                        </button>
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50"
                        >
                          
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị {((pagination.current - 1) * pagination.pageSize) + 1} đến{' '}
              {Math.min(pagination.current * pagination.pageSize, pagination.total)} của{' '}
              {pagination.total} khách hàng
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchCustomers(pagination.current - 1, searchText)}
                disabled={pagination.current === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
              >
                ← Trước
              </button>
              <button
                onClick={() => fetchCustomers(pagination.current + 1, searchText)}
                disabled={pagination.current * pagination.pageSize >= pagination.total}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
              >
                Sau →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal chi tiết khách hàng với Tabs */}
      {detailModalVisible && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Chi tiết khách hàng</h2>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`mr-8 py-4 px-1 text-sm font-medium ${
                    activeTab === 'profile'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Thông tin cá nhân
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`mr-8 py-4 px-1 text-sm font-medium ${
                    activeTab === 'orders'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Lịch sử đơn hàng
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`mr-8 py-4 px-1 text-sm font-medium ${
                    activeTab === 'bookings'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Lịch sử đặt bàn
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'profile' && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã khách hàng</label>
                    <p className="text-gray-900">{selectedCustomer.Profile?.MaKhachHang}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                    <p className="text-gray-900">{selectedCustomer.Profile?.HoTen}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <p className="text-gray-900">{formatPhone(selectedCustomer.Profile?.SoDienThoai)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedCustomer.Profile?.Email || 'Chưa có'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lần ăn</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCustomer.Profile?.SoLanAnTichLuy || 0)}`}>
                      {selectedCustomer.Profile?.SoLanAnTichLuy || 0} lần
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lần No-show</label>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {selectedCustomer.Profile?.NoShowCount || 0} lần
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo</label>
                    <p className="text-gray-900">{formatDate(selectedCustomer.Profile?.NgayTao || '')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng từ</label>
                    <p className="text-gray-900">{getTimeAgo(selectedCustomer.Profile?.NgayTao || '')}</p>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Lịch sử đơn hàng</h3>
                  {selectedCustomer.DonHangs && selectedCustomer.DonHangs.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCustomer.DonHangs.map((donHang) => (
                        <div key={donHang.MaDonHang} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Đơn hàng {donHang.MaDonHang}</p>
                              <p className="text-sm text-gray-600">
                                Thời gian: {formatDate(donHang.ThoiGianDatHang)} | 
                                Số người: {donHang.SoLuongNguoiDK} |
                                Tiền cọc: {formatCurrency(donHang.TienDatCoc || 0)}
                              </p>
                              {donHang.GhiChu && (
                                <p className="text-sm text-gray-600 mt-1">Ghi chú: {donHang.GhiChu}</p>
                              )}
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              donHang.TrangThai === 'HOAN_TAT' ? 'bg-green-100 text-green-800' :
                              donHang.TrangThai === 'HUY' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {donHang.TrangThai}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Chưa có đơn hàng nào</p>
                  )}
                </div>
              )}

              {activeTab === 'bookings' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Lịch sử đặt bàn</h3>
                  {selectedCustomer.DatBans && selectedCustomer.DatBans.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCustomer.DatBans.map((datBan) => (
                        <div key={datBan.MaDonHang} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Bàn {datBan.TenBan} - Đơn {datBan.MaDonHang}</p>
                              <p className="text-sm text-gray-600">
                                Thời gian: {formatDate(datBan.ThoiGianDatHang)}
                              </p>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              datBan.TrangThai === 'HOAN_TAT' ? 'bg-green-100 text-green-800' :
                              datBan.TrangThai === 'HUY' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {datBan.TrangThai}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Chưa có lịch sử đặt bàn</p>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setDetailModalVisible(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal thêm/sửa khách hàng */}
      {formModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                {editingCustomer ? 'Sửa thông tin khách hàng' : 'Thêm khách hàng mới'}
              </h2>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ tên *
                </label>
                <input
                  type="text"
                  name="HoTen"
                  value={formData.HoTen}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập họ tên khách hàng"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  name="SoDienThoai"
                  value={formData.SoDienThoai}
                  onChange={handleInputChange}
                  required
                  pattern="[0-9]{10,11}"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số điện thoại"
                />
                <p className="text-xs text-gray-500 mt-1">Số điện thoại phải có 10-11 chữ số</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="Email"
                  value={formData.Email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL hình ảnh
                </label>
                <input
                  type="url"
                  name="HinhAnh"
                  value={formData.HinhAnh}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập URL hình ảnh (không bắt buộc)"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {editingCustomer ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button
                  type="button"
                  onClick={() => setFormModalVisible(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
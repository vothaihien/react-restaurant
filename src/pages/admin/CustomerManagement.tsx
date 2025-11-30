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
    tongKhachHang: 0,
    khachHangMoiThang: 0,
    khachHangThanThiet: 0,
    khachNoShow: 0
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
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    HoTen: '',
    SoDienThoai: '',
    Email: '',
    HinhAnh: ''
  });
  const [error, setError] = useState<string | null>(null);

  const formatPhone = (phone: string | undefined | null) => {
    if (!phone) return '';
    const safePhone = phone || '';
    return safePhone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  };

  const formatCurrency = (amount: number | undefined | null) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('vi-VN');
  };

  const getTimeAgo = (dateString: string | undefined | null) => {
    if (!dateString) return 'Chưa có dữ liệu';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
  };

  const getStatusColor = (count: number) => {
    if (count >= 5) return 'bg-yellow-100 text-yellow-800';
    if (count >= 3) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };
  
  const getAvatarAndNameDisplay = (customer: KhachHang) => {
    const firstLetter = customer.hoTen ? customer.hoTen.charAt(0).toUpperCase() : 'K';
    
    const avatar = (
      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">
        {firstLetter}
      </div>
    );
    
   
    if (customer.hinhAnh) {
        return (
            <div className="flex items-center">
                <img 
                    src={customer.hinhAnh} 
                    alt={customer.hoTen} 
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0" 
                    onError={(e) => {
                        const target = e.target as HTMLImageElement; 
                        const parent = target.parentElement;
                        
                        target.style.display = 'none'; 
                        
                        if (parent) {
                            const tempDiv = document.createElement('div');
                            
                            parent.insertBefore(tempDiv, target as Node); 
                            
                            ReactDOM.render(avatar, tempDiv);
                        }
                    }} 
                />
                <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{customer.hoTen}</div>
                    {customer.email && (<div className="text-sm text-gray-500">{customer.email}</div>)}
                </div>
            </div>
        );
    }
    
    return (
      <div className="flex items-center">
        {avatar}
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900">{customer.hoTen}</div>
          {customer.email && (<div className="text-sm text-gray-500">{customer.email}</div>)}
        </div>
      </div>
    );
  };
  
  // Lấy thống kê
  const fetchStats = async () => {
    try {
      setError(null);
      const data = await customerApi.layThongKe();
      setStats(data);
    } catch (error) {
      console.error(' Lỗi khi lấy thống kê:', error);
      setError('Lỗi khi tải thống kê khách hàng');
    }
  };

  // Lấy danh sách khách hàng
  const fetchCustomers = async (page = 1, search = '') => {
    setLoading(true);
    try {
      setError(null);
      const dataResponse = await customerApi.layDanhSach(search, page, pagination.pageSize);
      
      const customerData = Array.isArray(dataResponse.data) ? dataResponse.data : [];
      setCustomers(customerData);
      
      setPagination(prev => ({
        ...prev,
        current: dataResponse.page || page,
        total: dataResponse.totalRecords || 0
      }));
    } catch (error) {
      console.error(' Lỗi khi lấy danh sách khách hàng:', error);
      setError('Lỗi khi tải danh sách khách hàng');
      setCustomers([]);
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
  
  const showCustomerDetail = async (customer: KhachHang) => {
    try {
      setError(null);
      
      const response = await customerApi.layChiTiet(customer.maKhachHang); 
      
      if (response.success && response.data) {
        console.log("SUCCESS: Mở modal với dữ liệu", response.data.profile.maKhachHang); 
        setSelectedCustomer(response.data);
        setDetailModalVisible(true);
        setActiveTab('profile');
      } else {
        console.error("FAILURE: API trả về không thành công. Message:", response.message);
        
        setSelectedCustomer(null);
        setError(response.message || 'Không tìm thấy thông tin chi tiết khách hàng.'); 
      }
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết khách hàng:', error);
      setError('Lỗi kết nối hoặc lỗi server khi tải chi tiết khách hàng.');
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
    setError(null);
    setFormModalVisible(true);
  };

  const handleEditCustomer = (customer: KhachHang) => {
    setEditingCustomer(customer);
    setFormData({
      HoTen: customer.hoTen,
      SoDienThoai: customer.soDienThoai,
      Email: customer.email || '',
      HinhAnh: customer.hinhAnh || ''
    });
    setError(null);
    setFormModalVisible(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      let apiResponse;

      if (editingCustomer) {
        apiResponse = await customerApi.capNhatKhachHang(editingCustomer.maKhachHang, formData as KhachHangUpdateModel);
      } else {
        apiResponse = await customerApi.themKhachHang(formData as KhachHangCreateModel);
      }
      
      if (apiResponse.success) {
        alert(apiResponse.message || 'Thao tác thành công');
        setFormModalVisible(false);
        fetchCustomers(pagination.current, searchText);
        fetchStats();
      } else {
         // Hiển thị lỗi từ API
        setError(apiResponse.message || 'Lỗi xử lý nghiệp vụ');
      }
    } catch (error: any) {
      console.error('Lỗi khi lưu khách hàng:', error);
      // Xử lý lỗi kết nối/server 500
      setError(error.message || 'Lỗi kết nối API hoặc server');
    }
  };

  const handleExportExcel = async () => {
    try {
      setError(null);
      const response = await customerApi.xuatExcel(searchText);
      if (response.success) {
        console.log('Dữ liệu xuất Excel:', response.data);
        alert('Dữ liệu đã sẵn sàng để xuất Excel');
      }
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
      setError('Lỗi khi xuất dữ liệu Excel');
    }
  };


  return (
    <div className="p-6">
      {/* Hiển thị lỗi */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* A. Thanh thống kê nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Tổng số khách hàng</h3>
          <p className="text-3xl font-bold text-green-600">{stats.tongKhachHang}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Khách hàng mới (Tháng này)</h3>
          <p className="text-3xl font-bold text-blue-600">+{stats.khachHangMoiThang}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Khách hàng thân thiết</h3>
          <p className="text-3xl font-bold text-red-600">{stats.khachHangThanThiet}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Khách No-Show</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.khachNoShow}</p>
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
              <span>📊</span>
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
                {customers && customers.length > 0 ? (
                  customers.map((customer) => (
                    <tr key={customer.maKhachHang} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        
                        {getAvatarAndNameDisplay(customer)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPhone(customer.soDienThoai)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(customer.soLanAnTichLuy)}`}>
                          {customer.soLanAnTichLuy} lần
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTimeAgo(customer.lanCuoiDen)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(customer.tongChiTieu)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => showCustomerDetail(customer)}
                            className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50"
                          >
                             Xem
                          </button>
                          <button
                            onClick={() => handleEditCustomer(customer)}
                            className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50"
                          >
                             Sửa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {!loading && "Không có khách hàng nào"}
                    </td>
                  </tr>
                )}
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
                  Lịch sử đơn hàng ({selectedCustomer.donHangs?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`mr-8 py-4 px-1 text-sm font-medium ${
                    activeTab === 'bookings'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Lịch sử đặt bàn ({selectedCustomer.datBans?.length || 0})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Sử dụng camelCase để truy cập các trường con */}
              {activeTab === 'profile' && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã khách hàng</label>
                    <p className="text-gray-900">{selectedCustomer.profile?.maKhachHang}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                    <p className="text-gray-900">{selectedCustomer.profile?.hoTen}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <p className="text-gray-900">{formatPhone(selectedCustomer.profile?.soDienThoai)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedCustomer.profile?.email || 'Chưa có'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lần ăn</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCustomer.profile?.soLanAnTichLuy || 0)}`}>
                      {selectedCustomer.profile?.soLanAnTichLuy || 0} lần
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lần No-show</label>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {selectedCustomer.profile?.noShowCount || 0} lần
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo</label>
                    <p className="text-gray-900">{formatDate(selectedCustomer.profile?.ngayTao)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng từ</label>
                    <p className="text-gray-900">{getTimeAgo(selectedCustomer.profile?.ngayTao)}</p>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Lịch sử đơn hàng</h3>
                  {selectedCustomer.donHangs && selectedCustomer.donHangs.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCustomer.donHangs.map((donHang) => (
                        <div key={donHang.maDonHang} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Đơn hàng {donHang.maDonHang}</p>
                              <p className="text-sm text-gray-600">
                                Thời gian: {formatDate(donHang.thoiGianDatHang)} | 
                                Số người: {donHang.soLuongNguoiDK} |
                                Tiền cọc: {formatCurrency(donHang.tienDatCoc)}
                              </p>
                              {donHang.ghiChu && (
                                <p className="text-sm text-gray-600 mt-1">Ghi chú: {donHang.ghiChu}</p>
                              )}
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              donHang.trangThai === 'DA_HOAN_THANH' ? 'bg-green-100 text-green-800' :
                              donHang.trangThai === 'DA_HUY' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {donHang.trangThai}
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
                  {selectedCustomer.datBans && selectedCustomer.datBans.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCustomer.datBans.map((datBan) => (
                        <div key={datBan.maDonHang} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Bàn {datBan.tenBan} - Đơn {datBan.maDonHang}</p>
                              <p className="text-sm text-gray-600">
                                Thời gian: {formatDate(datBan.thoiGianDatHang)}
                              </p>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              datBan.trangThai === 'DA_HOAN_THANH' ? 'bg-green-100 text-green-800' :
                              datBan.trangThai === 'DA_HUY' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {datBan.trangThai}
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
                onClick={() => {
                    setDetailModalVisible(false);
                    setSelectedCustomer(null);
                    setError(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}


      {formModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                {editingCustomer ? 'Sửa thông tin khách hàng' : 'Thêm khách hàng mới'}
              </h2>
            </div>
            
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            
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
                  onClick={() => {
                    setFormModalVisible(false);
                    setError(null); // Xóa lỗi khi đóng form
                  }}
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

import ReactDOM from 'react-dom';

export default CustomerManagement;
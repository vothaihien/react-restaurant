import React, { useState, useEffect } from 'react';
import customerApi, { 
  KhachHang, 
  KhachHangCreateModel, 
  KhachHangUpdateModel,
  ThongKeKhachHang,
  ChiTietKhachHangResponse
} from '@/api/khachhang'; // Đảm bảo đường dẫn đúng
import { 
  Users, UserPlus, Star, UserX, Search, FileSpreadsheet, 
  Edit, Eye, Phone, Mail, Calendar, DollarSign, X
} from 'lucide-react';

const CustomerManagement = () => {
  // --- STATE & LOGIC (GIỮ NGUYÊN 100%) ---
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

  // --- HELPER FUNCTIONS ---
  const formatPhone = (phone: string | undefined | null) => {
    if (!phone) return '';
    return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  };

  const formatCurrency = (amount: number | undefined | null) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
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

  const getAvatarAndNameDisplay = (customer: KhachHang) => {
    const firstLetter = customer.hoTen ? customer.hoTen.charAt(0).toUpperCase() : 'K';
    // Random màu nền avatar cho đẹp
    const bgColors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    const randomColor = bgColors[customer.hoTen.length % bgColors.length];

    return (
        <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
                {customer.hinhAnh ? (
                    <img 
                        src={customer.hinhAnh} 
                        alt={customer.hoTen} 
                        className="h-10 w-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${customer.hoTen}&background=random`;
                        }}
                    />
                ) : (
                    <div className={`h-10 w-10 rounded-full ${randomColor} flex items-center justify-center text-white font-bold border-2 border-white dark:border-gray-700 shadow-sm`}>
                        {firstLetter}
                    </div>
                )}
            </div>
            <div className="ml-4">
                <div className="text-sm font-bold text-gray-900 dark:text-white">{customer.hoTen}</div>
                {customer.email && (<div className="text-xs text-gray-500 dark:text-gray-400">{customer.email}</div>)}
            </div>
        </div>
    );
  };
  
  // --- API CALLS (GIỮ NGUYÊN) ---
  const fetchStats = async () => {
    try {
      setError(null);
      const data = await customerApi.layThongKe();
      setStats(data);
    } catch (error) {
      console.error('Lỗi khi lấy thống kê:', error);
      // Giữ lỗi im lặng hoặc set thông báo nhẹ để ko làm phiền UI
    }
  };

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
      console.error('Lỗi khi lấy danh sách:', error);
      setCustomers([]);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchStats();
    fetchCustomers();
  }, []);

  // --- HANDLERS (GIỮ NGUYÊN) ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(1, searchText);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const showCustomerDetail = async (customer: KhachHang) => {
    try {
      setError(null);
      const response = await customerApi.layChiTiet(customer.maKhachHang); 
      if (response.success && response.data) {
        setSelectedCustomer(response.data);
        setDetailModalVisible(true);
        setActiveTab('profile');
      } else {
        alert(response.message || 'Không tìm thấy thông tin chi tiết.'); 
      }
    } catch (error) {
      alert('Lỗi kết nối khi tải chi tiết.');
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setFormData({ HoTen: '', SoDienThoai: '', Email: '', HinhAnh: '' });
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
        setError(apiResponse.message || 'Lỗi xử lý nghiệp vụ');
      }
    } catch (error: any) {
      setError(error.message || 'Lỗi kết nối API');
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await customerApi.xuatExcel(searchText);
      if (response.success) {
        alert('Đã xuất Excel thành công!');
      }
    } catch (error) {
      alert('Lỗi khi xuất Excel');
    }
  };

  // --- RENDER UI (DARK MODE & MODERN DESIGN) ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300 font-sans">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-8 h-8 text-blue-600" />
                Quản lý Khách hàng
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Theo dõi thông tin và lịch sử khách hàng
            </p>
        </div>
      </div>

      {/* 2. STATS CARDS (Thiết kế mới) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-16 h-16 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng khách hàng</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.tongKhachHang}</p>
            <div className="mt-2 w-full bg-blue-100 dark:bg-blue-900/30 h-1 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-3/4"></div>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <UserPlus className="w-16 h-16 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Khách mới (Tháng)</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">+{stats.khachHangMoiThang}</p>
            <div className="mt-2 w-full bg-green-100 dark:bg-green-900/30 h-1 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full w-1/2"></div>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Star className="w-16 h-16 text-yellow-500" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Khách thân thiết</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.khachHangThanThiet}</p>
            <div className="mt-2 w-full bg-yellow-100 dark:bg-yellow-900/30 h-1 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full w-1/3"></div>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <UserX className="w-16 h-16 text-red-500" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Khách No-Show</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.khachNoShow}</p>
            <div className="mt-2 w-full bg-red-100 dark:bg-red-900/30 h-1 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full w-1/4"></div>
            </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT CARD */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                        type="text" 
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Tìm theo tên, SĐT, email..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all"
                    />
                </form>

                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={handleAddCustomer}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-200 dark:shadow-none"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Thêm mới</span>
                    </button>
                    <button 
                        onClick={handleExportExcel}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-emerald-200 dark:shadow-none"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Xuất Excel</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Error Message */}
        {error && (
            <div className="m-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
                <span className="font-bold">Lỗi:</span> {error}
            </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase font-semibold text-xs tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Khách hàng</th>
                        <th className="px-6 py-4">Số điện thoại</th>
                        <th className="px-6 py-4 text-center">Tần suất ăn</th>
                        <th className="px-6 py-4">Lần cuối đến</th>
                        <th className="px-6 py-4 text-right">Tổng chi</th>
                        <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {loading ? (
                        <tr><td colSpan={6} className="p-12 text-center text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</td></tr>
                    ) : customers.length > 0 ? (
                        customers.map((customer) => (
                            <tr key={customer.maKhachHang} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getAvatarAndNameDisplay(customer)}
                                </td>
                                <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-300">
                                    {formatPhone(customer.soDienThoai)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                                        customer.soLanAnTichLuy >= 10 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        customer.soLanAnTichLuy >= 5 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                        {customer.soLanAnTichLuy} lần
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                    {getTimeAgo(customer.lanCuoiDen)}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(customer.tongChiTieu)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => showCustomerDetail(customer)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleEditCustomer(customer)}
                                            className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                            title="Sửa"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={6} className="p-12 text-center text-gray-500 dark:text-gray-400">Không tìm thấy khách hàng nào</td></tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
                Hiển thị {((pagination.current - 1) * pagination.pageSize) + 1} - {Math.min(pagination.current * pagination.pageSize, pagination.total)} / {pagination.total}
            </span>
            <div className="flex gap-2">
                <button
                    onClick={() => fetchCustomers(pagination.current - 1, searchText)}
                    disabled={pagination.current === 1}
                    className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                >
                    Trước
                </button>
                <button
                    onClick={() => fetchCustomers(pagination.current + 1, searchText)}
                    disabled={pagination.current * pagination.pageSize >= pagination.total}
                    className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                >
                    Sau
                </button>
            </div>
        </div>
      </div>

      {/* 4. MODAL FORM ADD/EDIT */}
      {formModalVisible && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {editingCustomer ? 'Sửa thông tin' : 'Thêm khách hàng'}
                    </h2>
                    <button onClick={() => setFormModalVisible(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Họ tên *</label>
                        <input name="HoTen" value={formData.HoTen} onChange={handleInputChange} required 
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all"
                            placeholder="Nguyễn Văn A"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Số điện thoại *</label>
                        <input name="SoDienThoai" value={formData.SoDienThoai} onChange={handleInputChange} required type="tel"
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all"
                            placeholder="0912..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                        <input name="Email" value={formData.Email} onChange={handleInputChange} type="email"
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all"
                            placeholder="email@example.com"
                        />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setFormModalVisible(false)} className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">Hủy</button>
                        <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition">Lưu thông tin</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* 5. MODAL DETAIL (Tabs included) */}
      {detailModalVisible && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 sticky top-0 backdrop-blur-md z-10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hồ sơ khách hàng</h2>
                    <button onClick={() => setDetailModalVisible(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 px-6">
                    <div className="flex gap-6">
                        {['profile', 'orders', 'bookings'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === tab 
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                {tab === 'profile' ? 'Thông tin chung' : tab === 'orders' ? `Đơn hàng (${selectedCustomer.donHangs?.length || 0})` : `Đặt bàn (${selectedCustomer.datBans?.length || 0})`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 text-gray-800 dark:text-gray-200">
                    {/* Tab Profile */}
                    {activeTab === 'profile' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div><p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Mã KH</p><p className="font-mono">{selectedCustomer.profile?.maKhachHang}</p></div>
                                <div><p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Họ tên</p><p className="font-bold text-lg">{selectedCustomer.profile?.hoTen}</p></div>
                                <div><p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">SĐT</p><p className="font-medium text-blue-600 dark:text-blue-400">{formatPhone(selectedCustomer.profile?.soDienThoai)}</p></div>
                                <div><p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Email</p><p>{selectedCustomer.profile?.email || '---'}</p></div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Hạng thành viên</p>
                                    <span className="inline-flex mt-1 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold border border-yellow-200 dark:border-yellow-800">
                                        {selectedCustomer.profile?.soLanAnTichLuy > 10 ? 'VIP Gold' : 'Thành viên'}
                                    </span>
                                </div>
                                <div className="flex gap-4">
                                    <div><p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Số lần ăn</p><p className="font-bold">{selectedCustomer.profile?.soLanAnTichLuy} lần</p></div>
                                    <div><p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">No-show</p><p className="font-bold text-red-500">{selectedCustomer.profile?.noShowCount} lần</p></div>
                                </div>
                                <div><p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Ngày tham gia</p><p>{formatDate(selectedCustomer.profile?.ngayTao)} ({getTimeAgo(selectedCustomer.profile?.ngayTao)})</p></div>
                            </div>
                        </div>
                    )}

                    {/* Tab Orders */}
                    {activeTab === 'orders' && (
                        <div className="space-y-3">
                            {selectedCustomer.donHangs?.length > 0 ? selectedCustomer.donHangs.map(order => (
                                <div key={order.maDonHang} className="flex justify-between items-center p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">Đơn #{order.maDonHang}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                            <Calendar className="w-3 h-3" /> {formatDate(order.thoiGianDatHang)}
                                            <Users className="w-3 h-3 ml-2" /> {order.soLuongNguoiDK} người
                                        </p>
                                        {order.ghiChu && <p className="text-xs text-gray-500 mt-1 italic">"{order.ghiChu}"</p>}
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold mb-1 ${
                                            order.trangThai === 'DA_HOAN_THANH' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>{order.trangThai}</span>
                                        {order.tienDatCoc > 0 && <p className="text-xs text-gray-500">Cọc: {formatCurrency(order.tienDatCoc)}</p>}
                                    </div>
                                </div>
                            )) : <p className="text-center py-8 text-gray-500">Chưa có lịch sử đơn hàng</p>}
                        </div>
                    )}

                    {/* Tab Bookings */}
                    {activeTab === 'bookings' && (
                        <div className="space-y-3">
                             {selectedCustomer.datBans?.length > 0 ? selectedCustomer.datBans.map(booking => (
                                <div key={booking.maDonHang} className="flex justify-between items-center p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">Đặt bàn {booking.tenBan || 'Mang về'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(booking.thoiGianDatHang)}</p>
                                    </div>
                                    <span className="text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded">{booking.trangThai}</span>
                                </div>
                             )) : <p className="text-center py-8 text-gray-500">Chưa có lịch sử đặt bàn</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
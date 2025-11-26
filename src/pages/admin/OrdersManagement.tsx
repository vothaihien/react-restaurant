// components/OrderManagement.tsx
import React, { useState, useEffect } from 'react';
// Import đúng service
import { donHangService } from '@/services/donHangService'; 
// Giả sử ordersApi vẫn dùng để lấy danh sách tổng, nếu ông chuyển hết qua donHangService thì thay luôn nhé
import { ordersApi, Order, OrderStats } from '@/api/donhang'; 

// Định nghĩa lại kiểu Tab để bao gồm các trạng thái mới
type TabType = 'all' | 'pending' | 'active' | 'completed' | 'cancelled';

const OrderManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // State lưu chi tiết món ăn (kiểu any hoặc interface MonAnDatDto)
  const [orderDetails, setOrderDetails] = useState<any[]>([]); 
  
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load dữ liệu
  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  // Lọc đơn hàng khi activeTab hoặc orders thay đổi
  useEffect(() => {
    filterOrders();
  }, [activeTab, orders]);

  const filterOrders = () => {
    let filtered: Order[] = [];
    
    switch (activeTab) {
      case 'pending': // Chờ xác nhận
        filtered = orders.filter(order => order.maTrangThaiDonHang === 'CHO_XAC_NHAN');
        break;
      case 'active': // Đang phục vụ / Chờ thanh toán
        filtered = orders.filter(order => 
          order.maTrangThaiDonHang === 'DA_XAC_NHAN' || 
          order.maTrangThaiDonHang === 'CHO_THANH_TOAN'
        );
        break;
      case 'completed': // Hoàn thành
        filtered = orders.filter(order => order.maTrangThaiDonHang === 'DA_HOAN_THANH');
        break;
      case 'cancelled': // Đã hủy
        filtered = orders.filter(order => order.maTrangThaiDonHang === 'DA_HUY');
        break;
      default: // Tất cả
        filtered = orders;
        break;
    }
    
    setFilteredOrders(filtered);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Nếu ông chưa chuyển API lấy list, cứ dùng tạm cái cũ
      const data = await ordersApi.getOrders();
      setOrders(data);
    } catch (error: any) {
      console.error('Lỗi tải đơn hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await ordersApi.getOrderStats();
      setStats(data);
    } catch (error) {
      console.error(error);
    }
  };

  // --- [SỬA QUAN TRỌNG: GỌI ĐÚNG API CHI TIẾT] ---
  const fetchOrderDetails = async (orderId: string) => {
    setDetailLoading(true);
    try {
      // Gọi service đúng endpoint GetMyBookingDetail
      const data = await donHangService.getMyBookingDetail({ maDonHang: orderId });
      
      // Backend trả về object có thuộc tính MonAns, ta set vào state
      if (data && data.monAns) {
        setOrderDetails(data.monAns);
      } else {
        setOrderDetails([]);
      }
    } catch (error: any) {
      console.error('Lỗi khi tải chi tiết đơn hàng:', error);
      alert('Không thể tải chi tiết đơn hàng.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderDetails(order.maDonHang);
  };

  // ... (Giữ nguyên các hàm updateStatus, delete, formatCurrency, formatDate) ...
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (window.confirm('Cập nhật trạng thái đơn hàng?')) {
      try {
        await ordersApi.updateOrderStatus(orderId, newStatus);
        fetchOrders();
        fetchStats();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Xóa đơn hàng này?')) {
      try {
        await ordersApi.deleteOrder(orderId);
        fetchOrders();
        fetchStats();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DA_HOAN_THANH': return 'bg-green-100 text-green-800';
      case 'DA_HUY': return 'bg-red-100 text-red-800';
      case 'CHO_XAC_NHAN': return 'bg-yellow-100 text-yellow-800';
      case 'DA_XAC_NHAN': return 'bg-blue-100 text-blue-800';
      case 'CHO_THANH_TOAN': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Tính toán số liệu cho từng tab
  const getTabStats = () => {
    return {
      pending: orders.filter(o => o.maTrangThaiDonHang === 'CHO_XAC_NHAN').length,
      active: orders.filter(o => o.maTrangThaiDonHang === 'DA_XAC_NHAN' || o.maTrangThaiDonHang === 'CHO_THANH_TOAN').length,
      completed: orders.filter(o => o.maTrangThaiDonHang === 'DA_HOAN_THANH').length,
      cancelled: orders.filter(o => o.maTrangThaiDonHang === 'DA_HUY').length,
      all: orders.length
    };
  };

  const tabStats = getTabStats();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
      </div>

      {/* --- CẬP NHẬT GIAO DIỆN TABS MỚI --- */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
        >
          Tất cả <span className="bg-white text-black px-2 rounded-full text-xs">{tabStats.all}</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === 'pending' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-800'}`}
        >
          Chờ xác nhận <span className="bg-white text-yellow-800 px-2 rounded-full text-xs">{tabStats.pending}</span>
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === 'active' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
        >
          Đang phục vụ <span className="bg-white text-blue-800 px-2 rounded-full text-xs">{tabStats.active}</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === 'completed' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
        >
          {/* ĐÃ SỬA Ở ĐÂY */}
          Hoàn thành <span className="bg-white text-green-800 px-2 rounded-full text-xs">{tabStats.completed}</span>
        </button>

        <button
          onClick={() => setActiveTab('cancelled')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === 'cancelled' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}
        >
          {/* ĐÃ SỬA Ở ĐÂY */}
          Đã hủy <span className="bg-white text-red-800 px-2 rounded-full text-xs">{tabStats.cancelled}</span>
        </button>
      </div>

      {/* Danh sách đơn hàng */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Đang tải...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có đơn hàng nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Mã đơn</th>
                  <th className="px-4 py-3 text-left">Khách hàng</th>
                  <th className="px-4 py-3 text-left">Bàn</th>
                  <th className="px-4 py-3 text-left">Ngày đặt</th>
                  <th className="px-4 py-3 text-left">Tổng tiền</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.maDonHang} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{order.maDonHang}</td>
                    <td className="px-4 py-3">
                      <div>{order.hoTenKhachHang}</div>
                      <div className="text-xs text-gray-500">{order.soDienThoaiKhach}</div>
                    </td>
                    <td className="px-4 py-3">{order.danhSachBan || '-'}</td>
                    <td className="px-4 py-3">{formatDate(order.thoiGianDatHang)}</td>
                    <td className="px-4 py-3 font-bold text-green-600">{formatCurrency(order.tongTien)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.maTrangThaiDonHang)}`}>
                        {order.tenTrangThai}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleViewDetails(order)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 mr-2">
                        Chi tiết
                      </button>
                      {/* Logic nút bấm nhanh */}
                      {order.maTrangThaiDonHang === 'CHO_XAC_NHAN' && (
                        <button onClick={() => handleUpdateStatus(order.maDonHang, 'DA_XAC_NHAN')} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                          Xác nhận
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL CHI TIẾT ĐÃ SỬA --- */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Chi tiết đơn: {selectedOrder.maDonHang}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-2xl">✕</button>
            </div>

            {/* Thông tin đơn hàng (Giữ nguyên) */}
            <div className="grid grid-cols-2 gap-4 mb-6">
               <div>
                 <h3 className="font-bold">Khách hàng</h3>
                 <p>{selectedOrder.hoTenKhachHang} - {selectedOrder.soDienThoaiKhach}</p>
               </div>
               <div>
                 <h3 className="font-bold">Trạng thái</h3>
                 <span className={`px-2 py-1 rounded text-sm ${getStatusColor(selectedOrder.maTrangThaiDonHang)}`}>
                   {selectedOrder.tenTrangThai}
                 </span>
               </div>
            </div>

            <h3 className="font-bold mb-2">Danh sách món ăn</h3>
            {detailLoading ? (
              <div className="text-center p-4">Đang tải chi tiết...</div>
            ) : orderDetails.length === 0 ? (
              <div className="text-center text-gray-500">Không có món ăn nào.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2">Tên món</th>
                    <th className="p-2">Kích thước</th>
                    <th className="p-2">Bàn</th>
                    <th className="p-2">SL</th>
                    <th className="p-2">Đơn giá</th>
                    <th className="p-2">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Map đúng với DTO trả về từ API: tenMon, tenPhienBan, tenBan, soLuong, donGia */}
                  {orderDetails.map((item: any, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">{item.tenMon || item.tenMonAn}</td>
                      <td className="p-2">{item.tenPhienBan}</td>
                      <td className="p-2 text-gray-600">{item.tenBan}</td>
                      <td className="p-2">{item.soLuong}</td>
                      <td className="p-2">{formatCurrency(item.donGia || item.gia)}</td>
                      <td className="p-2 font-bold">{formatCurrency((item.donGia || item.gia) * item.soLuong)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelectedOrder(null)} className="bg-gray-500 text-white px-4 py-2 rounded">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
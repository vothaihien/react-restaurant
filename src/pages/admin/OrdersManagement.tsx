// components/OrderManagement.tsx
import React, { useState, useEffect } from 'react';
import { ordersApi, Order, OrderStats, OrderDetail } from 'src/api/donhang';

const OrderManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
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
      case 'completed':
        filtered = orders.filter(order => order.maTrangThaiDonHang === 'DA_HOAN_THANH');
        break;
      case 'cancelled':
        filtered = orders.filter(order => order.maTrangThaiDonHang === 'DA_HUY');
        break;
      default:
        filtered = orders;
        break;
    }
    
    setFilteredOrders(filtered);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersApi.getOrders();
      console.log('Dữ liệu đơn hàng:', data);
      setOrders(data);
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách đơn hàng:', error);
      const errorMessage = error?.message || 'Lỗi khi tải danh sách đơn hàng';
      alert(`Lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await ordersApi.getOrderStats();
      console.log('Dữ liệu thống kê:', data);
      setStats(data);
    } catch (error: any) {
      console.error('Lỗi khi tải thống kê:', error);
      const errorMessage = error?.message || 'Lỗi khi tải thống kê';
      alert(`Lỗi thống kê: ${errorMessage}`);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    setDetailLoading(true);
    try {
      const details = await ordersApi.getOrderDetail(orderId);
      setOrderDetails(details);
    } catch (error: any) {
      console.error('Lỗi khi tải chi tiết đơn hàng:', error);
      alert('Lỗi khi tải chi tiết đơn hàng');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderDetails(order.maDonHang);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (window.confirm('Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng?')) {
      try {
        await ordersApi.updateOrderStatus(orderId, newStatus);
        alert('Cập nhật trạng thái thành công!');
        fetchOrders();
        fetchStats();
      } catch (error: any) {
        alert(error.message || 'Có lỗi xảy ra');
      }
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
      try {
        await ordersApi.deleteOrder(orderId);
        alert('Xóa đơn hàng thành công!');
        fetchOrders();
        fetchStats();
      } catch (error: any) {
        alert(error.message || 'Có lỗi xảy ra khi xóa đơn hàng');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
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
    const completedOrders = orders.filter(order => order.maTrangThaiDonHang === 'DA_HOAN_THANH');
    const cancelledOrders = orders.filter(order => order.maTrangThaiDonHang === 'DA_HUY');
    
    const completedCount = completedOrders.length;
    const cancelledCount = cancelledOrders.length;
    const completedRevenue = completedOrders.reduce((sum, order) => sum + order.tongTien, 0);

    return { completedCount, cancelledCount, completedRevenue };
  };

  const tabStats = getTabStats();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        <div className="text-sm text-gray-500">
          Tổng số đơn: {orders.length} | 
          Đơn hoàn thành: {tabStats.completedCount} | 
          Đơn đã hủy: {tabStats.cancelledCount}
        </div>
      </div>

      {/* Thống kê tổng quan */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-700">Tổng số đơn</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.tongSoDon}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-700">Doanh thu hôm nay</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.tongDoanhThu)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-700">Đơn hoàn thành</h3>
            <p className="text-2xl font-bold text-green-600">{stats.donHoanThanh}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <h3 className="text-lg font-semibold text-gray-700">Đơn đã hủy</h3>
            <p className="text-2xl font-bold text-red-600">{stats.donDaHuy}</p>
          </div>
        </div>
      )}

      {/* Tabs với số lượng */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
            activeTab === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <span>Tất cả đơn</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            {orders.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
            activeTab === 'completed'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <span>Đơn hoàn thành</span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
            {tabStats.completedCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
            activeTab === 'cancelled'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <span>Đơn đã hủy</span>
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
            {tabStats.cancelledCount}
          </span>
        </button>
      </div>

      {/* Thông tin tab hiện tại */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        {activeTab === 'completed' && (
          <div className="flex justify-between items-center">
            <span className="font-semibold">Đang hiển thị {filteredOrders.length} đơn hoàn thành</span>
            <span className="text-green-600 font-bold">
              Tổng doanh thu: {formatCurrency(tabStats.completedRevenue)}
            </span>
          </div>
        )}
        {activeTab === 'cancelled' && (
          <div className="flex justify-between items-center">
            <span className="font-semibold">Đang hiển thị {filteredOrders.length} đơn đã hủy</span>
            <span className="text-red-600 font-semibold">
              Tổng số đơn đã hủy: {tabStats.cancelledCount}
            </span>
          </div>
        )}
        {activeTab === 'all' && (
          <div className="flex justify-between items-center">
            <span className="font-semibold">Đang hiển thị tất cả {filteredOrders.length} đơn hàng</span>
            <div className="text-sm text-gray-600">
              <span className="text-green-600">Hoàn thành: {tabStats.completedCount}</span>
              {' | '}
              <span className="text-red-600">Đã hủy: {tabStats.cancelledCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Danh sách đơn hàng */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Đang tải danh sách đơn hàng...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">
              {activeTab === 'completed' ? '✅' : activeTab === 'cancelled' ? '❌' : '📦'}
            </div>
            <p className="text-lg font-medium">
              {activeTab === 'completed' ? 'Không có đơn hàng nào đã hoàn thành' :
               activeTab === 'cancelled' ? 'Không có đơn hàng nào đã hủy' :
               'Không có đơn hàng nào'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bàn</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian đặt</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số người</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.maDonHang} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{order.maDonHang}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{order.hoTenKhachHang}</div>
                        <div className="text-sm text-gray-500">{order.soDienThoaiKhach}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order.danhSachBan || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(order.thoiGianDatHang)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order.soLuongNguoiDK}</td>
                    <td className="px-4 py-3 font-medium text-green-600">
                      {formatCurrency(order.tongTien)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.maTrangThaiDonHang)}`}>
                        {order.tenTrangThai}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                        >
                          Chi tiết
                        </button>
                        {order.maTrangThaiDonHang === 'CHO_XAC_NHAN' && (
                          <button
                            onClick={() => handleUpdateStatus(order.maDonHang, 'DA_XAC_NHAN')}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                          >
                            Xác nhận
                          </button>
                        )}
                        {order.maTrangThaiDonHang !== 'DA_HUY' && order.maTrangThaiDonHang !== 'DA_HOAN_THANH' && (
                          <button
                            onClick={() => handleUpdateStatus(order.maDonHang, 'DA_HUY')}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                          >
                            Hủy
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteOrder(order.maDonHang)}
                          className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
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

      {/* Modal chi tiết đơn hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Chi tiết đơn hàng: {selectedOrder.maDonHang}</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Thông tin chung */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Thông tin khách hàng</h3>
                <p><strong>Họ tên:</strong> {selectedOrder.hoTenKhachHang}</p>
                <p><strong>SĐT:</strong> {selectedOrder.soDienThoaiKhach}</p>
                <p><strong>Email:</strong> {selectedOrder.emailKhachHang || '-'}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Thông tin đơn hàng</h3>
                <p><strong>Bàn:</strong> {selectedOrder.danhSachBan || '-'}</p>
                <p><strong>Thời gian đặt:</strong> {formatDate(selectedOrder.thoiGianDatHang)}</p>
                <p><strong>Số người:</strong> {selectedOrder.soLuongNguoiDK}</p>
                <p><strong>Trạng thái:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-sm ${getStatusColor(selectedOrder.maTrangThaiDonHang)}`}>
                    {selectedOrder.tenTrangThai}
                  </span>
                </p>
              </div>
            </div>

            {/* Chi tiết món ăn */}
            <h3 className="font-semibold mb-4">Chi tiết món ăn</h3>
            {detailLoading ? (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600">Đang tải chi tiết...</p>
              </div>
            ) : orderDetails.length === 0 ? (
              <div className="text-center text-gray-500 p-4">
                Không có chi tiết món ăn
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Món ăn</th>
                      <th className="px-4 py-2 text-left">Phiên bản</th>
                      <th className="px-4 py-2 text-left">Số lượng</th>
                      <th className="px-4 py-2 text-left">Đơn giá</th>
                      <th className="px-4 py-2 text-left">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orderDetails.map((detail) => (
                      <tr key={detail.maChiTietDonHang}>
                        <td className="px-4 py-2">{detail.tenMonAn}</td>
                        <td className="px-4 py-2">{detail.tenPhienBan}</td>
                        <td className="px-4 py-2">{detail.soLuong}</td>
                        <td className="px-4 py-2">{formatCurrency(detail.gia)}</td>
                        <td className="px-4 py-2 font-medium">
                          {formatCurrency(detail.thanhTien)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-right font-semibold">
                        Tổng cộng:
                      </td>
                      <td className="px-4 py-2 font-bold text-green-600">
                        {formatCurrency(selectedOrder.tongTien)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
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
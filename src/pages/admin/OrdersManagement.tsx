// components/OrderManagement.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { donHangService } from '@/services/donHangService'; 
import { ordersApi, Order, OrderStats } from '@/api/donhang'; 
import { useReactToPrint } from 'react-to-print'; // Import thư viện in
import { InvoiceTemplate } from '@/components/invoice/InvoiceTemplate';


type TabType = 'all' | 'pending' | 'active' | 'completed' | 'cancelled';

interface GroupedItem {
  tenMon: string;
  tenPhienBan: string;
  donGia: number;
  soLuong: number;
  thanhTien: number;
}

interface TableGroup {
  tenBan: string;
  items: GroupedItem[];
  totalAmount: number;
}

const OrderManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rawOrderDetails, setRawOrderDetails] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- Cấu hình in ---
  const invoiceRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: selectedOrder ? `HoaDon_${selectedOrder.maDonHang}` : 'HoaDon',
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  useEffect(() => {
    let filtered: Order[] = [];
    switch (activeTab) {
      case 'pending': filtered = orders.filter(o => o.maTrangThaiDonHang === 'CHO_XAC_NHAN'); break;
      case 'active': filtered = orders.filter(o => ['DA_XAC_NHAN', 'CHO_THANH_TOAN'].includes(o.maTrangThaiDonHang)); break;
      case 'completed': filtered = orders.filter(o => o.maTrangThaiDonHang === 'DA_HOAN_THANH'); break;
      case 'cancelled': filtered = orders.filter(o => o.maTrangThaiDonHang === 'DA_HUY'); break;
      default: filtered = orders; break;
    }
    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [activeTab, orders]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersApi.getOrders();
      setOrders(data);
    } catch (error: any) { console.error('Lỗi tải đơn hàng:', error); } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try { setStats(await ordersApi.getOrderStats()); } catch (error) { console.error(error); }
  };

  const fetchOrderDetails = async (orderId: string) => {
    setDetailLoading(true);
    try {
      const data = await donHangService.getMyBookingDetail({ maDonHang: orderId });
      setRawOrderDetails(data?.monAns || []);
    } catch (error: any) { alert('Lỗi tải chi tiết'); } finally { setDetailLoading(false); }
  };

  // --- Gom nhóm món ăn (Fix hiển thị trùng món) ---
  const groupedDetails: TableGroup[] = useMemo(() => {
    if (!rawOrderDetails.length) return [];
    const groups: { [key: string]: TableGroup } = {};

    rawOrderDetails.forEach((item) => {
      const banKey = item.tenBan || 'Mang về';
      if (!groups[banKey]) groups[banKey] = { tenBan: banKey, items: [], totalAmount: 0 };

      const existingItem = groups[banKey].items.find(
        i => i.tenMon === (item.tenMon || item.tenMonAn) && i.tenPhienBan === item.tenPhienBan
      );
      const itemPrice = item.donGia || item.gia || 0;
      const itemTotal = itemPrice * item.soLuong;

      if (existingItem) {
        existingItem.soLuong += item.soLuong;
        existingItem.thanhTien += itemTotal;
      } else {
        groups[banKey].items.push({
          tenMon: item.tenMon || item.tenMonAn,
          tenPhienBan: item.tenPhienBan,
          donGia: itemPrice,
          soLuong: item.soLuong,
          thanhTien: itemTotal
        });
      }
      groups[banKey].totalAmount += itemTotal;
    });
    return Object.values(groups).sort((a, b) => a.tenBan.localeCompare(b.tenBan));
  }, [rawOrderDetails]);

  // --- [FIX] Tự tính tổng tiền từ chi tiết món (Không tin tưởng API list) ---
  const calculatedTotal = useMemo(() => {
    return groupedDetails.reduce((sum, group) => sum + group.totalAmount, 0);
  }, [groupedDetails]);

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderDetails(order.maDonHang);
  };

  const handleUpdateStatus = async (id: string, status: string) => { if(confirm('Cập nhật?')) { await ordersApi.updateOrderStatus(id, status); fetchOrders(); fetchStats(); }};
  const handleDeleteOrder = async (id: string) => { if(confirm('Xóa?')) { await ordersApi.deleteOrder(id); fetchOrders(); fetchStats(); }};
  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  const formatDate = (date: string) => date ? new Date(date).toLocaleString('vi-VN') : '-';
  
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

  const tabStats = {
    pending: orders.filter(o => o.maTrangThaiDonHang === 'CHO_XAC_NHAN').length,
    active: orders.filter(o => ['DA_XAC_NHAN', 'CHO_THANH_TOAN'].includes(o.maTrangThaiDonHang)).length,
    completed: orders.filter(o => o.maTrangThaiDonHang === 'DA_HOAN_THANH').length,
    cancelled: orders.filter(o => o.maTrangThaiDonHang === 'DA_HUY').length,
    all: orders.length
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold">Quản lý đơn hàng</h1></div>
      
      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {[{ id: 'all', label: 'Tất cả', count: tabStats.all, color: 'gray' },
          { id: 'pending', label: 'Chờ xác nhận', count: tabStats.pending, color: 'yellow' },
          { id: 'active', label: 'Đang phục vụ', count: tabStats.active, color: 'blue' },
          { id: 'completed', label: 'Hoàn thành', count: tabStats.completed, color: 'green' },
          { id: 'cancelled', label: 'Đã hủy', count: tabStats.cancelled, color: 'red' }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? `bg-${tab.color}-600 text-white` : `bg-${tab.color}-100 text-${tab.color}-800`}`}>
            {tab.label} <span className="bg-white bg-opacity-30 px-2 rounded-full text-xs">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Bảng danh sách */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col min-h-[500px]">
        <div className="flex-grow overflow-x-auto">
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
              {loading ? <tr><td colSpan={7} className="p-8 text-center">Đang tải...</td></tr> : 
               currentItems.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-gray-500">Không có dữ liệu</td></tr> :
               currentItems.map((order) => (
                 <tr key={order.maDonHang} className="hover:bg-gray-50">
                   <td className="px-4 py-3 font-medium">{order.maDonHang}</td>
                   <td className="px-4 py-3"><div>{order.hoTenKhachHang}</div><div className="text-xs text-gray-500">{order.soDienThoaiKhach}</div></td>
                   <td className="px-4 py-3 max-w-xs truncate" title={order.danhSachBan || ''}>{order.danhSachBan || '-'}</td>
                   <td className="px-4 py-3 text-sm">{formatDate(order.thoiGianDatHang)}</td>
                   <td className="px-4 py-3 font-bold text-green-600">{formatCurrency(order.tongTien)}</td>
                   <td className="px-4 py-3"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.maTrangThaiDonHang)}`}>{order.tenTrangThai}</span></td>
                   <td className="px-4 py-3 flex gap-2">
                     <button onClick={() => handleViewDetails(order)} className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600">Chi tiết</button>
                     {order.maTrangThaiDonHang === 'CHO_XAC_NHAN' && <button onClick={() => handleUpdateStatus(order.maDonHang, 'DA_XAC_NHAN')} className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600">Duyệt</button>}
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
        {/* Phân trang */}
        {filteredOrders.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded bg-white disabled:opacity-50">Trước</button>
            <span>Trang {currentPage} / {totalPages}</span>
            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded bg-white disabled:opacity-50">Sau</button>
          </div>
        )}
      </div>

      {/* --- MODAL CHI TIẾT --- */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="text-lg font-bold">Chi tiết đơn: {selectedOrder.maDonHang}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-3xl">&times;</button>
            </div>

            <div className="p-6 space-y-6">
               <div className="grid grid-cols-2 gap-6 text-sm">
                 <div>
                   <p className="text-gray-500">Khách hàng</p>
                   <p className="font-semibold text-gray-900 text-base">{selectedOrder.hoTenKhachHang}</p>
                   <p>{selectedOrder.soDienThoaiKhach}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-gray-500">Thời gian đặt</p>
                   <p className="font-semibold text-gray-900">{formatDate(selectedOrder.thoiGianDatHang)}</p>
                   <p>Số người: {selectedOrder.soLuongNguoiDK}</p>
                 </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                {detailLoading ? <div className="p-8 text-center">Đang tải...</div> : groupedDetails.length === 0 ? <div className="p-8 text-center text-gray-500">Trống</div> : 
                  groupedDetails.map((group, idx) => (
                    <div key={idx} className="border-b last:border-b-0">
                      <div className="bg-gray-100 px-4 py-2 flex justify-between font-bold"><span>{group.tenBan}</span><span>{formatCurrency(group.totalAmount)}</span></div>
                      {group.items.map((item, i) => (
                        <div key={i} className="px-4 py-2 flex justify-between border-t border-gray-100">
                           <span>{item.tenMon} ({item.tenPhienBan}) x {item.soLuong}</span>
                           <span>{formatCurrency(item.thanhTien)}</span>
                        </div>
                      ))}
                    </div>
                  ))
                }
              </div>

              <div className="flex justify-end text-right">
                <div className="w-1/2 space-y-2">
                  {/* Sử dụng calculatedTotal để hiển thị đúng tổng tiền */}
                  <div className="flex justify-between text-gray-600"><span>Tổng tiền hàng:</span><span>{formatCurrency(calculatedTotal)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Đã đặt cọc:</span><span>-{formatCurrency(selectedOrder.tienDatCoc || 0)}</span></div>
                  <div className="flex justify-between text-xl font-bold text-green-600 border-t pt-2">
                    <span>Cần thanh toán:</span><span>{formatCurrency(calculatedTotal - (selectedOrder.tienDatCoc || 0))}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
              <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 font-medium">Đóng lại</button>
              {/* Nút in hóa đơn */}
              {selectedOrder.maTrangThaiDonHang === 'DA_HOAN_THANH' && (
                <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  In hóa đơn
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- COMPONENT ẨN ĐỂ IN --- */}
      <div style={{ display: "none" }}>
        <InvoiceTemplate 
          ref={invoiceRef} 
          order={selectedOrder} 
          groupedItems={groupedDetails} 
          totalAmount={calculatedTotal} // Truyền tổng tiền đã tính chính xác vào
        />
      </div>
    </div>
  );
};

export default OrderManagement;
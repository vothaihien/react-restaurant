import React, { useState, useEffect, useMemo, useRef } from "react";
import { donHangService } from "@/services/donHangService";
import { ordersApi, Order, OrderStats } from "@/api/donhang";
import { orderService } from "@/services/orderService"; 
import { useReactToPrint } from "react-to-print";
import { InvoiceTemplate } from "@/components/invoice/InvoiceTemplate";
import { 
  ClipboardList, CheckCircle, Clock, XCircle, 
  Printer, Eye, CreditCard, Play, AlertCircle 
} from "lucide-react"; // Thêm icon cho sinh động

type TabType = "all" | "pending" | "active" | "completed" | "cancelled";

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
  const [activeTab, setActiveTab] = useState<TabType>("all");
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
    documentTitle: selectedOrder
      ? `HoaDon_${selectedOrder.maDonHang}`
      : "HoaDon",
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  const handlePaymentAndPrint = async (order: Order) => {
    if (!window.confirm(`Xác nhận thanh toán và in hóa đơn cho đơn ${order.maDonHang}?`)) return;

    try {
        await orderService.updateOrderStatus(order.maDonHang, "DA_HOAN_THANH");
        
        await fetchOrders(); 
        await fetchStats();

        setSelectedOrder(order);
        await fetchOrderDetails(order.maDonHang);

        setTimeout(() => {
            handlePrint();
        }, 500);

        alert("Thanh toán thành công! Đang in hóa đơn...");
    } catch (error) {
        alert("Có lỗi khi thanh toán!");
        console.error(error);
    }
  };

  useEffect(() => {
    let filtered: Order[] = [];
    switch (activeTab) {
      case "pending":
        filtered = orders.filter((o) => o.maTrangThaiDonHang === "CHO_XAC_NHAN");
        break;
      case "active":
        filtered = orders.filter((o) => ["DA_XAC_NHAN", "CHO_THANH_TOAN"].includes(o.maTrangThaiDonHang));
        break;
      case "completed":
        filtered = orders.filter((o) => o.maTrangThaiDonHang === "DA_HOAN_THANH");
        break;
      case "cancelled":
        filtered = orders.filter((o) => o.maTrangThaiDonHang === "DA_HUY");
        break;
      default:
        filtered = orders;
        break;
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
      // Gọi API lấy danh sách
      // Lưu ý: Đảm bảo ordersApi.getOrders() gọi đúng API trả về Full List
      const rawData: any[] = await ordersApi.getOrders();
      
      // MAP DỮ LIỆU ĐỂ HIỂN THỊ ĐÚNG CỘT
      const mappedData = rawData.map(item => ({
        ...item,
        // Ưu tiên tên người nhận, nếu không có thì lấy tên từ object Khách Hàng (nếu API trả về lồng nhau)
        hoTenKhachHang: item.tenNguoiNhan || item.maKhachHangNavigation?.hoTen || item.hoTenKhachHang || "Khách vãng lai",
        soDienThoaiKhach: item.sdtNguoiNhan || item.maKhachHangNavigation?.soDienThoai || item.soDienThoaiKhach || "",
        // Đảm bảo tiền cọc lấy đúng field
        tienDatCoc: item.tienDatCoc || 0 
      }));

      setOrders(mappedData);
    } catch (error: any) {
      console.error("Lỗi tải đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStats(await ordersApi.getOrderStats());
    } catch (error) {
      console.error(error);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    setDetailLoading(true);
    try {
      // Gọi API lấy chi tiết (API này trả về full thông tin: cọc, tên khách, món ăn...)
      const data = await donHangService.getMyBookingDetail({
        maDonHang: orderId,
      });

      // --- SỬA Ở ĐÂY ---
      // Cập nhật ngược lại selectedOrder với dữ liệu đầy đủ vừa lấy về
      if (data) {
        setSelectedOrder((prev) => ({
            ...prev!, // Giữ các trường cũ
            ...data,  // Ghi đè bằng dữ liệu chi tiết mới (bao gồm tienDatCoc, tenNguoiDat...)
            // Map lại tên field nếu Back-end trả về lệch tên với Front-end
            hoTenKhachHang: data.tenNguoiDat || data.tenNguoiNhan || prev?.hoTenKhachHang, 
            soDienThoaiKhach: data.sdtNguoiDat || data.sdtNguoiNhan || prev?.soDienThoaiKhach,
            tienDatCoc: data.tienDatCoc // Đảm bảo trường này được cập nhật
        }));
        
        setRawOrderDetails(data.monAns || []);
      }
    } catch (error: any) {
      alert("Lỗi tải chi tiết đơn hàng");
      console.error(error);
    } finally {
      setDetailLoading(false);
    }
  };

  // --- Gom nhóm món ăn ---
  const groupedDetails: TableGroup[] = useMemo(() => {
    if (!rawOrderDetails.length) return [];
    const groups: { [key: string]: TableGroup } = {};

    rawOrderDetails.forEach((item) => {
      const banKey = item.tenBan || "Mang về";
      if (!groups[banKey])
        groups[banKey] = { tenBan: banKey, items: [], totalAmount: 0 };

      const existingItem = groups[banKey].items.find(
        (i) =>
          i.tenMon === (item.tenMon || item.tenMonAn) &&
          i.tenPhienBan === item.tenPhienBan
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
          thanhTien: itemTotal,
        });
      }
      groups[banKey].totalAmount += itemTotal;
    });
    return Object.values(groups).sort((a, b) =>
      a.tenBan.localeCompare(b.tenBan)
    );
  }, [rawOrderDetails]);

  const calculatedTotal = useMemo(() => {
    return groupedDetails.reduce((sum, group) => sum + group.totalAmount, 0);
  }, [groupedDetails]);

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderDetails(order.maDonHang);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    let message = "Bạn có chắc chắn muốn cập nhật trạng thái?";
    if (status === "DA_XAC_NHAN") message = "Duyệt đơn này? (Hệ thống sẽ gửi mail cho khách)";
    if (status === "CHO_THANH_TOAN") message = "Xác nhận khách đã đến và bắt đầu phục vụ (Vào bàn)?";
    if (status === "DA_HUY") message = "CẢNH BÁO: Bạn có chắc chắn muốn HỦY đơn hàng này không?";

    if (window.confirm(message)) {
      try {
        await orderService.updateOrderStatus(id, status);
        if (selectedOrder?.maDonHang === id) {
          setSelectedOrder(null);
        }
        await fetchOrders();
        await fetchStats();
      } catch (error) {
        alert("Có lỗi xảy ra khi cập nhật trạng thái!");
        console.error(error);
      }
    }
  };

  const renderActionButtons = (order: Order, size: "small" | "large" = "small") => {
    const btnClass = size === "small" ? "p-1.5 rounded-lg" : "px-4 py-2 rounded-lg font-medium flex items-center gap-2";
    const iconSize = size === "small" ? "w-4 h-4" : "w-5 h-5";

    return (
      <div className="flex gap-2">
        {/* DUYỆT */}
        {order.maTrangThaiDonHang === "CHO_XAC_NHAN" && (
          <>
            <button
              onClick={() => handleUpdateStatus(order.maDonHang, "DA_XAC_NHAN")}
              className={`${btnClass} bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50`}
              title="Duyệt đơn"
            >
              {size === "small" ? <CheckCircle className={iconSize} /> : <> <CheckCircle className={iconSize} /> Duyệt đơn </>}
            </button>
            <button
              onClick={() => handleUpdateStatus(order.maDonHang, "DA_HUY")}
              className={`${btnClass} bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50`}
              title="Hủy đơn"
            >
              {size === "small" ? <XCircle className={iconSize} /> : <> <XCircle className={iconSize} /> Hủy đơn </>}
            </button>
          </>
        )}

        {/* VÀO BÀN */}
        {["DA_XAC_NHAN"].includes(order.maTrangThaiDonHang) && (
          <>
            <button
              onClick={() => handleUpdateStatus(order.maDonHang, "CHO_THANH_TOAN")}
              className={`${btnClass} bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50`}
              title="Khách vào bàn"
            >
               {size === "small" ? <Play className={iconSize} /> : <> <Play className={iconSize} /> Vào bàn </>}
            </button>
            <button
              onClick={() => handleUpdateStatus(order.maDonHang, "DA_HUY")}
              className={`${btnClass} bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50`}
              title="Hủy đơn"
            >
               {size === "small" ? <XCircle className={iconSize} /> : <> <XCircle className={iconSize} /> Hủy </>}
            </button>
          </>
        )}

        {/* HỦY KHI ĐANG PHỤC VỤ */}
        {["CHO_THANH_TOAN"].includes(order.maTrangThaiDonHang) && (
          <button
            onClick={() => handleUpdateStatus(order.maDonHang, "DA_HUY")}
            className={`${btnClass} bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600`}
            title="Hủy đơn đang phục vụ"
          >
             {size === "small" ? <XCircle className={iconSize} /> : <> <XCircle className={iconSize} /> Hủy </>}
          </button>
        )}
      </div>
    );
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  
  const formatDate = (date: string) =>
    date ? new Date(date).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : "-";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DA_HOAN_THANH": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
      case "DA_HUY": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
      case "CHO_XAC_NHAN": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
      case "DA_XAC_NHAN": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "CHO_THANH_TOAN": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700";
    }
  };

  const tabStats = {
    pending: orders.filter((o) => o.maTrangThaiDonHang === "CHO_XAC_NHAN").length,
    active: orders.filter((o) => ["DA_XAC_NHAN", "CHO_THANH_TOAN"].includes(o.maTrangThaiDonHang)).length,
    completed: orders.filter((o) => o.maTrangThaiDonHang === "DA_HOAN_THANH").length,
    cancelled: orders.filter((o) => o.maTrangThaiDonHang === "DA_HUY").length,
    all: orders.length,
  };

  // Hàm render Tab Button để tái sử dụng
  const TabButton = ({ id, label, count, colorClass, activeColorClass }: any) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`
            px-4 py-2 rounded-xl font-medium whitespace-nowrap flex items-center gap-2 transition-all border
            ${activeTab === id 
                ? `${activeColorClass} shadow-md` 
                : `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700`
            }
        `}
    >
        {label}
        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${activeTab === id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
            {count}
        </span>
    </button>
  );

  return (
    // CONTAINER CHÍNH: Hỗ trợ Dark Mode
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-8 h-8 text-indigo-600" />
                Quản lý Đơn hàng
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Theo dõi và xử lý đơn đặt bàn, mang về</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar">
        <TabButton 
            id="all" label="Tất cả" count={tabStats.all} 
            activeColorClass="bg-gray-800 text-white border-gray-800 dark:bg-gray-700 dark:border-gray-600" 
        />
        <TabButton 
            id="pending" label="Chờ xác nhận" count={tabStats.pending} 
            activeColorClass="bg-yellow-500 text-white border-yellow-500" 
        />
        <TabButton 
            id="active" label="Đang phục vụ" count={tabStats.active} 
            activeColorClass="bg-blue-600 text-white border-blue-600" 
        />
        <TabButton 
            id="completed" label="Hoàn thành" count={tabStats.completed} 
            activeColorClass="bg-green-600 text-white border-green-600" 
        />
        <TabButton 
            id="cancelled" label="Đã hủy" count={tabStats.cancelled} 
            activeColorClass="bg-red-500 text-white border-red-500" 
        />
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase font-semibold text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Mã đơn</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Ngày nhận bàn</th>
                <th className="px-6 py-4">Ngày đặt</th>
                <th className="px-6 py-4">Tổng tiền</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center">Đang tải dữ liệu...</td></tr>
              ) : currentItems.length > 0 ? (
                  currentItems.map((order) => (
                    <tr key={order.maDonHang} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                        <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            #{order.maDonHang.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4">
                            <div className="font-bold text-gray-900 dark:text-white">{order.hoTenKhachHang}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{order.soDienThoaiKhach}</div>
                        </td>
                        <td className="px-6 py-4 text-blue-600 dark:text-blue-400 font-medium">
                            {formatDate(order.tgNhanBan)}
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                            {formatDate(order.thoiGianDatHang)}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                            {formatCurrency(order.tongTien)}
                        </td>
                        <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.maTrangThaiDonHang)}`}>
                                {order.tenTrangThai}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => handleViewDetails(order)}
                                    className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Xem chi tiết"
                                >
                                    <Eye className="w-5 h-5" />
                                </button>

                                {/* Nút thanh toán nhanh */}
                                {order.maTrangThaiDonHang === "CHO_THANH_TOAN" && (
                                    <button
                                        onClick={() => handlePaymentAndPrint(order)}
                                        className="p-2 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                                        title="Thanh toán ngay"
                                    >
                                        <CreditCard className="w-5 h-5" />
                                    </button>
                                )}

                                {renderActionButtons(order, "small")}
                            </div>
                        </td>
                    </tr>
                  ))
              ) : (
                  <tr><td colSpan={7} className="p-12 text-center text-gray-500 dark:text-gray-400">Không có đơn hàng nào</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG */}
        {filteredOrders.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
                Trang {currentPage} / {totalPages}
            </span>
            <div className="flex gap-2">
                <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-300"
                >
                    Trước
                </button>
                <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-300"
                >
                    Sau
                </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL CHI TIẾT (DARK MODE) --- */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 sticky top-0 backdrop-blur-md">
              <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Chi tiết đơn hàng
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono text-lg">#{selectedOrder.maDonHang.substring(0,8)}</span>
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Xem thông tin và xử lý đơn</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <XCircle className="w-8 h-8" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-gray-800 dark:text-gray-200">
              {/* Thông tin khách */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Khách hàng</p>
                  <p className="font-bold text-lg">{selectedOrder.hoTenKhachHang}</p>
                  <p className="text-sm flex items-center gap-1"><span className="text-gray-400">📞</span> {selectedOrder.soDienThoaiKhach}</p>
                </div>
                <div className="space-y-1 text-left md:text-right">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Thông tin đặt</p>
                  <p className="font-bold">{formatDate(selectedOrder.thoiGianDatHang)}</p>
                  <p className="text-sm">Số lượng: <span className="font-bold">{selectedOrder.soLuongNguoiDK} người</span></p>
                  {/* <div className="mt-2 flex md:justify-end"><p className="font-bold text-lg">
                        {(selectedOrder as any).tenNguoiDat || selectedOrder.tenNguoiNhan || selectedOrder.hoTenKhachHang || "Khách vãng lai"}
                    </p>
                    <p className="text-sm flex items-center gap-1">
                        <span className="text-gray-400">📞</span> 
                        {(selectedOrder as any).sdtNguoiDat || selectedOrder.sdtNguoiNhan || selectedOrder.soDienThoaiKhach || "Không có SĐT"}
                    </p>
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(selectedOrder.maTrangThaiDonHang)}`}>
                        {selectedOrder.tenTrangThai}
                    </span>
                  </div> */}
                </div>
              </div>

              {/* Danh sách món */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 font-bold text-sm text-gray-600 dark:text-gray-300">Danh sách món ăn</div>
                {detailLoading ? (
                  <div className="p-8 text-center text-gray-500">Đang tải chi tiết...</div>
                ) : groupedDetails.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Không có món ăn nào</div>
                ) : (
                  groupedDetails.map((group, idx) => (
                    <div key={idx} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 flex justify-between font-bold text-sm text-indigo-600 dark:text-indigo-400">
                        <span>{group.tenBan}</span>
                        <span>{formatCurrency(group.totalAmount)}</span>
                      </div>
                      {group.items.map((item, i) => (
                        <div key={i} className="px-4 py-3 flex justify-between text-sm hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                          <div>
                            <span className="font-medium">{item.tenMon}</span>
                            <span className="text-gray-500 dark:text-gray-400 ml-2 text-xs">({item.tenPhienBan})</span>
                            <span className="text-gray-400 dark:text-gray-500 ml-2">x{item.soLuong}</span>
                          </div>
                          <span className="font-mono">{formatCurrency(item.thanhTien)}</span>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>

              {/* Tổng tiền */}
              <div className="flex flex-col items-end space-y-2 pt-2">
                <div className="w-full md:w-1/2 space-y-2">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Tổng tiền hàng:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(calculatedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Đã đặt cọc:</span>
                    <span className="text-red-500">-{formatCurrency((selectedOrder as any).tienDatCoc || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-indigo-600 dark:text-indigo-400 border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
                    <span>Cần thanh toán:</span>
                    <span>{formatCurrency(calculatedTotal - (selectedOrder.tienDatCoc || 0))}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>{renderActionButtons(selectedOrder, "large")}</div>

              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                    onClick={() => setSelectedOrder(null)} 
                    className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition w-full sm:w-auto"
                >
                  Đóng
                </button>

                {/* Nút thanh toán */}
                {selectedOrder.maTrangThaiDonHang === "CHO_THANH_TOAN" && (
                      <button
                        onClick={() => handlePaymentAndPrint(selectedOrder)}
                        className="px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-lg shadow-purple-200 dark:shadow-none w-full sm:w-auto"
                      >
                        <CreditCard className="w-5 h-5" />
                        Thanh toán & In
                      </button>
                )}
                
                {/* In lại */}
                {selectedOrder.maTrangThaiDonHang === "DA_HOAN_THANH" && (
                      <button onClick={handlePrint} className="px-5 py-2.5 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2 w-full sm:w-auto">
                        <Printer className="w-5 h-5" />
                        In lại hóa đơn
                      </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPONENT ẨN ĐỂ IN */}
      <div style={{ display: "none" }}>
        <InvoiceTemplate
          ref={invoiceRef}
          order={selectedOrder}
          groupedItems={groupedDetails}
          totalAmount={calculatedTotal}
        />
      </div>
    </div>
  );
};

export default OrderManagement;
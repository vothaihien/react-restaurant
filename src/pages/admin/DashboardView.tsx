import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "@/contexts/AppContext";
import TableCard from "@/components/tables/TableCard";
import OrderModal from "@/components/orders/OrderModal";
import PaymentModal from "@/components/orders/PaymentModal";
import OrderDetailModal from "@/components/orders/OrderDetailModal";

// *** CÁC IMPORT NÂNG CẤP (MUI, Service...) ***
import { tableService, Tang } from "@/services/tableService";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  CheckCircle,
  AccessTime,
  CalendarMonth,
  HelpOutline,
} from "@mui/icons-material";
import { orderService } from "@/services/orderService";
import { Table, TableStatus } from "@/types";
import { FALLBACK_TILE_IMAGE } from "@/utils/placeholders";

// ==========================================================
// === COMPONENT CHÚ THÍCH (STATUS LEGEND) ===
// ==========================================================
const StatusLegend: React.FC = () => (
  <Box
    sx={{
      display: "flex",
      gap: 2,
      flexWrap: "wrap",
      mb: 2,
      p: 2,
      bgcolor: "grey.100",
      borderRadius: 1,
    }}
  >
    <Chip
      icon={<CheckCircle />}
      label="Trống"
      color="success"
      variant="outlined"
    />
    <Chip
      icon={<AccessTime />}
      label="Đang phục vụ"
      color="error"
      variant="outlined"
    />
    <Chip
      icon={<CalendarMonth />}
      label="Đã đặt"
      color="warning"
      variant="outlined"
    />
    <Chip
      icon={<HelpOutline />}
      label="Bảo trì"
      color="default"
      variant="outlined"
    />
  </Box>
);

// ==========================================================
// === COMPONENT CHÍNH: DASHBOARD VIEW ===
// ==========================================================
const DashboardView: React.FC = () => {
  // 1. Lấy dữ liệu từ Context (ĐÃ SỬA LỖI 1: Thêm setOrders vào đây)
  const { menuItems, categories, getOrderForTable, orders, setOrders } =
    useAppContext();

  // 2. Các State quản lý UI
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // State Modal
  const [isOrderModalOpen, setOrderModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

  // State Dữ liệu Bàn & Tầng
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<Table[]>([]);
  const [tangs, setTangs] = useState<Tang[]>([]);
  const [selectedTang, setSelectedTang] = useState<string>("ALL");
  const [selectedDateTime, setSelectedDateTime] = useState<Dayjs | null>(
    dayjs()
  );

  // -----------------------------------------------------------
  // 3. CÁC EFFECT (Tải dữ liệu)
  // -----------------------------------------------------------

  // Fetch danh sách Tầng
  useEffect(() => {
    const fetchTangs = async () => {
      try {
        const tangsData = await tableService.getTangs();
        setTangs(tangsData);
      } catch (error) {
        console.error("Lỗi tải danh sách tầng:", error);
      }
    };
    fetchTangs();
  }, []);

  // Fetch danh sách Bàn theo thời gian
  useEffect(() => {
    if (!selectedDateTime) {
      setTables([]);
      return;
    }

    const fetchTables = async () => {
      setLoading(true);
      try {
        // Gọi API lấy trạng thái bàn
        const banAnData = await tableService.getDashboardTableStatus(
          selectedDateTime.toISOString()
        );

        // Map dữ liệu từ API sang định dạng Table của Frontend
        const mappedTables: Table[] = banAnData.map((banAn: any) => ({
          id: banAn.maBan,
          name: banAn.tenBan,
          capacity: banAn.sucChua,
          status: banAn.tenTrangThai,
          maTang: banAn.maTang,
          orderId: null,
        }));

        setTables(mappedTables);
      } catch (error) {
        console.error("Lỗi tải sơ đồ bàn:", error);
        setTables([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, [selectedDateTime]);

  // [ĐÃ SỬA LỖI 2] Đồng bộ Order ID từ Context vào Dashboard
  useEffect(() => {
    if (tables.length > 0 && orders.length > 0) {
      setTables((prevTables) =>
        prevTables.map((table) => {
          const matchedOrder = orders.find((o) => o.tableId === table.id);
          if (matchedOrder) {
            return {
              ...table,
              orderId: matchedOrder.id,
              status: TableStatus.Occupied,
            };
          }
          return table;
        })
      );
    }
  }, [orders, tables.length]);

  // Logic lọc Bàn theo Tầng
  const filteredTables = useMemo(() => {
    if (selectedTang === "ALL") {
      return tables;
    }
    return tables.filter((table: any) => table.maTang === selectedTang);
  }, [tables, selectedTang]);

  // Logic lọc Món ăn theo Danh mục
  const displayedDishes = useMemo(() => {
    if (selectedCategory === "ALL") {
      return menuItems;
    }
    return menuItems.filter((item) => item.categoryId === selectedCategory);
  }, [selectedCategory, menuItems]);

  useEffect(() => {
    if (tables.length > 0 && orders.length > 0) {
      setTables((prevTables) =>
        prevTables.map((table) => {
          // Tìm đơn hàng mà bàn này CÓ THAM GIA
          const matchedOrder = orders.find((o) => {
            // Kiểm tra xem bàn này có phải bàn chính (tableId) của đơn hàng không
            if (o.tableId === table.id) return true;
            return false;
          });

          if (matchedOrder) {
            return {
              ...table,
              orderId: matchedOrder.id,
              status: TableStatus.Occupied,
            };
          }

          return String(table.status).toLowerCase().includes("trống")
            ? { ...table, orderId: null }
            : table;
        })
      );
    }
  }, [orders, tables.length]);

  // Lấy đơn hàng hiện tại của bàn đang chọn
  const currentOrder = selectedTable
    ? getOrderForTable(selectedTable.id)
    : undefined;

  // -----------------------------------------------------------
  // CÁC HÀM XỬ LÝ SỰ KIỆN
  // -----------------------------------------------------------
  const handleTableClick = (table: Table) => {
    setSelectedTable(table);

    // Chuẩn hóa chuỗi trạng thái để so sánh
    const statusStr = String(table.status || "")
      .trim()
      .toLowerCase();
    const isOccupied =
      statusStr === "occupied" ||
      statusStr === "đang phục vụ" ||
      statusStr === "dang phuc vu";

    if (isOccupied) {
      setOrderModalOpen(true);
    } else {
      setOrderModalOpen(true);
    }
  };

  const handleOpenPayment = () => {
    setOrderModalOpen(false);
    setPaymentModalOpen(true);
  };

  const closeAllModals = () => {
    setSelectedTable(null);
    setOrderModalOpen(false);
    setPaymentModalOpen(false);
  };

  // -----------------------------------------------------------
  // 4. THÊM FETCH ACTIVE ORDERS RIÊNG CHO DASHBOARD (ĐỂ CHẮC CHẮN)
  // -----------------------------------------------------------
  // useEffect(() => {
  //     const fetchActiveOrders = async () => {
  //         try {
  //             const activeOrders = await orderService.getActiveOrders();

  //             // Bây giờ đã có setOrders, dòng này sẽ hết lỗi đỏ
  //             if (setOrders) {
  //                 setOrders(activeOrders);
  //                 // console.log("Đã đồng bộ đơn hàng vào Context:", activeOrders);
  //             }
  //         } catch (error) {
  //             console.error("Lỗi tải danh sách đơn hàng:", error);
  //         }
  //     };
  //     fetchActiveOrders();
  // }, [setOrders]); // Thêm dependency cho chuẩn React

  // -----------------------------------------------------------
  // 5. GIAO DIỆN (RENDER)
  // -----------------------------------------------------------
  return (
    <div className="p-4 bg-gray-50 min-h-screen flex flex-col gap-6">
      {/* === KHỐI 1: BỘ LỌC BÀN & CHÚ THÍCH === */}
      <div>
        <Box
          sx={{
            p: 2,
            mb: 2,
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            backgroundColor: "white",
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Lọc theo tầng</InputLabel>
            <Select
              value={selectedTang}
              label="Lọc theo tầng"
              onChange={(e) => setSelectedTang(e.target.value)}
            >
              <MenuItem value="ALL">Tất cả các tầng</MenuItem>
              {tangs.map((tang) => (
                <MenuItem key={tang.maTang} value={tang.maTang}>
                  {tang.tenTang}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label="Xem trạng thái lúc"
              value={selectedDateTime}
              onChange={(newValue) => setSelectedDateTime(newValue)}
              slots={{ textField: TextField }}
              slotProps={{
                textField: { size: "small", sx: { minWidth: 250 } },
              }}
              enableAccessibleFieldDOMStructure={false}
            />
          </LocalizationProvider>
        </Box>

        <StatusLegend />
      </div>

      {/* === KHỐI 2: SƠ ĐỒ BÀN === */}
      <div>
        <h2 className="text-xl font-bold mb-3 text-gray-800">Sơ đồ bàn</h2>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={() => handleTableClick(table)}
              />
            ))}
          </div>
        )}
      </div>

      <hr className="border-gray-300" />

      {/* === KHỐI 3: THỰC ĐƠN MÓN ĂN (MENU) === */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Thực đơn món ăn
        </h2>

        {/* A. Danh sách nút Danh mục */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-5 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
              selectedCategory === "ALL"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-green-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* B. Lưới hiển thị Món ăn */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {displayedDishes.map((dish) => (
            <div
              key={dish.id}
              className="bg-white border rounded-xl p-3 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col h-full"
            >
              <div className="relative w-full h-32 mb-3 overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={dish.imageUrls[0] || FALLBACK_TILE_IMAGE}
                  alt={dish.name}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_TILE_IMAGE;
                  }}
                />
              </div>
              <h3 className="font-bold text-gray-800 text-sm line-clamp-2 mb-1 flex-grow">
                {dish.name}
              </h3>
              <div className="flex justify-between items-center mt-auto">
                <p className="text-green-600 font-bold text-sm">
                  {dish.sizes[0]?.price.toLocaleString("vi-VN")} đ
                </p>
                <button className="bg-green-50 text-green-700 p-1 rounded-md hover:bg-green-100">
                  +
                </button>
              </div>
            </div>
          ))}

          {displayedDishes.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 border border-dashed rounded-lg">
              Không tìm thấy món ăn nào trong danh mục này.
            </div>
          )}
        </div>
      </div>

      {/* === KHỐI 4: CÁC MODAL === */}
      {selectedTable && isOrderModalOpen && (
        <OrderModal
          table={selectedTable}
          order={currentOrder}
          onClose={closeAllModals}
          onOpenPayment={handleOpenPayment}
        />
      )}

      {selectedTable && isPaymentModalOpen && currentOrder && (
        <PaymentModal order={currentOrder} onClose={closeAllModals} />
      )}
    </div>
  );
};

export default DashboardView;





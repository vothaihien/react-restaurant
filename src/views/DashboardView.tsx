import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/core/context/AppContext';
import TableCard from '@/components/TableCard';
import OrderModal from '@/components/OrderModal';
import PaymentModal from '@/components/PaymentModal';
import type { Table, Order } from '@/core/types';
import { TableStatus } from '@/features/tables/domain/types';

// *** BẮT ĐẦU PHẦN NÂNG CẤP ***
import { tableService, Tang } from '@/services/tableService'; // Import service
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers"; // Import component
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
    Chip // Thêm Chip
} from '@mui/material';
// Thêm Icons cho Chú Thích
import {
  CheckCircle,
  AccessTime,
  CalendarMonth,
  HelpOutline,
} from "@mui/icons-material";
// *** KẾT THÚC PHẦN NÂNG CẤP ***


// ==========================================================
// === COMPONENT CHÚ THÍCH (THÊM LẠI THEO Ý BẠN) ===
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
// === COMPONENT CHÍNH (ĐÃ SỬA LỖI) ===
// ==========================================================
const DashboardView: React.FC = () => {
    // Bỏ `tables` từ context, vì ta sẽ tự fetch
    const { getOrderForTable } = useAppContext(); 
    
    // State cho Modal (giữ nguyên)
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [isOrderModalOpen, setOrderModalOpen] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

    // *** BẮT ĐẦU STATE MỚI CHO NÂNG CẤP ***
    const [loading, setLoading] = useState(true);
    const [tables, setTables] = useState<Table[]>([]); // State này giờ do component tự quản lý
    const [tangs, setTangs] = useState<Tang[]>([]);
    const [selectedTang, setSelectedTang] = useState<string>("ALL");
    const [selectedDateTime, setSelectedDateTime] = useState<Dayjs | null>(dayjs()); // Mặc định là 'bây giờ'
    // *** KẾT THÚC STATE MỚI ***

    // === HÀM MỚI: Fetch tầng (để lọc) ===
    useEffect(() => {
        const fetchTangs = async () => {
            try {
                // Giả sử service của bạn có hàm này (lấy từ file ReservationsView cũ)
                const tangsData = await tableService.getTangs(); 
                setTangs(tangsData);
            } catch (error) {
                console.error("Lỗi tải danh sách tầng:", error);
            }
        };
        fetchTangs();
    }, []);

    // === HÀM MỚI: Fetch Bàn theo thời gian (ĐÂY LÀ CHỖ GỌI API) ===
    useEffect(() => {
        if (!selectedDateTime) {
            setTables([]);
            return;
        }

        const fetchTables = async () => {
            setLoading(true);
            try {
                // 1. GỌI API: Dữ liệu trả về là kiểu BanAn (maBan, tenBan, sucChua...)
                const banAnData = await tableService.getDashboardTableStatus(
                selectedDateTime.toISOString()
            );
                
                // 2. SỬA LỖI "UNDEFINED": Ánh xạ (map) dữ liệu
                // Chuyển từ kiểu BanAn (API) sang kiểu Table (mà TableCard cần)
                const mappedTables: Table[] = banAnData.map((banAn: any) => ({
                    id: banAn.maBan,        // Map maBan -> id
                    name: banAn.tenBan,      // Map tenBan -> name
                    capacity: banAn.sucChua, // Map sucChua -> capacity
                    status: banAn.tenTrangThai, // Map tenTrangThai -> status
                    maTang: banAn.maTang,    // Giữ maTang để lọc
                    // ... (Thêm các trường khác nếu TableCard của bạn cần)
                }));

                // 3. Set State với dữ liệu đã được map
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

    // === LOGIC LỌC BÀN (THEO TẦNG) ===
    const filteredTables = useMemo(() => {
        if (selectedTang === "ALL") {
            return tables;
        }
        // Giả sử object 'table' đã được map (ở trên) và có 'maTang'
        return tables.filter((table: any) => table.maTang === selectedTang);
    }, [tables, selectedTang]);


    const handleTableClick = (table: Table) => {
        setSelectedTable(table);

        // 1. Chuyển trạng thái về chuỗi thường để so sánh cho an toàn
        // (Vì data thật có thể là 'Đang phục vụ' hoặc 'Occupied')
        const statusStr = String(table.status || '').trim().toLowerCase();

        console.log(`Click bàn: ${table.name} | Trạng thái thực tế: ${statusStr}`);

        // 2. Kiểm tra điều kiện mở gọi món
        // Cho phép mở nếu trạng thái khớp với Enum 'Occupied' HOẶC khớp chữ 'đang phục vụ'
        const isOccupied = 
            statusStr === TableStatus.Occupied.toLowerCase() || // Khớp 'occupied'
            statusStr === 'đang phục vụ' ||                     // Khớp tiếng Việt có dấu
            statusStr === 'dang phuc vu';                       // Khớp tiếng Việt không dấu

        if (isOccupied) {
            setOrderModalOpen(true);
        } else {
            // (Tuỳ chọn) Bạn có thể mở comment dòng dưới để debug nếu click không ăn
            alert(`Bàn này đang ở trạng thái: "${table.status}". Chỉ bàn "Đang phục vụ" mới được gọi món.`);
        }
    };

    const handleOpenPayment = () => {
        setOrderModalOpen(false);
        setPaymentModalOpen(true);
    }

    const closeAllModals = () => {
        setSelectedTable(null);
        setOrderModalOpen(false);
        setPaymentModalOpen(false);
    };

    const currentOrder = selectedTable ? getOrderForTable(selectedTable.id) : undefined;

    // === JSX (Phần Giao Diện) ===
    return (
        <div>
            {/* === BỘ LỌC MỚI (TẦNG & THỜI GIAN) === */}
            <Box 
                sx={{ 
                    p: 2, 
                    mb: 3, 
                    display: 'flex', 
                    gap: 2, 
                    flexWrap: 'wrap', 
                    backgroundColor: 'white', 
                    borderRadius: 1, 
                    boxShadow: 1 
                }}
            >
                {/* Lọc Tầng */}
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

                {/* Lọc Thời Gian */}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    label="Xem trạng thái lúc"
                    value={selectedDateTime}
                    onChange={(newValue) => setSelectedDateTime(newValue)}
                    slots={{ textField: TextField }}
                    slotProps={{
                      textField: {
                        size: 'small',
                        sx: { minWidth: 250 }
                      },
                    }}
                    enableAccessibleFieldDOMStructure={false}
                  />
                </LocalizationProvider>
            </Box>

            {/* === CHÚ THÍCH (THÊM LẠI) === */}
            <StatusLegend />

            {/* === SƠ ĐỒ BÀN (ĐÃ LỌC) === */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {filteredTables.map((table) => (
                        <TableCard key={table.id} table={table} onClick={() => handleTableClick(table)} />
                    ))}
                </div>
            )}

            {/* === CÁC MODAL (giữ nguyên) === */}
            {selectedTable && isOrderModalOpen && (
                <OrderModal
                    table={selectedTable}
                    order={currentOrder}
                    onClose={closeAllModals}
                    onOpenPayment={handleOpenPayment}
                />
            )}

            {selectedTable && isPaymentModalOpen && currentOrder && (
                <PaymentModal
                    order={currentOrder}
                    onClose={closeAllModals}
                />
            )}
        </div>
    );
};

export default DashboardView;
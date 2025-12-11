import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { 
    Package, History, Plus, Printer, Save, CheckCircle, 
    Trash2, Search, Filter, RefreshCcw, Truck, ShoppingCart ,
    AlertTriangle, Boxes, X // Đã thêm icon X
} from 'lucide-react';

// --- IMPORT TYPES & SERVICES ---
import { 
    NhaCungCap, 
    NguyenLieuNCC, 
    CartItem, 
    PhieuNhapHistory, 
    NhapKhoPayload 
} from '@/types/InventoryTypes';
import InventoryService from '@/services/inventoryService';
import { MauInPhieuNhap } from '@/components/printing/MauInPhieuNhap';
import { useAuth } from '@/contexts'; 

// --- ĐỊNH NGHĨA TYPE CHO STOCK ITEM (Khớp với Backend C# mới sửa) ---
interface StockItem {
    maNguyenLieu: string;
    tenNguyenLieu: string;
    donViTinh: string;
    soLuongTon: number;
    trangThai: string;
    // Danh sách NCC trả về từ API GetInventoryStock
    cacNhaCungCap: {
        maNhaCungCap: string;
        tenNhaCungCap: string;
        maCungUng: string;
        giaGoiY: number;
    }[]; 
}

const InventoryScreen = () => {
    const { user } = useAuth();
    
    // --- STATE QUẢN LÝ ---
    const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Dữ liệu
    const [suppliers, setSuppliers] = useState<NhaCungCap[]>([]);
    const [ingredients, setIngredients] = useState<NguyenLieuNCC[]>([]);
    const [historyList, setHistoryList] = useState<PhieuNhapHistory[]>([]); 

    // Sử dụng StockItem[] thay vì any[] để an toàn type
    const [stockList, setStockList] = useState<StockItem[]>([]); 
    const [loadingStock, setLoadingStock] = useState(false);

    // Form nhập liệu (Tab 1)
    const [selectedSupplier, setSelectedSupplier] = useState<NhaCungCap | null>(null);
    const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
    const [inputQuantity, setInputQuantity] = useState<number>(1);
    const [inputPrice, setInputPrice] = useState<number>(0);
    const [cart, setCart] = useState<CartItem[]>([]);

    // --- STATE CHO MODAL NHẬP NHANH (MỚI) ---
    const [showQuickModal, setShowQuickModal] = useState(false);
    const [quickItem, setQuickItem] = useState<StockItem | null>(null);
    const [quickQty, setQuickQty] = useState(10);
    const [quickSupplierId, setQuickSupplierId] = useState('');

    // Bộ lọc & In ấn
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [printData, setPrintData] = useState<any>(null); 
    const componentRef = useRef<HTMLDivElement>(null);

    // --- INIT DATA ---
    useEffect(() => {
        fetchSuppliers();
        fetchHistory();
        fetchStock();
    }, []);

    const fetchStock = async () => {
        setLoadingStock(true);
        try {
            const data = await InventoryService.getStockList();
            setStockList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Lỗi tải tồn kho:", err);
        } finally {
            setLoadingStock(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [filterStatus]);

    const handlePrintTrigger = useReactToPrint({
        contentRef: componentRef, 
        documentTitle: `PhieuNhap_${printData?.maNhapHang || 'Temp'}`,
    });

    const fetchSuppliers = async () => {
        try {
            const data = await InventoryService.getSuppliers();
            setSuppliers(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
    };

    const fetchIngredientsBySupplier = async (maNCC: string) => {
        try {
            const data = await InventoryService.getIngredientsBySupplier(maNCC);
            setIngredients(Array.isArray(data) ? data : []);
            return data; // Return data để dùng cho logic nhập nhanh
        } catch (err) { console.error(err); setIngredients([]); return []; }
    };

    const fetchHistory = async () => {
        try {
            const data = await InventoryService.getHistory(filterStatus);
            setHistoryList(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); setHistoryList([]); }
    };

    // --- XỬ LÝ LOGIC FORM ---
    const handleSelectSupplier = async (val: string) => {
        const maNCC = val;
        if (!maNCC) {
            setSelectedSupplier(null); setIngredients([]); return;
        }
        
        // Nếu đang có giỏ hàng mà chọn NCC khác -> Confirm
        if (selectedSupplier && selectedSupplier.maNhaCungCap !== maNCC && cart.length > 0 && !editingId) {
             // Logic confirm đã được xử lý ở UI hoặc hàm gọi, ở đây ta cứ set
        }

        const supplier = suppliers.find(s => s.maNhaCungCap === maNCC) || null;
        setSelectedSupplier(supplier);
        
        // Reset nếu đổi sang NCC khác
        if (selectedSupplier?.maNhaCungCap !== maNCC) {
            setCart([]); 
        }
        
        setSelectedIngredientId(''); 
        setInputPrice(0);
        await fetchIngredientsBySupplier(maNCC);
    };

    // Wrapper cho sự kiện onChange của Select
    const onSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const maNCC = e.target.value;
        if (cart.length > 0 && !editingId && selectedSupplier?.maNhaCungCap !== maNCC) {
            if (!confirm("Đổi NCC sẽ xóa danh sách hàng hiện tại trong phiếu?")) return;
        }
        handleSelectSupplier(maNCC);
    }

    const handleSelectIngredient = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const maCungUng = e.target.value;
        setSelectedIngredientId(maCungUng);
        const ing = ingredients.find(i => i.maCungUng === maCungUng);
        setInputPrice(ing ? (ing.giaGoiY || 0) : 0);
    };

    const handleAddProduct = () => {
        if (!selectedIngredientId) return alert("Vui lòng chọn nguyên liệu!");
        if (inputQuantity <= 0) return alert("Số lượng phải lớn hơn 0!");
        
        const ing = ingredients.find(i => i.maCungUng === selectedIngredientId);
        if (!ing) return;

        // Logic thêm vào cart
        addToCartLogic(ing.maCungUng, ing.maNguyenLieu, ing.tenNguyenLieu, ing.donViTinh, inputQuantity, inputPrice);
        
        setInputQuantity(1);
    };

    // Hàm logic chung để thêm vào giỏ hàng (tách ra để tái sử dụng)
    const addToCartLogic = (maCungUng: string, maNL: string, tenNL: string, dvt: string, qty: number, price: number) => {
        setCart(prevCart => {
            const idx = prevCart.findIndex(c => c.maCungUng === maCungUng);
            if (idx !== -1) {
                const newCart = [...prevCart];
                newCart[idx].soLuong += qty;
                if (price > 0) newCart[idx].giaNhap = price;
                return newCart;
            } else {
                return [...prevCart, {
                    maCungUng: maCungUng,
                    maNguyenLieu: maNL,
                    tenNguyenLieu: tenNL,
                    donViTinh: dvt,
                    soLuong: qty,
                    giaNhap: price
                }];
            }
        });
    };

    const handleUpdateRowPrice = (idx: number, val: number) => {
        const newCart = [...cart]; newCart[idx].giaNhap = val; setCart(newCart);
    };
    
    const handleUpdateRowQuantity = (idx: number, val: number) => {
        const newCart = [...cart]; newCart[idx].soLuong = val; setCart(newCart);
    };

    const handleRemoveItem = (idx: number) => {
        const newCart = [...cart]; newCart.splice(idx, 1); setCart(newCart);
    };

    // --- LOGIC NHẬP NHANH TỪ TAB 3 (MỚI) ---
    const openQuickImport = (item: StockItem) => {
        setQuickItem(item);
        setQuickQty(item.soLuongTon <= 10 ? 20 : 10); // Gợi ý nhập 20 nếu sắp hết
        
        // Logic tự động chọn NCC trong Modal
        if (selectedSupplier) {
            // Nếu Tab 1 đang chọn NCC, kiểm tra xem NCC đó có bán món này không
            const supplierSellThisItem = item.cacNhaCungCap?.find(s => s.maNhaCungCap === selectedSupplier.maNhaCungCap);
            if (supplierSellThisItem) {
                setQuickSupplierId(selectedSupplier.maNhaCungCap);
            } else {
                setQuickSupplierId(''); 
            }
        } else {
            // Nếu món này chỉ có 1 NCC độc quyền -> chọn luôn
            if (item.cacNhaCungCap?.length === 1) {
                setQuickSupplierId(item.cacNhaCungCap[0].maNhaCungCap);
            } else {
                setQuickSupplierId('');
            }
        }
        setShowQuickModal(true);
    };

    const handleConfirmQuickImport = async () => {
        if (!quickSupplierId || !quickItem) return alert("Vui lòng chọn Nhà Cung Cấp!");
        
        // 1. Lấy thông tin cung ứng (để lấy MaCungUng và Giá)
        const targetSupplyInfo = quickItem.cacNhaCungCap?.find(s => s.maNhaCungCap === quickSupplierId);
        if (!targetSupplyInfo) return alert("Lỗi dữ liệu nhà cung cấp!");

        // 2. Chuyển sang Tab 1
        setActiveTab(1);

        // 3. Nếu NCC được chọn KHÁC với NCC đang active ở Tab 1
        if (selectedSupplier?.maNhaCungCap !== quickSupplierId) {
            // Gọi hàm chọn NCC (nó sẽ reset giỏ hàng cũ và fetch list ingredients mới)
            await handleSelectSupplier(quickSupplierId);
        }

        // 4. Thêm hàng vào giỏ
        // Ta dùng thông tin từ API Stock để thêm ngay mà ko cần chờ API ingredients
        addToCartLogic(
            targetSupplyInfo.maCungUng,
            quickItem.maNguyenLieu,
            quickItem.tenNguyenLieu,
            quickItem.donViTinh,
            quickQty,
            targetSupplyInfo.giaGoiY || 0
        );

        setShowQuickModal(false);
    };


    // --- XỬ LÝ EDIT & IN ẤN ---
    const handleEditClick = async (maPhieu: string) => {
        try {
            const data: any = await InventoryService.getReceiptDetail(maPhieu);
            setEditingId(maPhieu);

            const ncc = suppliers.find(s => s.maNhaCungCap === data.maNhaCungCap) || null;
            setSelectedSupplier(ncc);
            if (data.maNhaCungCap) await fetchIngredientsBySupplier(data.maNhaCungCap);

            setCart(data.chiTiet.map((item: any) => ({
                maCungUng: item.maCungUng,
                maNguyenLieu: item.maNguyenLieu,
                tenNguyenLieu: item.tenNguyenLieu,
                donViTinh: item.donViTinh,
                soLuong: item.soLuong,
                giaNhap: item.giaNhap
            })));
            setActiveTab(1);
        } catch (err) { alert("Lỗi tải phiếu"); }
    };

    const handlePrintClick = async (maPhieu: string) => {
        try {
            const data: any = await InventoryService.getReceiptDetail(maPhieu);
            const ncc = suppliers.find(s => s.maNhaCungCap === data.maNhaCungCap);
            
            const fullData = {
                ...data,
                maNhapHang: maPhieu, 
                ngayLap: data.ngayLapPhieu || new Date().toISOString(),
                tenNhaCungCap: ncc?.tenNhaCungCap || "---",
                diaChiNCC: ncc?.diaChi,
                sdtNCC: ncc?.soDienThoai,
                tenNhanVien: (user && user.type === 'admin') 
                    ? `${user.employeeId} - ${user.name}` 
                    : (user?.name || "Admin"),
                tenTrangThai: data.trangThai === 'DA_HOAN_TAT' ? 'Đã nhập kho' : 'Phiếu tạm'
            };

            setPrintData(fullData);
            setTimeout(() => {
                handlePrintTrigger();
            }, 200);
        } catch (err) {
            console.error(err);
            alert("Không thể tải dữ liệu để in!");
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null); setCart([]); setSelectedSupplier(null); 
        setIngredients([]); setSelectedIngredientId('');
    };

    // --- SUBMIT ---
    const handleSubmit = async (trangThaiStr: string) => {
        if (!selectedSupplier || cart.length === 0) return alert("Vui lòng chọn NCC và thêm ít nhất 1 món hàng!");

        const maNhanVienCurrent = (user && user.type === 'admin') ? user.employeeId : '';
        if (!maNhanVienCurrent) {
            return alert("Lỗi: Không xác định được nhân viên đang đăng nhập! Vui lòng đăng nhập lại.");
        }

        const payload: NhapKhoPayload = {
            maNhanVien: maNhanVienCurrent,
            maNhaCungCap: selectedSupplier.maNhaCungCap,
            maTrangThai: trangThaiStr,
            chiTiet: cart.map(c => ({ 
                MaCungUng: c.maCungUng,
                SoLuong: c.soLuong,
                GiaNhap: c.giaNhap
            }))
        };

        try {
            if (editingId) {
                await InventoryService.updateReceipt(editingId, payload);
                alert("Đã cập nhật phiếu nhập!");
            } else {
                await InventoryService.createReceipt(payload);
                alert(trangThaiStr === 'MOI_TAO' ? "Đã lưu phiếu nháp!" : "Đã nhập kho thành công!");
            }
            handleCancelEdit(); setActiveTab(2); fetchHistory();
        } catch (err: any) {
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
        fetchStock();
    };

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300 font-sans text-gray-900 dark:text-white relative">
            
            {/* --- MODAL NHẬP NHANH (MỚI) --- */}
            {showQuickModal && quickItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                <Plus className="w-5 h-5" /> Nhập nhanh nguyên liệu
                            </h3>
                            <button onClick={() => setShowQuickModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Thông tin mặt hàng */}
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Mặt hàng</p>
                                <p className="text-xl font-bold text-gray-800 dark:text-white">{quickItem.tenNguyenLieu}</p>
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                    Tồn kho: 
                                    <span className={`font-bold px-2 py-0.5 rounded text-xs ${quickItem.soLuongTon <= 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {quickItem.soLuongTon} {quickItem.donViTinh}
                                    </span>
                                </p>
                            </div>

                            {/* Chọn Nhà Cung Cấp */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Nhập từ Nhà Cung Cấp</label>
                                <select 
                                    className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    value={quickSupplierId}
                                    onChange={(e) => setQuickSupplierId(e.target.value)}
                                >
                                    <option value="">-- Chọn nhà cung cấp --</option>
                                    {quickItem.cacNhaCungCap && quickItem.cacNhaCungCap.length > 0 ? (
                                        quickItem.cacNhaCungCap.map((s) => (
                                            <option key={s.maNhaCungCap} value={s.maNhaCungCap}>
                                                {s.tenNhaCungCap} {s.giaGoiY > 0 ? ` - Giá: ${s.giaGoiY.toLocaleString()}đ` : ''}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>Chưa có NCC nào cung cấp</option>
                                    )}
                                </select>
                                
                                {/* Cảnh báo nếu đổi NCC */}
                                {selectedSupplier && quickSupplierId && selectedSupplier.maNhaCungCap !== quickSupplierId && (
                                    <div className="mt-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 p-2 rounded-lg flex items-start gap-2 border border-amber-100 dark:border-amber-800">
                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>Chú ý: Bạn đang nhập hàng cho <b>{selectedSupplier.tenNhaCungCap}</b>. Nếu chọn NCC này, phiếu hiện tại sẽ bị reset.</span>
                                    </div>
                                )}
                            </div>

                            {/* Số lượng */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Số lượng nhập thêm</label>
                                <div className="flex items-center gap-0">
                                    <button onClick={() => setQuickQty(q => Math.max(1, q - 1))} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-l-xl hover:bg-gray-200 dark:hover:bg-gray-600 border border-r-0 border-gray-200 dark:border-gray-600">-</button>
                                    <input 
                                        type="number" 
                                        className="w-full p-3 text-center border-y border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 font-bold outline-none"
                                        value={quickQty}
                                        onChange={(e) => setQuickQty(Number(e.target.value))}
                                    />
                                    <button onClick={() => setQuickQty(q => q + 1)} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-r-xl hover:bg-gray-200 dark:hover:bg-gray-600 border border-l-0 border-gray-200 dark:border-gray-600">+</button>
                                </div>
                            </div>

                            <button 
                                onClick={handleConfirmQuickImport}
                                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex justify-center items-center gap-2 mt-2"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                Thêm vào phiếu nhập
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* COMPONENT ẨN ĐỂ IN */}
            <div style={{ display: "none" }}>
                <MauInPhieuNhap ref={componentRef} data={printData} />
            </div>

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Package className="w-8 h-8 text-indigo-600" />
                        Quản lý Kho hàng
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Nhập kho nguyên liệu và quản lý lịch sử nhập hàng</p>
                </div>
            </div>

            {/* TABS CHUYỂN ĐỔI */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button 
                    onClick={() => setActiveTab(1)}
                    className={`flex items-center gap-2 pb-3 px-4 font-semibold transition-colors border-b-2 ${
                        activeTab === 1 
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <ShoppingCart className="w-5 h-5" />
                    {editingId ? `Đang sửa phiếu: ${editingId}` : 'Tạo phiếu nhập'}
                </button>
                <button 
                    onClick={() => setActiveTab(2)}
                    className={`flex items-center gap-2 pb-3 px-4 font-semibold transition-colors border-b-2 ${
                        activeTab === 2 
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <History className="w-5 h-5" />
                    Lịch sử nhập hàng
                </button>

                <button 
                    onClick={() => setActiveTab(3)}
                    className={`flex items-center gap-2 pb-3 px-4 font-semibold transition-colors border-b-2 ${
                        activeTab === 3
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <Boxes className="w-5 h-5" />
                    Danh sách tồn kho
                </button>
            </div>

            {/* CONTENT TAB 1: FORM TẠO PHIẾU */}
            {activeTab === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* CỘT TRÁI: NHẬP LIỆU */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* 1. Chọn Nhà Cung Cấp */}
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                            {editingId && (
                                <button onClick={handleCancelEdit} className="w-full mb-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                    🔙 Hủy chế độ sửa
                                </button>
                            )}
                            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                Nhà Cung Cấp
                            </h3>
                            <select 
                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-colors"
                                value={selectedSupplier?.maNhaCungCap || ''} 
                                onChange={onSupplierChange} 
                                disabled={!!editingId}
                            >
                                <option value="">-- Chọn nhà cung cấp --</option>
                                {suppliers.map(s => <option key={s.maNhaCungCap} value={s.maNhaCungCap}>{s.tenNhaCungCap}</option>)}
                            </select>
                            
                            {selectedSupplier && (
                                <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg text-sm text-indigo-800 dark:text-indigo-300">
                                    <div className="flex items-start gap-2 mb-1">
                                        <Truck className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>{selectedSupplier.diaChi}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 flex items-center justify-center font-bold text-xs">📞</div>
                                        <span>{selectedSupplier.soDienThoai}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Form Nhập Hàng */}
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                Chọn Hàng Hóa
                            </h3>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Nguyên liệu</label>
                                    <select 
                                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white disabled:opacity-50"
                                        value={selectedIngredientId} 
                                        onChange={handleSelectIngredient} 
                                        disabled={!selectedSupplier}
                                    >
                                        <option value="">-- Chọn nguyên liệu --</option>
                                        {ingredients.map(ing => <option key={ing.maCungUng} value={ing.maCungUng}>{ing.tenNguyenLieu} ({ing.donViTinh})</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Số lượng</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                            value={inputQuantity} 
                                            onChange={e => setInputQuantity(Number(e.target.value))} 
                                            disabled={!selectedSupplier}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Giá nhập</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                            value={inputPrice} 
                                            onChange={e => setInputPrice(Number(e.target.value))} 
                                            disabled={!selectedSupplier}
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={handleAddProduct} 
                                    disabled={!selectedSupplier} 
                                    className="w-full mt-2 bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    THÊM VÀO PHIẾU
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: GIỎ HÀNG */}
                    <div className="lg:col-span-2 flex flex-col h-[calc(100vh-180px)] bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                                Chi tiết phiếu nhập
                            </h3>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {cart.length} mặt hàng
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-0">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-700/50 sticky top-0 z-10 text-gray-600 dark:text-gray-300">
                                    <tr>
                                        <th className="p-3 text-left font-semibold">Tên hàng</th>
                                        <th className="p-3 text-center font-semibold">ĐVT</th>
                                        <th className="p-3 text-center font-semibold w-24">SL</th>
                                        <th className="p-3 text-right font-semibold w-32">Đơn giá</th>
                                        <th className="p-3 text-right font-semibold">Thành tiền</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {cart.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-gray-400 dark:text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                                                    <p>Phiếu nhập đang trống</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        cart.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                                <td className="p-3 font-medium text-gray-900 dark:text-white">{item.tenNguyenLieu}</td>
                                                <td className="p-3 text-center text-gray-500 dark:text-gray-400">{item.donViTinh}</td>
                                                <td className="p-3 text-center">
                                                    <input 
                                                        type="number" 
                                                        className="w-full p-1 text-center bg-transparent border border-gray-200 dark:border-gray-600 rounded focus:border-indigo-500 focus:outline-none dark:text-white"
                                                        value={item.soLuong}
                                                        onChange={e => handleUpdateRowQuantity(idx, Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="p-3 text-right">
                                                    <input 
                                                        type="number" 
                                                        className="w-full p-1 text-right bg-transparent border border-gray-200 dark:border-gray-600 rounded focus:border-indigo-500 focus:outline-none dark:text-white"
                                                        value={item.giaNhap} 
                                                        onChange={e => handleUpdateRowPrice(idx, Number(e.target.value))} 
                                                    />
                                                </td>
                                                <td className="p-3 text-right font-bold text-gray-900 dark:text-white">
                                                    {(item.soLuong * item.giaNhap).toLocaleString()}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button 
                                                        onClick={() => handleRemoveItem(idx)} 
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Tổng thanh toán:</span>
                                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                    {cart.reduce((s, i) => s + i.soLuong * i.giaNhap, 0).toLocaleString()} đ
                                </span>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button 
                                    onClick={() => handleSubmit('MOI_TAO')} 
                                    className="flex-1 sm:flex-none px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Lưu nháp
                                </button>
                                <button 
                                    onClick={() => handleSubmit('DA_HOAN_TAT')} 
                                    className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Hoàn tất nhập
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENT TAB 2: LỊCH SỬ (Giữ nguyên) */}
            {activeTab === 2 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex flex-wrap gap-3 items-center">
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 mr-2 flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Bộ lọc:
                        </span>
                        <button 
                            onClick={() => setFilterStatus(null)} 
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                !filterStatus 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                        >
                            Tất cả
                        </button>
                        <button 
                            onClick={() => setFilterStatus('MOI_TAO')} 
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                filterStatus === 'MOI_TAO' 
                                ? 'bg-gray-600 text-white shadow-md' 
                                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                        >
                            Bản nháp
                        </button>
                        <button 
                            onClick={() => setFilterStatus('DA_HOAN_TAT')} 
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                filterStatus === 'DA_HOAN_TAT' 
                                ? 'bg-emerald-600 text-white shadow-md' 
                                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                        >
                            Đã hoàn tất
                        </button>
                        
                        <button 
                            onClick={fetchHistory} 
                            className="ml-auto p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
                            title="Làm mới"
                        >
                            <RefreshCcw className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase font-semibold text-xs tracking-wider">
                                <tr>
                                    <th className="p-4">Mã phiếu</th>
                                    <th className="p-4">Ngày lập</th>
                                    <th className="p-4">Nhà cung cấp</th>
                                    <th className="p-4 text-right">Tổng tiền</th>
                                    <th className="p-4 text-center">Trạng thái</th>
                                    <th className="p-4 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {historyList?.length > 0 ? historyList.map(item => (
                                    <tr key={item.maNhapHang} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                                        <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                                            {item.maNhapHang}
                                        </td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300">
                                            {new Date(item.ngayLap).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="p-4 text-gray-900 dark:text-white font-medium">
                                            {item.tenNhaCungCap}
                                        </td>
                                        <td className="p-4 text-right font-bold text-gray-900 dark:text-white">
                                            {item.tongTien.toLocaleString()} đ
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                item.maTrangThai === 'DA_HOAN_TAT' 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' 
                                                : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                                            }`}>
                                                {item.tenTrangThai || (item.maTrangThai === 'DA_HOAN_TAT' ? 'Hoàn tất' : 'Nháp')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                {item.maTrangThai !== 'DA_HOAN_TAT' && (
                                                    <button 
                                                        onClick={() => handleEditClick(item.maNhapHang)} 
                                                        className="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">✏️</span>
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handlePrintClick(item.maNhapHang)} 
                                                    className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                    title="In phiếu"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-400 dark:text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <History className="w-12 h-12 mb-3 opacity-20" />
                                                <p>Chưa có dữ liệu nhập kho</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CONTENT TAB 3: DANH SÁCH TỒN KHO (CẬP NHẬT) */}
            {activeTab === 3 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Package className="w-5 h-5 text-indigo-600" /> Trạng thái kho hiện tại
                        </h3>
                        <button onClick={fetchStock} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"><RefreshCcw className="w-5 h-5" /></button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 uppercase text-xs font-bold">
                                <tr>
                                    <th className="p-4">Mã NL</th>
                                    <th className="p-4">Tên Nguyên Liệu</th>
                                    <th className="p-4 text-center">ĐVT</th>
                                    <th className="p-4 text-right">Số lượng tồn</th>
                                    <th className="p-4 text-center">Trạng thái</th>
                                    {/* Cột Hành Động (Mới) */}
                                    <th className="p-4 text-center w-32">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loadingStock ? (
                                    <tr><td colSpan={6} className="p-8 text-center">Đang tải dữ liệu...</td></tr>
                                ) : stockList.length > 0 ? (
                                    stockList.map((item) => {
                                        // Logic màu sắc nút nhập hàng
                                        const isLowStock = item.soLuongTon <= 10;
                                        const btnClass = isLowStock 
                                            ? "bg-red-100 hover:bg-red-200 text-red-700 border border-red-200" 
                                            : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200";

                                        return (
                                            <tr key={item.maNguyenLieu} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                <td className="p-4 font-mono text-gray-500">{item.maNguyenLieu}</td>
                                                <td className="p-4 font-bold text-gray-900 dark:text-white">{item.tenNguyenLieu}</td>
                                                <td className="p-4 text-center">{item.donViTinh}</td>
                                                <td className={`p-4 text-right font-bold text-lg ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                                                    {item.soLuongTon}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {item.trangThai === 'HET_HANG' && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Hết hàng</span>}
                                                    {item.trangThai === 'SAP_HET' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center justify-center gap-1"><AlertTriangle className="w-3 h-3"/> Sắp hết</span>}
                                                    {item.trangThai === 'CON_HANG' && <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Ổn định</span>}
                                                </td>
                                                
                                                {/* Button Nhập Hàng */}
                                                <td className="p-4 text-center">
                                                    <button 
                                                        onClick={() => openQuickImport(item)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 mx-auto ${btnClass}`}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Nhập hàng
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">Kho đang trống</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryScreen;
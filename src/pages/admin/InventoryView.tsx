import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { 
    Package, History, Plus, Printer, Save, CheckCircle, 
    Trash2, Search, Filter, RefreshCcw, Truck, ShoppingCart 
} from 'lucide-react';

// --- IMPORT TYPES & SERVICES (Giữ nguyên) ---
import { 
    NhaCungCap, 
    NguyenLieuNCC, 
    CartItem, 
    PhieuNhapHistory, 
    NhapKhoPayload 
} from '@/types/InventoryTypes';
import InventoryService from '@/services/inventoryService';
import { MauInPhieuNhap } from '@/components/printing/MauInPhieuNhap';
import { useAuth } from '@/contexts'; // Đảm bảo đường dẫn import đúng

const InventoryScreen = () => {
    const { user } = useAuth();
    
    // --- STATE QUẢN LÝ ---
    const [activeTab, setActiveTab] = useState<1 | 2>(1);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Dữ liệu
    const [suppliers, setSuppliers] = useState<NhaCungCap[]>([]);
    const [ingredients, setIngredients] = useState<NguyenLieuNCC[]>([]);
    const [historyList, setHistoryList] = useState<PhieuNhapHistory[]>([]); 

    // Form nhập liệu
    const [selectedSupplier, setSelectedSupplier] = useState<NhaCungCap | null>(null);
    const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
    const [inputQuantity, setInputQuantity] = useState<number>(1);
    const [inputPrice, setInputPrice] = useState<number>(0);
    const [cart, setCart] = useState<CartItem[]>([]);

    // Bộ lọc & In ấn
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [printData, setPrintData] = useState<any>(null); 

    // Ref cho chức năng in
    const componentRef = useRef<HTMLDivElement>(null);

    // --- INIT DATA ---
    useEffect(() => {
        fetchSuppliers();
        fetchHistory();
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [filterStatus]);

    // --- HÀM GỌI LỆNH IN ---
    const handlePrintTrigger = useReactToPrint({
        contentRef: componentRef, 
        documentTitle: `PhieuNhap_${printData?.maNhapHang || 'Temp'}`,
    });

    // --- GỌI SERVICE ---
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
        } catch (err) { console.error(err); setIngredients([]); }
    };

    const fetchHistory = async () => {
        try {
            const data = await InventoryService.getHistory(filterStatus);
            setHistoryList(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); setHistoryList([]); }
    };

    // --- XỬ LÝ LOGIC FORM ---
    const handleSelectSupplier = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const maNCC = e.target.value;
        if (!maNCC) {
            setSelectedSupplier(null); setIngredients([]); return;
        }
        if (cart.length > 0 && !editingId) {
            if (!confirm("Đổi NCC sẽ xóa danh sách hàng hiện tại trong phiếu?")) return;
        }
        const supplier = suppliers.find(s => s.maNhaCungCap === maNCC) || null;
        setSelectedSupplier(supplier);
        setCart([]); setSelectedIngredientId(''); setInputPrice(0);
        fetchIngredientsBySupplier(maNCC);
    };

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

        const idx = cart.findIndex(c => c.maCungUng === selectedIngredientId);
        if (idx !== -1) {
            const newCart = [...cart];
            newCart[idx].soLuong += inputQuantity;
            if (inputPrice > 0) newCart[idx].giaNhap = inputPrice;
            setCart(newCart);
        } else {
            setCart([...cart, {
                maCungUng: ing.maCungUng,
                maNguyenLieu: ing.maNguyenLieu,
                tenNguyenLieu: ing.tenNguyenLieu,
                donViTinh: ing.donViTinh,
                soLuong: inputQuantity,
                giaNhap: inputPrice
            }]);
        }
        // Reset input số lượng về 1 để nhập tiếp cho nhanh
        setInputQuantity(1);
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
    };

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300 font-sans text-gray-900 dark:text-white">
            
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
                                onChange={handleSelectSupplier} 
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

            {/* CONTENT TAB 2: LỊCH SỬ */}
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
        </div>
    );
};

export default InventoryScreen;
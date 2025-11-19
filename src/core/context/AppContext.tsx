import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { Table, Order, MenuItem, OrderItem, Ingredient, Reservation, Supplier, KDSItem, InventoryTransaction, InventoryTransactionItem, Staff, Category, Role } from '@/core/types';
import { TableStatus, PaymentMethod } from '@/core/types';
import { Api, BASE_URL } from '@/shared/utils/api';
import { orderService } from '@/services/orderService';


const generateDailyId = (existingIds: string[]): string => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const datePrefix = `${day}${month}${year}`;

    const todaysIds = existingIds.filter(id => id.startsWith(datePrefix));
    const nextSeq = todaysIds.length + 1;
    const seqStr = String(nextSeq).padStart(3, '0');

    return `${datePrefix}${seqStr}`;
};

interface AppContextType {
    tables: Table[];
    orders: Order[];
    menuItems: MenuItem[];
    categories: Category[];
    ingredients: Ingredient[];
    reservations: Reservation[];
    suppliers: Supplier[];
    kdsQueue: KDSItem[];
    inventoryTransactions: InventoryTransaction[];
    staff: Staff[];


    addItemsToTableOrder: (tableId: string, items: OrderItem[]) => Promise<void>;
    createOrder: (tableId: string, items: OrderItem[]) => void;
    updateOrder: (orderId: string, items: OrderItem[]) => void;
    closeOrder: (orderId: string, paymentMethod: PaymentMethod) => void;
    updateTableStatus: (tableId: string, status: TableStatus) => void;
    getOrderForTable: (tableId: string) => Order | undefined;
    sendOrderToKDS: (orderId: string) => void;

    addMenuItem: (itemData: Omit<MenuItem, 'id'>) => void;
    updateMenuItem: (item: MenuItem) => void;
    deleteMenuItem: (itemId: string) => void;
    generateRecipeId: () => string;

    // Reservations
    createReservation: (data: Omit<Reservation, 'id' | 'status'> & { status?: Reservation['status'] }) => void;
    updateReservation: (res: Reservation) => void;
    cancelReservation: (id: string, reason?: string) => void;
    confirmArrival: (id: string) => void;
    markNoShow: (id: string, reason?: string) => void;
    getAvailableTables: (dateTime: number, partySize: number) => Promise<Array<{ id: string; name: string; capacity: number; status: string }>>;

    // Inventory & Procurement
    recordInventoryIn: (items: InventoryTransactionItem[], supplierId?: string, note?: string) => void;
    adjustInventory: (items: InventoryTransactionItem[], note?: string) => void;
    consumeByOrderItems: (items: OrderItem[]) => void;
    lowStockIds: () => string[];

    // Suppliers
    addSupplier: (s: Omit<Supplier, 'id'>) => void;
    updateSupplier: (s: Supplier) => void;
    deleteSupplier: (id: string) => void;

    // Tables CRUD
    addTable: (t: Omit<Table, 'id' | 'status' | 'orderId'>) => void;
    updateTable: (t: Table) => void;
    deleteTable: (id: string) => void;

    // Staff CRUD
    addStaff: (s: Omit<Staff, 'id' | 'active'> & { active?: boolean }) => void;
    updateStaff: (s: Staff) => void;
    deleteStaff: (id: string) => void;
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper functions for localStorage
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        if (item) {
            return JSON.parse(item);
        }
    } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
    }
    return defaultValue;
};

const saveToStorage = <T,>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
    }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Load from localStorage or use empty arrays (no mock data)
    const [tables, setTables] = useState<Table[]>(() => loadFromStorage('restaurant_tables', []));
    const [orders, setOrders] = useState<Order[]>(() => loadFromStorage('restaurant_orders', []));
    const [menuItems, setMenuItems] = useState<MenuItem[]>(() => loadFromStorage('restaurant_menuItems', []));
    const [categories, setCategories] = useState<Category[]>(() => loadFromStorage('restaurant_categories', []));
    // Ingredients are loaded from API only, no hardcoded data
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>(() => loadFromStorage('restaurant_reservations', []));
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [kdsQueue, setKdsQueue] = useState<KDSItem[]>(() => loadFromStorage('restaurant_kdsQueue', []));
    const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(() => loadFromStorage('restaurant_inventoryTransactions', []));
    const [staff, setStaff] = useState<Staff[]>([]);
    const [reservationToOrderMap, setReservationToOrderMap] = useState<Record<string, string>>(() => loadFromStorage('restaurant_res_to_order', {} as Record<string, string>));

    // Save to localStorage whenever state changes
    React.useEffect(() => {
        saveToStorage('restaurant_tables', tables);
    }, [tables]);

    React.useEffect(() => {
        saveToStorage('restaurant_orders', orders);
    }, [orders]);

    React.useEffect(() => {
        saveToStorage('restaurant_menuItems', menuItems);
    }, [menuItems]);
    React.useEffect(() => {
        saveToStorage('restaurant_categories', categories);
    }, [categories]);

    // Don't save ingredients to localStorage - always load from API
    // React.useEffect(() => {
    //     saveToStorage('restaurant_ingredients', ingredients);
    // }, [ingredients]);

    React.useEffect(() => {
        saveToStorage('restaurant_reservations', reservations);
    }, [reservations]);
    React.useEffect(() => {
        saveToStorage('restaurant_res_to_order', reservationToOrderMap);
    }, [reservationToOrderMap]);
    // Helper function to map Vietnamese status strings to TableStatus enum
    const mapTableStatus = (tenTrangThai: string | undefined): TableStatus => {
        if (!tenTrangThai) return TableStatus.Available;
        const statusLower = tenTrangThai.toLowerCase().trim();
        if (statusLower.includes('trống') || statusLower.includes('available') || statusLower.includes('sẵn sàng')) {
            return TableStatus.Available;
        }
        if (statusLower.includes('đang sử dụng') || statusLower.includes('occupied') || statusLower.includes('đang dùng')) {
            return TableStatus.Occupied;
        }
        if (statusLower.includes('đã đặt') || statusLower.includes('reserved') || statusLower.includes('đặt trước')) {
            return TableStatus.Reserved;
        }
        if (statusLower.includes('dọn') || statusLower.includes('cleaning') || statusLower.includes('bảo trì')) {
            return TableStatus.CleaningNeeded;
        }
        return TableStatus.Available; // Default
    };


    // useEffect(() => {
    //     (async () => {
    //         try {
    //             // 1. Gọi API lấy dữ liệu thô
    //             const data = await orderService.getActiveOrders();
                
    //             if (Array.isArray(data) && data.length > 0) {
                    
    //                 // 2. Map sang Order Frontend
    //                 const mappedOrders: Order[] = data.map((d: any) => ({
    //                     id: d.maDonHang,
    //                     // Vẫn giữ bàn chính để hiển thị đại diện
    //                     tableId: (d.listMaBan && d.listMaBan.length > 0) ? d.listMaBan[0] : '', 
    //                     items: [], 
    //                     subtotal: 0,
    //                     total: 0,
    //                     discount: 0,
    //                     createdAt: new Date(d.thoiGianNhanBan).getTime(),
    //                     status: 'active'
    //                 }));

    //                 setOrders(mappedOrders);

    //                 // 3. QUAN TRỌNG: CẬP NHẬT TRẠNG THÁI CHO TẤT CẢ CÁC BÀN LIÊN QUAN
    //                 setTables(prevTables => prevTables.map(t => {
    //                     // Tìm trong dữ liệu thô (data) xem bàn này (t.id) có nằm trong listMaBan của đơn nào không?
    //                     // Logic cũ chỉ tìm theo mappedOrders nên bị sót bàn phụ
    //                     const rawOrderData = data.find((d: any) => 
    //                         d.listMaBan && d.listMaBan.includes(t.id)
    //                     );
                        
    //                     if (rawOrderData) {
    //                         // Nếu tìm thấy bàn này trong 1 đơn hàng nào đó
    //                         return { 
    //                             ...t, 
    //                             status: TableStatus.Occupied, // Đánh dấu có khách
    //                             orderId: rawOrderData.maDonHang // <--- GẮN ĐÚNG ORDER ID CHO CẢ BÀN CHÍNH LẪN BÀN PHỤ
    //                         };
    //                     }
    //                     return t;
    //                 }));
    //             }
    //         } catch (error) {
    //             console.warn('Lỗi tải đơn hàng:', error);
    //         }
    //     })();
    // }, []);

    useEffect(() => {
        (async () => {
            try {
                const data = await orderService.getActiveOrders();
                
                if (Array.isArray(data) && data.length > 0) {
                    
                    // --- MAP ĐƠN HÀNG ---
                    const mappedOrders: Order[] = data.map((d: any) => {
                        // 1. Xử lý món ăn (quan trọng: khai báo const bên trong để tạo mảng mới mỗi lần lặp)
                        let localItems: any[] = [];
                        
                        if (Array.isArray(d.chiTietDonHang)) {
                             localItems = d.chiTietDonHang.map((ct: any) => ({
                                id: ct.maMonAn, // Nên dùng ID duy nhất của dòng chi tiết nếu có (ví dụ: ct.id)
                                menuItemId: ct.maMonAn,
                                quantity: ct.soLuong,
                                notes: ct.ghiChu || '',
                                price: ct.donGia || 0 // Map thêm giá nếu cần
                            }));
                        }

                        // 2. Trả về object Order
                        return {
                            id: d.maDonHang,
                            tableId: (d.listMaBan && d.listMaBan.length > 0) ? d.listMaBan[0] : '',
                            // Dùng [...localItems] để copy ra một mảng hoàn toàn mới -> TRÁNH LỖI DÙNG CHUNG
                            items: [...localItems], 
                            subtotal: d.tongTien || 0,
                            total: d.tongTien || 0,
                            discount: 0,
                            createdAt: new Date(d.thoiGianNhanBan).getTime(),
                            status: 'active'
                        };
                    });

                    setOrders(mappedOrders);

                    // --- CẬP NHẬT TRẠNG THÁI BÀN ---
                    setTables(prevTables => prevTables.map(t => {
                        // Logic cũ: Tìm xem bàn này có nằm trong đơn hàng nào không
                        const rawOrderData = data.find((d: any) => 
                            d.listMaBan && d.listMaBan.includes(t.id)
                        );
                        
                        if (rawOrderData) {
                            // Kiểm tra kỹ: Nếu bàn này thuộc đơn hàng này -> Gán Order ID
                            return { 
                                ...t, 
                                status: TableStatus.Occupied,
                                orderId: rawOrderData.maDonHang 
                            };
                        }
                        
                        // Nếu không tìm thấy đơn cho bàn này -> Reset về trạng thái cũ hoặc Trống
                        // Quan trọng: Phải clear orderId đi nếu nó không còn active
                        // return { ...t, orderId: undefined }; // (Bỏ comment dòng này nếu muốn strict mode)
                        return t;
                    }));
                }
            } catch (error) {
                console.warn('Lỗi tải đơn hàng:', error);
            }
        })();
    }, []);


    const addItemsToTableOrder = async (tableId: string, items: OrderItem[]) => {
        // 1. Tìm đơn hàng hiện tại của bàn này
        const currentOrder = getOrderForTable(tableId);

        // NẾU KHÔNG TÌM THẤY ĐƠN -> DỪNG LUÔN (Bàn trống không cho thêm món)
        if (!currentOrder) {
            console.error(`Bàn ${tableId} chưa có đơn hàng (Trạng thái trống). Vui lòng tạo đơn/Check-in trước.`);
            // Bạn có thể thêm thông báo UI ở đây: notify("Bàn này chưa có khách!", "error");
            return;
        }

        // 2. Chuẩn bị dữ liệu gửi về Server
        // Map từ OrderItem (Frontend) sang cấu trúc Backend yêu cầu
        const payload = {
            maDonHang: currentOrder.id,
            maBan: tableId,
            items: items.map(i => ({
                maMonAn: i.menuItem.id,
                // Lấy ID của phiên bản (Size). Nếu không có thì để chuỗi rỗng (cần đảm bảo data đầu vào chuẩn)
                maPhienBan: i.menuItem.sizes.find(s => s.name === i.size)?.id || '', 
                soLuong: i.quantity,
                ghiChu: i.notes || ''
            }))
        };

        try {
            // 3. Gọi API thêm món
            await orderService.addItemsToTable(payload);
            console.log("Đã thêm món thành công vào đơn:", currentOrder.id);

            // 4. CẬP NHẬT LẠI DỮ LIỆU (Reload từ Server để đồng bộ)
            // Gọi lại API lấy danh sách Active Orders để đảm bảo dữ liệu mới nhất
            const latestData = await orderService.getActiveOrders();

            if (Array.isArray(latestData)) {
                // Map dữ liệu từ Backend -> Frontend Order
                const mappedOrders: Order[] = latestData.map((d: any) => ({
                    id: d.maDonHang,
                    // Lấy mã bàn đầu tiên trong danh sách bàn của đơn
                    tableId: (d.listMaBan && d.listMaBan.length > 0) ? d.listMaBan[0] : '', 
                    
                    // Lưu ý: API GetActiveBookings thường chỉ trả về tóm tắt.
                    // Nếu muốn hiển thị chi tiết món ngay lập tức, bạn cần logic gọi API chi tiết (GetMyBookingDetail)
                    // hoặc chấp nhận items rỗng cho đến khi bấm vào xem chi tiết.
                    items: [], 
                    
                    subtotal: 0, // Có thể tính toán nếu Backend trả về tổng tiền
                    total: 0,
                    discount: 0,
                    createdAt: new Date(d.thoiGianNhanBan).getTime(),
                    status: 'active'
                }));

                // Cập nhật State Orders
                setOrders(mappedOrders);

                // Cập nhật State Tables (Đánh dấu bàn có khách)
                setTables(prevTables => prevTables.map(t => {
                    // Tìm xem bàn này có nằm trong danh sách đơn hàng mới tải về không
                    const orderOfTable = mappedOrders.find(o => o.tableId === t.id);
                    
                    if (orderOfTable) {
                        return { 
                            ...t, 
                            status: TableStatus.Occupied, // Đánh dấu đang phục vụ
                            orderId: orderOfTable.id      // Gắn ID đơn hàng vào bàn
                        };
                    }
                    // Nếu không tìm thấy đơn cho bàn này -> Giữ nguyên hoặc set về Available (tùy logic)
                    return t;
                }));
            }

        } catch (error) {
            console.error("Lỗi khi gọi API thêm món:", error);
            // notify("Thêm món thất bại!", "error");
        }
    };

    // Load tables from API on mount (best-effort)
    useEffect(() => {
        (async () => {
            try {
                const data = await Api.getTables();
                if (Array.isArray(data) && data.length > 0) {
                    const mapped: Table[] = data.map((b: any) => ({
                        id: b.maBan || b.MaBan,
                        name: b.tenBan || b.TenBan,
                        capacity: Number(b.sucChua || b.SucChua) || 0,
                        status: mapTableStatus(b.tenTrangThai || b.TenTrangThai),
                        orderId: null
                    }));
                    setTables(mapped);
                }
            } catch { }
        })();
    }, []);
    // Load categories from API on mount (best-effort)
    useEffect(() => {
        (async () => {
            try {
                const data = await Api.getCategories();
                if (Array.isArray(data)) {
                    const mapped: Category[] = data
                        .map((cat: any) => ({
                            id: cat.maDanhMuc || cat.MaDanhMuc || '',
                            name: cat.tenDanhMuc || cat.TenDanhMuc || ''
                        }))
                        .filter(cat => cat.id && cat.name);
                    if (mapped.length > 0) {
                        setCategories(mapped);
                    }
                }
            } catch (error) {
                console.warn('Không thể tải danh mục từ API', error);
            }
        })();
    }, []);

    // Load menu items from API on mount (best-effort)
    useEffect(() => {
        (async () => {
            try {
                const data = await Api.getDishes();
                if (Array.isArray(data) && data.length > 0) {
                    const mapped: MenuItem[] = data.map((m: any) => {
                        const imgs: string[] = (m.hinhAnhMonAns || m.HinhAnhMonAns || []).map((h: any) => {
                            const url = h.urlHinhAnh || h.URLHinhAnh;
                            return url?.startsWith('http') ? url : `${BASE_URL}/${url}`;
                        });
                        const tenDanhMuc = m.maDanhMucNavigation?.tenDanhMuc || m.MaDanhMucNavigation?.TenDanhMuc || '';
                        
                        // --- ĐOẠN ĐÃ SỬA Ở ĐÂY ---
                        const sizes = (m.phienBanMonAns || m.PhienBanMonAns || []).map((p: any) => ({
                            id: p.maPhienBan || p.MaPhienBan, // <--- ĐÃ THÊM DÒNG NÀY
                            name: p.tenPhienBan || p.TenPhienBan,
                            price: Number(p.gia || p.Gia) || 0,
                            recipe: { id: '', name: '', ingredients: [] }
                        }));
                        // -------------------------

                        return {
                            id: m.maMonAn || m.MaMonAn,
                            name: m.tenMonAn || m.TenMonAn,
                            description: m.moTa || m.MoTa || '',
                            categoryId: m.maDanhMuc || m.MaDanhMuc,
                            category: tenDanhMuc,
                            imageUrls: imgs,
                            inStock: true,
                            sizes
                        } as MenuItem;
                    });
                    setMenuItems(mapped);
                }
            } catch (error) {
                console.warn('Không thể tải món ăn từ API', error);
            }
        })();
    }, []);

    // Load ingredients from API on mount (best-effort)
    // Clear any old localStorage data first
    useEffect(() => {
        // Clear old hardcoded data from localStorage
        localStorage.removeItem('restaurant_ingredients');

        (async () => {
            try {
                const data = await Api.getIngredients();
                if (Array.isArray(data)) {
                    const mapped: Ingredient[] = data
                        .map((ing: any) => {
                            // Lấy đơn vị tính trực tiếp từ API, không map với enum
                            const unitStr = (ing.donViTinh || ing.DonViTinh);
                            if (!unitStr) {
                                // Nếu không có đơn vị tính từ API, bỏ qua nguyên liệu này
                                return null;
                            }

                            const ingredient: Ingredient = {
                                id: ing.maNguyenLieu || ing.MaNguyenLieu || '',
                                name: ing.tenNguyenLieu || ing.TenNguyenLieu || '',
                                unit: unitStr.toString().trim(), // Lấy trực tiếp từ API
                                stock: Number(ing.stock || ing.Stock || ing.soLuongTonKho || ing.SoLuongTonKho || 0),
                            };
                            const minStockVal = Number(ing.minStock || ing.MinStock || 0);
                            if (minStockVal > 0) {
                                ingredient.minStock = minStockVal;
                            }
                            return ingredient;
                        })
                        .filter((ing): ing is Ingredient => {
                            return ing !== null && !!ing.id && !!ing.name && !!ing.unit;
                        });
                    setIngredients(mapped);
                }
            } catch (error) {
                console.warn('Không thể tải nguyên liệu từ API', error);
                // Keep empty array if API fails, no fallback hardcoded data
                setIngredients([]);
            }
        })();
    }, []);

    React.useEffect(() => {
        saveToStorage('restaurant_kdsQueue', kdsQueue);
    }, [kdsQueue]);

    React.useEffect(() => {
        saveToStorage('restaurant_inventoryTransactions', inventoryTransactions);
    }, [inventoryTransactions]);

    const normalizeRoleFromApi = (roleName?: string): Role => {
        if (!roleName) return 'Waiter';
        const value = roleName.toLowerCase();
        if (value.includes('admin')) return 'Admin';
        if (value.includes('quản') || value.includes('manager')) return 'Manager';
        if (value.includes('thu')) return 'Cashier';
        if (value.includes('bếp') || value.includes('kitchen')) return 'Kitchen';
        return 'Waiter';
    };

    const isActiveFromStatus = (status?: string) => {
        if (!status) return true;
        return !status.toLowerCase().includes('nghỉ');
    };

    // Load suppliers from API
    useEffect(() => {
        (async () => {
            try {
                const data = await Api.getSuppliers();
                if (Array.isArray(data)) {
                    const mapped: Supplier[] = data
                        .map((s: any) => {
                            const id = s.maNhaCungCap || s.MaNhaCungCap || '';
                            const name = s.tenNhaCungCap || s.TenNhaCungCap || '';
                            if (!id || !name) return null;
                            return {
                                id,
                                name,
                                phone: s.soDienThoai || s.SoDienThoai || undefined,
                                email: s.email || s.Email || undefined,
                                address: s.diaChi || s.DiaChi || undefined,
                            } as Supplier;
                        })
                        .filter((s): s is Supplier => Boolean(s));
                    setSuppliers(mapped);
                }
            } catch (error) {
                console.warn('Không thể tải nhà cung cấp từ API', error);
            }
        })();
    }, []);

    // Load staff from API
    useEffect(() => {
        (async () => {
            try {
                const data = await Api.getEmployees();
                if (Array.isArray(data)) {
                    const mapped: Staff[] = data
                        .map((emp: any) => {
                            const id = emp.maNhanVien || emp.MaNhanVien || '';
                            const name = emp.hoTen || emp.HoTen || '';
                            const username = emp.tenDangNhap || emp.TenDangNhap || '';
                            if (!id || !name || !username) return null;
                            return {
                                id,
                                name,
                                username,
                                role: normalizeRoleFromApi(emp.vaiTro || emp.VaiTro),
                                active: isActiveFromStatus(emp.trangThai || emp.TrangThai),
                            } as Staff;
                        })
                        .filter((emp): emp is Staff => Boolean(emp));
                    setStaff(mapped);
                }
            } catch (error) {
                console.warn('Không thể tải nhân viên từ API', error);
            }
        })();
    }, []);

    const calculateTotals = (items: OrderItem[], discount: number = 0) => {
        const subtotal = items.reduce((acc, item) => {
            const size = item.menuItem.sizes.find(s => s.name === item.size);
            const price = size ? size.price : 0;
            return acc + (price * item.quantity);
        }, 0);
        const total = subtotal * (1 - discount / 100);
        return { subtotal, total };
    };

    const createOrder = (tableId: string, items: OrderItem[]) => {
        const newOrderId = `o${Date.now()}`;
        const { subtotal, total } = calculateTotals(items);
        const newOrder: Order = {
            id: newOrderId,
            tableId,
            items,
            subtotal,
            total,
            discount: 0,
            createdAt: Date.now(),
        };
        setOrders(prev => [...prev, newOrder]);
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: TableStatus.Occupied, orderId: newOrderId } : t));
    };

    const updateOrder = (orderId: string, items: OrderItem[]) => {
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const { subtotal, total } = calculateTotals(items, o.discount);
                return { ...o, items, subtotal, total };
            }
            return o;
        }));
    };

    const closeOrder = (orderId: string, paymentMethod: PaymentMethod) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, closedAt: Date.now(), paymentMethod } : o));
        const order = orders.find(o => o.id === orderId);
        if (order) {
            setTables(prev => prev.map(t => t.id === order.tableId ? { ...t, status: TableStatus.CleaningNeeded, orderId } : t));
        }
    };

    const updateTableStatus = (tableId: string, status: TableStatus) => {
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, status, orderId: status === TableStatus.Available ? null : t.orderId } : t));
    }

    const getOrderForTable = (tableId: string): Order | undefined => {
        const table = tables.find(t => t.id === tableId);
        if (!table || !table.orderId) return undefined;
        return orders.find(o => o.id === table.orderId && !o.closedAt);
    };

    const sendOrderToKDS = (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        const table = tables.find(t => t.id === order.tableId);
        const kdsItem: KDSItem = {
            id: `k${Date.now()}`,
            orderId: order.id,
            tableName: table ? table.name : order.tableId,
            items: order.items.map(oi => ({ name: oi.menuItem.name, size: oi.size, qty: oi.quantity, notes: oi.notes })),
            createdAt: Date.now(),
            status: 'Queued',
        };
        setKdsQueue(prev => [kdsItem, ...prev]);
        consumeByOrderItems(order.items);
    };

    const generateRecipeId = (): string => {
        const allRecipeIds: string[] = [];
        menuItems.forEach(item => {
            item.sizes.forEach(size => {
                if (size.recipe && size.recipe.id) {
                    allRecipeIds.push(size.recipe.id);
                }
            });
        });
        return generateDailyId(allRecipeIds);
    };

    const addMenuItem = (itemData: Omit<MenuItem, 'id'>) => {
        const newItemId = generateDailyId(menuItems.map(item => item.id));
        const newItem: MenuItem = {
            id: newItemId,
            ...itemData,
        };
        setMenuItems(prev => [...prev, newItem]);
    };

    const updateMenuItem = (updatedItem: MenuItem) => {
        setMenuItems(prev => prev.map(item => (item.id === updatedItem.id ? updatedItem : item)));
    };

    const deleteMenuItem = (itemId: string) => {
        setMenuItems(prev => prev.filter(item => item.id !== itemId));
    };

    // Reservations
    const createReservation = async (data: Omit<Reservation, 'id' | 'status'> & { status?: Reservation['status'] }) => {
        // Map dữ liệu sang DTO backend
        if (!data.time || !data.partySize) return;
        const thoiGian = new Date(data.time).toISOString();
        const payload = {
            MaBan: (data.tableId as string) || '',
            HoTenKhach: data.customerName || '',
            SoDienThoaiKhach: data.phone || '',
            ThoiGianDatHang: thoiGian,
            SoLuongNguoi: data.partySize,
            GhiChu: data.notes || undefined,
            MaNhanVien: undefined,
            TienDatCoc: undefined
        };
        const res = await Api.createReservation(payload);
        // Cập nhật UI tạm thời (optimistic)
        const newId = generateDailyId(reservations.map(r => r.id));
        const newRes: Reservation = { id: newId, status: data.status ?? 'Booked', ...data } as Reservation;
        setReservations(prev => [...prev, newRes]);
        if (res?.donHang?.maDonHang || res?.donHang?.MaDonHang) {
            const maDon = res.donHang.maDonHang || res.donHang.MaDonHang;
            setReservationToOrderMap(prev => ({ ...prev, [newId]: maDon }));
        }
        if (newRes.tableIds && newRes.tableIds.length > 0) {
            setTables(prev => prev.map(t => newRes.tableIds!.includes(t.id) ? { ...t, status: TableStatus.Reserved } : t));
        } else if (newRes.tableId) {
            setTables(prev => prev.map(t => t.id === newRes.tableId ? { ...t, status: TableStatus.Reserved } : t));
        }
    };

    const updateReservation = (res: Reservation) => {
        setReservations(prev => prev.map(r => r.id === res.id ? res : r));
    };

    const cancelReservation = async (id: string) => {
        const res = reservations.find(r => r.id === id);
        // cập nhật trạng thái backend nếu có mapping
        const maDon = reservationToOrderMap[id];
        if (maDon) {
            try { await Api.updateOrderStatus(maDon, 'DA_HUY'); } catch { }
        }
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'Cancelled' } : r));
        // 支持多张桌子：取消预订时将桌子状态改回 Available
        if (res) {
            if (res.tableIds && res.tableIds.length > 0) {
                setTables(prev => prev.map(t => res.tableIds!.includes(t.id) ? { ...t, status: TableStatus.Available } : t));
            } else if (res.tableId) {
                setTables(prev => prev.map(t => t.id === res.tableId ? { ...t, status: TableStatus.Available } : t));
            }
        }
    };

    const confirmArrival = async (id: string) => {
        const res = reservations.find(r => r.id === id);
        if (!res) return;
        const maDon = reservationToOrderMap[id];
        if (maDon) {
            try { await Api.updateOrderStatus(maDon, 'DA_XAC_NHAN'); } catch { }
        }
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'Seated' } : r));
        // 支持多张桌子
        if (res.tableIds && res.tableIds.length > 0) {
            setTables(prev => prev.map(t => res.tableIds!.includes(t.id) ? { ...t, status: TableStatus.Occupied } : t));
        } else if (res.tableId) {
            setTables(prev => prev.map(t => t.id === res.tableId ? { ...t, status: TableStatus.Occupied } : t));
        }
    };

    const markNoShow = async (id: string) => {
        const res = reservations.find(r => r.id === id);
        if (!res) return;
        const maDon = reservationToOrderMap[id];
        if (maDon) {
            try { await Api.updateOrderStatus(maDon, 'NO_SHOW'); } catch { }
        }
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'NoShow' } : r));
        if (res.tableIds && res.tableIds.length > 0) {
            setTables(prev => prev.map(t => res.tableIds!.includes(t.id) ? { ...t, status: TableStatus.Available } : t));
        } else if (res.tableId) {
            setTables(prev => prev.map(t => t.id === res.tableId ? { ...t, status: TableStatus.Available } : t));
        }
    };

    const getAvailableTables = async (dateTime: number, partySize: number) => {
        try {
            const iso = new Date(dateTime).toISOString();
            const data = await Api.getTablesByTime(iso, partySize);
            console.log('API getTablesByTime response:', data);
            const mapped = (data || []).map((x: any) => {
                const result = {
                    id: x.maBan || x.MaBan,
                    name: x.tenBan || x.TenBan,
                    capacity: Number(x.sucChua || x.SucChua) || 0,
                    status: x.tenTrangThai || x.TenTrangThai,
                    maTang: x.maTang || x.MaTang || null,
                    tenTang: x.tenTang || x.TenTang || null
                };
                if (!result.maTang) {
                    console.warn(`Table ${result.name} (${result.id}) has no maTang. Raw data:`, x);
                }
                return result;
            });
            console.log('Mapped tables with tầng:', mapped.slice(0, 5));
            return mapped;
        } catch (error) {
            console.error('Error in getAvailableTables:', error);
            return [];
        }
    };

    // Inventory helpers
    const lowStockIds = () => ingredients.filter(i => typeof i.minStock === 'number' && i.stock <= (i.minStock as number)).map(i => i.id);

    const recordInventoryIn = (items: InventoryTransactionItem[], supplierId?: string, note?: string) => {
        const newId = generateDailyId(inventoryTransactions.map(tx => tx.id));
        const tx: InventoryTransaction = { id: newId, type: 'IN', items, supplierId, createdAt: Date.now(), note };
        setInventoryTransactions(prev => [tx, ...prev]);
        setIngredients(prev => prev.map(ing => {
            const line = items.find(it => it.ingredientId === ing.id);
            return line ? { ...ing, stock: ing.stock + line.quantity } : ing;
        }));
    };

    const adjustInventory = (items: InventoryTransactionItem[], note?: string) => {
        const newId = generateDailyId(inventoryTransactions.map(tx => tx.id));
        const tx: InventoryTransaction = { id: newId, type: 'ADJUST', items, createdAt: Date.now(), note };
        setInventoryTransactions(prev => [tx, ...prev]);
        setIngredients(prev => prev.map(ing => {
            const line = items.find(it => it.ingredientId === ing.id);
            return line ? { ...ing, stock: ing.stock + line.quantity } : ing; // quantity may be negative
        }));
    };

    const consumeByOrderItems = (items: OrderItem[]) => {
        const consumption: Record<string, number> = {};
        items.forEach(oi => {
            const size = oi.menuItem.sizes.find(s => s.name === oi.size);
            if (!size || !size.recipe) return;
            size.recipe.ingredients.forEach(ri => {
                const qty = (consumption[ri.ingredient.id] || 0) + ri.quantity * oi.quantity;
                consumption[ri.ingredient.id] = qty;
            });
        });
        const lines: InventoryTransactionItem[] = Object.entries(consumption).map(([ingredientId, quantity]) => ({ ingredientId, quantity: -quantity }));
        const newId = generateDailyId(inventoryTransactions.map(tx => tx.id));
        const tx: InventoryTransaction = { id: newId, type: 'CONSUME', items: lines, createdAt: Date.now(), note: 'Auto consume by order' };
        setInventoryTransactions(prev => [tx, ...prev]);
        setIngredients(prev => prev.map(ing => {
            const line = lines.find(it => it.ingredientId === ing.id);
            return line ? { ...ing, stock: Math.max(0, ing.stock + line.quantity) } : ing;
        }));
    };

    // Suppliers CRUD
    const addSupplier = (s: Omit<Supplier, 'id'>) => {
        const newId = generateDailyId(suppliers.map(sp => sp.id));
        const sup: Supplier = { id: newId, ...s } as Supplier;
        setSuppliers(prev => [sup, ...prev]);
    };
    const updateSupplier = (s: Supplier) => {
        setSuppliers(prev => prev.map(x => x.id === s.id ? s : x));
    };
    const deleteSupplier = (id: string) => {
        setSuppliers(prev => prev.filter(x => x.id !== id));
    };

    // Tables CRUD
    const addTable = (t: Omit<Table, 'id' | 'status' | 'orderId'>) => {
        const newId = generateDailyId(tables.map(tb => tb.id));
        const table: Table = { id: newId, name: t.name, capacity: t.capacity, status: TableStatus.Available, orderId: null };
        setTables(prev => [...prev, table]);
    };
    const updateTable = (t: Table) => {
        setTables(prev => prev.map(x => x.id === t.id ? t : x));
    };
    const deleteTable = (id: string) => {
        setTables(prev => prev.filter(x => x.id !== id));
    };

    // Staff CRUD
    const addStaff = (s: Omit<Staff, 'id' | 'active'> & { active?: boolean }) => {
        const newId = generateDailyId(staff.map(u => u.id));
        const user: Staff = { id: newId, active: s.active ?? true, ...s } as Staff;
        setStaff(prev => [user, ...prev]);
    };
    const updateStaff = (s: Staff) => {
        setStaff(prev => prev.map(x => x.id === s.id ? s : x));
    };
    const deleteStaff = (id: string) => {
        setStaff(prev => prev.filter(x => x.id !== id));
    };

    return (
        <AppContext.Provider value={{ 
            tables, orders, menuItems, categories, 
            ingredients, reservations, suppliers, 
            kdsQueue, inventoryTransactions, staff, 
            setOrders,
            createOrder, updateOrder, closeOrder, 
            updateTableStatus, getOrderForTable, sendOrderToKDS, 
            addMenuItem, updateMenuItem, deleteMenuItem, 
            generateRecipeId, createReservation, updateReservation, 
            cancelReservation, confirmArrival, markNoShow, getAvailableTables, 
            recordInventoryIn, adjustInventory, consumeByOrderItems, 
            lowStockIds, addSupplier, updateSupplier, deleteSupplier,
             addTable, updateTable, deleteTable, 
             addStaff, updateStaff, deleteStaff,
             addItemsToTableOrder,
              }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};


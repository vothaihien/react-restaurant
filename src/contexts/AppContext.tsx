import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import type {
  Table,
  Order,
  MenuItem,
  OrderItem,
  Ingredient,
  Reservation,
  Supplier,
  KDSItem,
  InventoryTransaction,
  InventoryTransactionItem,
  Staff,
  Category,
  Role,
} from "@/types";
import { TableStatus, PaymentMethod } from "@/types";
import { BASE_URL } from "@/utils/api";
// Import Services đã sửa đổi (dùng axiosClient)
import { inventoryApi } from "@/api/inventory";
import { suppliersApi } from "@/api/other";
import { employeesApi } from "@/api/employees";
import { reservationsApi } from "@/api/reservations";
import { orderService } from "@/services/orderService";
import { employeeService } from "@/services/employeeService";
import { tableService } from "@/services/tableService";
import dishService from "@/services/dishService";
// Import StorageKeys để check token
import { StorageKeys } from "@/constants/StorageKeys";

// Helper để tạo ID tạm (nếu cần cho optimistic update)
const generateDailyId = (existingIds: string[]): string => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  const datePrefix = `${day}${month}${year}`;

  const todaysIds = existingIds.filter((id) => id.startsWith(datePrefix));
  const nextSeq = todaysIds.length + 1;
  const seqStr = String(nextSeq).padStart(3, "0");

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

  addMenuItem: (itemData: Omit<MenuItem, "id">) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (itemId: string) => void;
  generateRecipeId: () => string;

  // Reservations
  createReservation: (
    data: Omit<Reservation, "id" | "status"> & {
      status?: Reservation["status"];
    }
  ) => void;
  updateReservation: (res: Reservation) => void;
  cancelReservation: (id: string, reason?: string) => void;
  confirmArrival: (id: string) => void;
  markNoShow: (id: string, reason?: string) => void;
  getAvailableTables: (
    dateTime: number,
    partySize: number
  ) => Promise<
    Array<{ id: string; name: string; capacity: number; status: string }>
  >;

  // Inventory & Procurement
  recordInventoryIn: (
    items: InventoryTransactionItem[],
    supplierId?: string,
    note?: string
  ) => void;
  adjustInventory: (items: InventoryTransactionItem[], note?: string) => void;
  consumeByOrderItems: (items: OrderItem[]) => void;
  lowStockIds: () => string[];

  // Suppliers
  addSupplier: (s: Omit<Supplier, "id">) => void;
  updateSupplier: (s: Supplier) => void;
  deleteSupplier: (id: string) => void;

  // Tables CRUD
  addTable: (t: Omit<Table, "id" | "status" | "orderId">) => void;
  updateTable: (t: Table) => void;
  deleteTable: (id: string) => void;

  // Staff CRUD
  addStaff: (s: Omit<Staff, "id" | "active"> & { active?: boolean }) => void;
  updateStaff: (s: Staff) => void;
  deleteStaff: (id: string) => void;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // --- KHỞI TẠO STATE RỖNG (Không load từ LocalStorage nữa) ---
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [kdsQueue, setKdsQueue] = useState<KDSItem[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<
    InventoryTransaction[]
  >([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [reservationToOrderMap, setReservationToOrderMap] = useState<
    Record<string, string>
  >({});

  // Helper function to map Vietnamese status strings to TableStatus enum
  const mapTableStatus = (tenTrangThai: string | undefined): TableStatus => {
    if (!tenTrangThai) return TableStatus.Empty;
    const statusLower = tenTrangThai.toLowerCase().trim();
    if (
      statusLower.includes("trống") ||
      statusLower.includes("available") ||
      statusLower.includes("sẵn sàng")
    ) {
      return TableStatus.Empty;
    }
    if (
      statusLower.includes("đang sử dụng") ||
      statusLower.includes("occupied") ||
      statusLower.includes("đang dùng")
    ) {
      return TableStatus.Occupied;
    }
    if (
      statusLower.includes("đã đặt") ||
      statusLower.includes("reserved") ||
      statusLower.includes("đặt trước")
    ) {
      return TableStatus.Reserved;
    }
    if (
      statusLower.includes("dọn") ||
      statusLower.includes("cleaning") ||
      statusLower.includes("bảo trì")
    ) {
      return TableStatus.Maintenance;
    }
    return TableStatus.Empty; // Default
  };

  const normalizeRoleFromApi = (roleName?: string): Role => {
    if (!roleName) return "Waiter";
    const value = roleName.toLowerCase();
    if (value.includes("admin")) return "Admin";
    if (value.includes("quản") || value.includes("manager")) return "Manager";
    if (value.includes("thu")) return "Cashier";
    if (value.includes("bếp") || value.includes("kitchen")) return "Kitchen";
    return "Waiter";
  };

  const isActiveFromStatus = (status?: string) => {
    if (!status) return true;
    return !status.toLowerCase().includes("nghỉ");
  };

  // --- USE EFFECT LOAD DỮ LIỆU (Đã thêm Token Check) ---

  // 1. Load Active Orders & Tables Status
  useEffect(() => {
    (async () => {
      // CHỐT CHẶN: Không có token thì dừng, tránh vòng lặp Login
      const token = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
      if (!token) return;

      try {
        const data = await orderService.getActiveOrders();

        if (Array.isArray(data) && data.length > 0) {
          // Map Order
          const mappedOrders: Order[] = data.map((d: any) => {
            let localItems: any[] = [];
            if (Array.isArray(d.chiTietDonHang)) {
              localItems = d.chiTietDonHang.map((ct: any) => ({
                id: ct.maMonAn,
                menuItemId: ct.maMonAn,
                quantity: ct.soLuong,
                notes: ct.ghiChu || "",
                price: ct.donGia || 0,
              }));
            }
            return {
              id: d.maDonHang,
              tableId:
                d.listMaBan && d.listMaBan.length > 0 ? d.listMaBan[0] : "",
              items: [...localItems],
              subtotal: d.tongTien || 0,
              total: d.tongTien || 0,
              discount: 0,
              createdAt: new Date(d.thoiGianNhanBan).getTime(),
              status: "active",
            };
          });

          setOrders(mappedOrders);

          // Cập nhật trạng thái bàn dựa trên đơn hàng
          setTables((prevTables) =>
            prevTables.map((t) => {
              const rawOrderData = data.find(
                (d: any) => d.listMaBan && d.listMaBan.includes(t.id)
              );
              if (rawOrderData) {
                return {
                  ...t,
                  status: TableStatus.Occupied,
                  orderId: rawOrderData.maDonHang,
                };
              }
              return t;
            })
          );
        }
      } catch (error) {
        console.warn("Lỗi tải đơn hàng:", error);
      }
    })();
  }, []);

  // 2. Load Tables
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
      if (!token) return;

      try {
        const data = await tableService.getTables();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: Table[] = data.map((b: any) => ({
            id: b.maBan || b.MaBan,
            name: b.tenBan || b.TenBan,
            capacity: Number(b.sucChua || b.SucChua) || 0,
            status: mapTableStatus(b.tenTrangThai || b.TenTrangThai),
            maTang: b.maTang || b.MaTang || "",
            orderId: null,
          }));
          setTables(mapped);
        }
      } catch {}
    })();
  }, []);

  // 3. Load Categories
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
      if (!token) return;

      try {
        const data = await dishService.getCategories();
        if (Array.isArray(data)) {
          const mapped: Category[] = data
            .map((cat: any) => ({
              id: cat.maDanhMuc || cat.MaDanhMuc || "",
              name: cat.tenDanhMuc || cat.TenDanhMuc || "",
            }))
            .filter((cat) => cat.id && cat.name);
          if (mapped.length > 0) {
            setCategories(mapped);
          }
        }
      } catch (error) {
        console.warn("Không thể tải danh mục từ API", error);
      }
    })();
  }, []);

  // 4. Load Menu Items
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
      if (!token) return;

      try {
        const data = await dishService.getDishes();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: MenuItem[] = data.map((m: any) => {
            const imgs: string[] = (
              m.hinhAnhMonAns ||
              m.HinhAnhMonAns ||
              []
            ).map((h: any) => {
              const url = h.urlHinhAnh || h.URLHinhAnh;
              return url?.startsWith("http") ? url : `${BASE_URL}/${url}`;
            });
            const tenDanhMuc =
              m.maDanhMucNavigation?.tenDanhMuc ||
              m.MaDanhMucNavigation?.TenDanhMuc ||
              "";

            const sizes = (m.phienBanMonAns || m.PhienBanMonAns || []).map(
              (p: any) => ({
                id: p.maPhienBan || p.MaPhienBan,
                name: p.tenPhienBan || p.TenPhienBan,
                price: Number(p.gia || p.Gia) || 0,
                recipe: { id: "", name: "", ingredients: [] },
              })
            );

            return {
              id: m.maMonAn || m.MaMonAn,
              name: m.tenMonAn || m.TenMonAn,
              description: m.moTa || m.MoTa || "",
              categoryId: m.maDanhMuc || m.MaDanhMuc,
              category: tenDanhMuc,
              imageUrls: imgs,
              inStock: true,
              sizes,
            } as MenuItem;
          });
          setMenuItems(mapped);
        }
      } catch (error) {
        console.warn("Không thể tải món ăn từ API", error);
      }
    })();
  }, []);

  // 5. Load Ingredients
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
      if (!token) return;

      try {
        const data = await inventoryApi.getIngredients();
        if (Array.isArray(data)) {
          const mapped: Ingredient[] = data
            .map((ing: any) => {
              const unitStr = ing.donViTinh || ing.DonViTinh;
              if (!unitStr) return null;

              const ingredient: Ingredient = {
                id: ing.maNguyenLieu || ing.MaNguyenLieu || "",
                name: ing.tenNguyenLieu || ing.TenNguyenLieu || "",
                unit: unitStr.toString().trim(),
                stock: Number(
                  ing.stock ||
                    ing.Stock ||
                    ing.soLuongTonKho ||
                    ing.SoLuongTonKho ||
                    0
                ),
                price: Number(ing.giaBan || ing.GiaBan || 0) || undefined,
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
        console.warn("Không thể tải nguyên liệu từ API", error);
        setIngredients([]);
      }
    })();
  }, []);

  // 6. Load Suppliers
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
      if (!token) return;

      try {
        const data = await suppliersApi.getSuppliers();
        if (Array.isArray(data)) {
          const mapped: Supplier[] = data
            .map((s: any) => {
              const id = s.maNhaCungCap || s.MaNhaCungCap || "";
              const name = s.tenNhaCungCap || s.TenNhaCungCap || "";
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
        console.warn("Không thể tải nhà cung cấp từ API", error);
      }
    })();
  }, []);

  // 7. Load Staff
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
      if (!token) return;

      try {
        const data = await employeeService.getEmployees();
        if (Array.isArray(data)) {
          const mapped: Staff[] = data
            .map((emp: any) => {
              const id = emp.maNhanVien || emp.MaNhanVien || "";
              const name = emp.hoTen || emp.HoTen || "";
              const username = emp.tenDangNhap || emp.TenDangNhap || "";
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
        console.warn("Không thể tải nhân viên từ API", error);
      }
    })();
  }, []);

  // --- HELPER FUNCTIONS (Logic Frontend) ---

  const calculateTotals = (items: OrderItem[], discount: number = 0) => {
    const subtotal = items.reduce((acc, item) => {
      const size = item.menuItem.sizes.find((s) => s.name === item.size);
      const price = size ? size.price : 0;
      return acc + price * item.quantity;
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
    setOrders((prev) => [...prev, newOrder]);
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, status: TableStatus.Occupied, orderId: newOrderId }
          : t
      )
    );
  };

  const updateOrder = (orderId: string, items: OrderItem[]) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const { subtotal, total } = calculateTotals(items, o.discount);
          return { ...o, items, subtotal, total };
        }
        return o;
      })
    );
  };

  const closeOrder = (orderId: string, paymentMethod: PaymentMethod) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, closedAt: Date.now(), paymentMethod } : o
      )
    );
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === order.tableId
            ? { ...t, status: TableStatus.Maintenance, orderId }
            : t
        )
      );
    }
  };

  const updateTableStatus = (tableId: string, status: TableStatus) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status,
              orderId: status === TableStatus.Empty ? null : t.orderId,
            }
          : t
      )
    );
  };

  const getOrderForTable = (tableId: string): Order | undefined => {
    const table = tables.find((t) => t.id === tableId);
    if (!table || !table.orderId) return undefined;
    return orders.find((o) => o.id === table.orderId && !o.closedAt);
  };

  const addItemsToTableOrder = async (tableId: string, items: OrderItem[]) => {
    // BƯỚC 1: Thử lấy ID đơn hàng từ State hiện tại (như cũ)
    let currentOrderId = getOrderForTable(tableId)?.id;

    // BƯỚC 2: [FIX MỚI] Nếu State chưa có, gọi API kiểm tra "nóng" từ Server
    if (!currentOrderId) {
        try {
            console.log(`State chưa đồng bộ, đang tìm đơn hàng active cho bàn ${tableId} từ Server...`);
            // Gọi lại API lấy danh sách đơn đang active
            const latestOrdersData = await orderService.getActiveOrders();
            
            // Tìm xem có đơn nào đang chứa tableId này không
            const foundOrder = latestOrdersData.find((d: any) => d.listMaBan && d.listMaBan.includes(tableId));
            
            if (foundOrder) {
                currentOrderId = foundOrder.maDonHang;
                console.log("--> Đã tìm thấy đơn hàng từ Server:", currentOrderId);
            }
        } catch (err) {
            console.error("Lỗi khi cố gắng đồng bộ lại đơn hàng:", err);
        }
    }

    // BƯỚC 3: Nếu sau khi tìm server vẫn không thấy thì mới báo lỗi
    if (!currentOrderId) {
      console.error(
        `Bàn ${tableId} chưa có đơn hàng (Check-in). Vui lòng tạo đơn trước.`
      );
      // Có thể thêm alert("Bàn chưa check-in!") ở đây nếu muốn
      return;
    }

    const payload = {
      // Sửa maDonHang -> MaDonHang
      MaDonHang: currentOrderId, 
      
      // Sửa maBan -> MaBan
      MaBan: tableId,
      
      // Sửa items -> Items
      Items: items.map((i) => {
        // Logic tìm sizeId
        const sizeId = i.menuItem.sizes.find((s) => s.name === i.size)?.id;

        return {
          // Sửa maMonAn -> MaMonAn
          MaMonAn: i.menuItem.id,
          
          // Sửa maPhienBan -> MaPhienBan & Xử lý Null
          // Backend C# sẽ lỗi nếu nhận chuỗi rỗng "", phải gửi null
          MaPhienBan: sizeId || null, 
          
          // Sửa soLuong -> SoLuong
          SoLuong: i.quantity,
          
          // Sửa ghiChu -> GhiChu
          GhiChu: i.notes || "",
        };
      }),
    };

    try {
      console.log("Payload gửi đi:", payload);
      await orderService.addItemsToTable(payload);
      console.log("Đã thêm món thành công vào đơn:", currentOrderId);

      // Gọi lại API để cập nhật UI (Giữ nguyên logic cũ của bạn để refresh lại giao diện)
      const latestData = await orderService.getActiveOrders();
      if (Array.isArray(latestData)) {
        const mappedOrders: Order[] = latestData.map((d: any) => ({
          id: d.maDonHang,
          tableId: d.listMaBan && d.listMaBan.length > 0 ? d.listMaBan[0] : "",
          items: [], 
          subtotal: d.tongTien || 0,
          total: d.tongTien || 0,
          discount: 0,
          createdAt: new Date(d.thoiGianNhanBan).getTime(),
          status: "active",
        }));
        setOrders(mappedOrders);
        setTables((prevTables) =>
          prevTables.map((t) => {
            const orderOfTable = mappedOrders.find((o) => o.tableId === t.id);
            if (orderOfTable) {
              return {
                ...t,
                status: TableStatus.Occupied,
                orderId: orderOfTable.id,
              };
            }
            return t;
          })
        );
      }
    } catch (error) {
      console.error("Lỗi khi gọi API thêm món:", error);
    }
  };

  const sendOrderToKDS = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const table = tables.find((t) => t.id === order.tableId);
    const kdsItem: KDSItem = {
      id: `k${Date.now()}`,
      orderId: order.id,
      tableName: table ? table.name : order.tableId,
      items: order.items.map((oi) => ({
        name: oi.menuItem.name,
        size: oi.size,
        qty: oi.quantity,
        notes: oi.notes,
      })),
      createdAt: Date.now(),
      status: "Queued",
    };
    setKdsQueue((prev) => [kdsItem, ...prev]);
    consumeByOrderItems(order.items);
  };

  const generateRecipeId = (): string => {
    const allRecipeIds: string[] = [];
    menuItems.forEach((item) => {
      item.sizes.forEach((size) => {
        if (size.recipe && size.recipe.id) {
          allRecipeIds.push(size.recipe.id);
        }
      });
    });
    return generateDailyId(allRecipeIds);
  };

  const addMenuItem = (itemData: Omit<MenuItem, "id">) => {
    const newItemId = generateDailyId(menuItems.map((item) => item.id));
    const newItem: MenuItem = {
      id: newItemId,
      ...itemData,
    };
    setMenuItems((prev) => [...prev, newItem]);
  };

  const updateMenuItem = (updatedItem: MenuItem) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  const deleteMenuItem = (itemId: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Reservations
  const createReservation = async (
    data: Omit<Reservation, "id" | "status"> & {
      status?: Reservation["status"];
    }
  ) => {
    if (!data.time || !data.partySize) return;
    const thoiGian = new Date(data.time).toISOString();

    const danhSachMaBan: string[] = [];
    if (data.tableIds && data.tableIds.length > 0) {
      danhSachMaBan.push(...data.tableIds);
    } else if (data.tableId) {
      danhSachMaBan.push(data.tableId);
    }

    if (danhSachMaBan.length === 0) {
      console.warn("createReservation: Không có bàn nào được chọn");
      return;
    }

    const payload = {
      DanhSachMaBan: danhSachMaBan,
      HoTenKhach: data.customerName || "",
      SoDienThoaiKhach: data.phone || "",
      ThoiGianDatHang: thoiGian,
      SoLuongNguoi: data.partySize,
      GhiChu: data.notes || undefined,
      MaNhanVien: undefined,
      TienDatCoc: undefined,
      MaKhachHang: data.customerId || undefined,
      Email: data.email || undefined,
    };
    const res = await reservationsApi.createReservation(payload);
    const newId = generateDailyId(reservations.map((r) => r.id));
    const newRes: Reservation = {
      id: newId,
      status: data.status ?? "Booked",
      ...data,
    } as Reservation;
    setReservations((prev) => [...prev, newRes]);
    if (res?.donHang?.maDonHang || res?.donHang?.MaDonHang) {
      const maDon = res.donHang.maDonHang || res.donHang.MaDonHang;
      setReservationToOrderMap((prev) => ({ ...prev, [newId]: maDon }));
    }
    if (newRes.tableIds && newRes.tableIds.length > 0) {
      setTables((prev) =>
        prev.map((t) =>
          newRes.tableIds!.includes(t.id)
            ? { ...t, status: TableStatus.Reserved }
            : t
        )
      );
    } else if (newRes.tableId) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === newRes.tableId ? { ...t, status: TableStatus.Reserved } : t
        )
      );
    }
  };

  const updateReservation = (res: Reservation) => {
    setReservations((prev) => prev.map((r) => (r.id === res.id ? res : r)));
  };

  const cancelReservation = async (id: string) => {
    const res = reservations.find((r) => r.id === id);
    const maDon = reservationToOrderMap[id];
    if (maDon) {
      try {
        await orderService.updateOrderStatus(maDon, "DA_HUY");
      } catch {}
    }
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Cancelled" } : r))
    );
    if (res) {
      if (res.tableIds && res.tableIds.length > 0) {
        setTables((prev) =>
          prev.map((t) =>
            res.tableIds!.includes(t.id)
              ? { ...t, status: TableStatus.Empty }
              : t
          )
        );
      } else if (res.tableId) {
        setTables((prev) =>
          prev.map((t) =>
            t.id === res.tableId ? { ...t, status: TableStatus.Empty } : t
          )
        );
      }
    }
  };

  const confirmArrival = async (id: string) => {
    const res = reservations.find((r) => r.id === id);
    if (!res) return;
    const maDon = reservationToOrderMap[id];
    if (maDon) {
      try {
        await reservationsApi.updateOrderStatus(maDon, "DA_XAC_NHAN");
      } catch {}
    }
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Seated" } : r))
    );
    if (res.tableIds && res.tableIds.length > 0) {
      setTables((prev) =>
        prev.map((t) =>
          res.tableIds!.includes(t.id)
            ? { ...t, status: TableStatus.Occupied }
            : t
        )
      );
    } else if (res.tableId) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === res.tableId ? { ...t, status: TableStatus.Occupied } : t
        )
      );
    }
  };

  const markNoShow = async (id: string) => {
    const res = reservations.find((r) => r.id === id);
    if (!res) return;
    const maDon = reservationToOrderMap[id];
    if (maDon) {
      try {
        await orderService.updateOrderStatus(maDon, "NO_SHOW");
      } catch {}
    }
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "NoShow" } : r))
    );
    if (res.tableIds && res.tableIds.length > 0) {
      setTables((prev) =>
        prev.map((t) =>
          res.tableIds!.includes(t.id) ? { ...t, status: TableStatus.Empty } : t
        )
      );
    } else if (res.tableId) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === res.tableId ? { ...t, status: TableStatus.Empty } : t
        )
      );
    }
  };

  const getAvailableTables = async (dateTime: number, partySize: number) => {
    try {
      const iso = new Date(dateTime).toISOString();
      const data = await tableService.getTablesByTime(iso, partySize);
      const mapped = (data || []).map((x: any) => {
        const result = {
          id: x.maBan || x.MaBan,
          name: x.tenBan || x.TenBan,
          capacity: Number(x.sucChua || x.SucChua) || 0,
          status: x.tenTrangThai || x.TenTrangThai,
          maTang: x.maTang || x.MaTang || null,
          tenTang: x.tenTang || x.TenTang || null,
        };
        return result;
      });
      return mapped;
    } catch (error) {
      console.error("Error in getAvailableTables:", error);
      return [];
    }
  };

  const lowStockIds = () =>
    ingredients
      .filter(
        (i) =>
          typeof i.minStock === "number" && i.stock <= (i.minStock as number)
      )
      .map((i) => i.id);

  const recordInventoryIn = (
    items: InventoryTransactionItem[],
    supplierId?: string,
    note?: string
  ) => {
    const newId = generateDailyId(inventoryTransactions.map((tx) => tx.id));
    const tx: InventoryTransaction = {
      id: newId,
      type: "IN",
      items,
      supplierId,
      createdAt: Date.now(),
      note,
    };
    setInventoryTransactions((prev) => [tx, ...prev]);
    setIngredients((prev) =>
      prev.map((ing) => {
        const line = items.find((it) => it.ingredientId === ing.id);
        return line ? { ...ing, stock: ing.stock + line.quantity } : ing;
      })
    );
  };

  const adjustInventory = (
    items: InventoryTransactionItem[],
    note?: string
  ) => {
    const newId = generateDailyId(inventoryTransactions.map((tx) => tx.id));
    const tx: InventoryTransaction = {
      id: newId,
      type: "ADJUST",
      items,
      createdAt: Date.now(),
      note,
    };
    setInventoryTransactions((prev) => [tx, ...prev]);
    setIngredients((prev) =>
      prev.map((ing) => {
        const line = items.find((it) => it.ingredientId === ing.id);
        return line ? { ...ing, stock: ing.stock + line.quantity } : ing;
      })
    );
  };

  const consumeByOrderItems = (items: OrderItem[]) => {
    const consumption: Record<string, number> = {};
    items.forEach((oi) => {
      const size = oi.menuItem.sizes.find((s) => s.name === oi.size);
      if (!size || !size.recipe) return;
      size.recipe.ingredients.forEach((ri: any) => {
        const qty =
          (consumption[ri.ingredient.id] || 0) + ri.quantity * oi.quantity;
        consumption[ri.ingredient.id] = qty;
      });
    });
    const lines: InventoryTransactionItem[] = Object.entries(consumption).map(
      ([ingredientId, quantity]) => ({ ingredientId, quantity: -quantity })
    );
    const newId = generateDailyId(inventoryTransactions.map((tx) => tx.id));
    const tx: InventoryTransaction = {
      id: newId,
      type: "CONSUME",
      items: lines,
      createdAt: Date.now(),
      note: "Auto consume by order",
    };
    setInventoryTransactions((prev) => [tx, ...prev]);
    setIngredients((prev) =>
      prev.map((ing) => {
        const line = lines.find((it) => it.ingredientId === ing.id);
        return line
          ? { ...ing, stock: Math.max(0, ing.stock + line.quantity) }
          : ing;
      })
    );
  };

  const addSupplier = (s: Omit<Supplier, "id">) => {
    const newId = generateDailyId(suppliers.map((sp) => sp.id));
    const sup: Supplier = { id: newId, ...s } as Supplier;
    setSuppliers((prev) => [sup, ...prev]);
  };
  const updateSupplier = (s: Supplier) => {
    setSuppliers((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  };
  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((x) => x.id !== id));
  };

  const addTable = (t: Omit<Table, "id" | "status" | "orderId">) => {
    const newId = generateDailyId(tables.map((tb) => tb.id));
    const table: Table = {
      id: newId,
      name: t.name,
      capacity: t.capacity,
      status: TableStatus.Empty,
      orderId: null,
      maTang: t.maTang,
    };
    setTables((prev) => [...prev, table]);
  };
  const updateTable = (t: Table) => {
    setTables((prev) => prev.map((x) => (x.id === t.id ? t : x)));
  };
  const deleteTable = (id: string) => {
    setTables((prev) => prev.filter((x) => x.id !== id));
  };

  const addStaff = (s: Omit<Staff, "id" | "active"> & { active?: boolean }) => {
    const newId = generateDailyId(staff.map((u) => u.id));
    const user: Staff = { id: newId, active: s.active ?? true, ...s } as Staff;
    setStaff((prev) => [user, ...prev]);
  };
  const updateStaff = (s: Staff) => {
    setStaff((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  };
  const deleteStaff = (id: string) => {
    setStaff((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        tables,
        orders,
        menuItems,
        categories,
        ingredients,
        reservations,
        suppliers,
        kdsQueue,
        inventoryTransactions,
        staff,
        setOrders,
        createOrder,
        updateOrder,
        closeOrder,
        updateTableStatus,
        getOrderForTable,
        sendOrderToKDS,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        generateRecipeId,
        createReservation,
        updateReservation,
        cancelReservation,
        confirmArrival,
        markNoShow,
        getAvailableTables,
        recordInventoryIn,
        adjustInventory,
        consumeByOrderItems,
        lowStockIds,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addTable,
        updateTable,
        deleteTable,
        addStaff,
        updateStaff,
        deleteStaff,
        addItemsToTableOrder,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

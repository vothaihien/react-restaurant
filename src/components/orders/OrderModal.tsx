import React, { useState, useEffect, useMemo } from "react";
import type { MenuItem, MenuItemSize } from "@/types/menu";
import { useAppContext } from "@/contexts/AppContext";
import { XIcon, TrashIcon, PlusIcon } from "@/components/icons"; 
import MenuItemCard from "@/components/menu/MenuItemCard";
import { formatVND } from "@/utils";
import { useFeedback } from "@/contexts/FeedbackContext";
import { donHangService } from "@/services/donHangService";

// Interface mở rộng cho món ăn trong giỏ hàng
interface ExtendedOrderItem {
  menuItem: MenuItem;
  quantity: number;
  size: string;
  notes: string;
  isConfirmed: boolean; // true = Món cũ (đã lưu), false = Món mới (chưa lưu)
  maPhienBan?: string;  // ID của size (dùng để gửi API)
  fixedPrice?: number;  // Lưu giá cố định của món cũ
}

interface OrderModalProps {
  maDonHang: string; 
  tenDonHang?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const OrderModal: React.FC<OrderModalProps> = ({
  maDonHang,
  tenDonHang,
  onClose,
  onSuccess,
}) => {
  const { menuItems, categories } = useAppContext() as any;
  const { notify } = useFeedback();

  const [currentOrderItems, setCurrentOrderItems] = useState<ExtendedOrderItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // --- 1. TẢI CHI TIẾT ĐƠN HÀNG (ĐỂ HIỆN MÓN CŨ) ---
  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!maDonHang) return;
      
      setLoadingData(true);
      try {
        // Gọi API lấy chi tiết đơn hàng
        const data = await donHangService.getMyBookingDetail({ maDonHang });

        if (data && data.monAns) {
          // Map dữ liệu từ API sang định dạng Frontend
          const confirmedItems: ExtendedOrderItem[] = data.monAns.map((m: any) => {
            // QUAN TRỌNG: Tìm lại thông tin món trong Menu Context để lấy sizes đầy đủ
            const originalItem = menuItems.find((mi: MenuItem) => mi.name === m.tenMon);
            
            // Nếu không tìm thấy món trong menu (món đã xóa), tạo dummy item
            const menuItemData = originalItem || {
                id: "unknown",
                name: m.tenMon,
                description: "",
                category: "",
                imageUrls: m.hinhAnh ? [m.hinhAnh] : [],
                inStock: true,
                sizes: [] // Món cũ thì không cần size list để chọn lại
            };

            return {
              menuItem: menuItemData as MenuItem, 
              quantity: m.soLuong,
              size: m.tenPhienBan,
              notes: m.ghiChu || "",
              isConfirmed: true, // Đánh dấu là đã lưu
              maPhienBan: "",    // Món cũ không cần ID phiên bản để gửi lại
              fixedPrice: m.donGia // LƯU GIÁ VÀO ĐÂY
            };
          });

          setCurrentOrderItems(confirmedItems);
        }
      } catch (error) {
        console.error("Lỗi tải chi tiết món:", error);
        notify({ tone: "error", title: "Lỗi", description: "Không tải được danh sách món đã gọi." });
      } finally {
        setLoadingData(false);
      }
    };

    if (menuItems.length > 0) {
        loadOrderDetails();
    }
  }, [maDonHang, menuItems]);

  // --- 2. LOGIC THÊM MÓN ---
  const addToOrder = (menuItem: MenuItem, size: MenuItemSize) => {
    // Tìm xem món này đã có trong danh sách MỚI (chưa khóa) chưa?
    const existingIndex = currentOrderItems.findIndex(
      (item) =>
        item.menuItem.id === menuItem.id &&
        item.size === size.name &&
        !item.isConfirmed // Chỉ cộng dồn vào món MỚI
    );

    if (existingIndex !== -1) {
      // Cộng dồn số lượng
      const newItems = [...currentOrderItems];
      newItems[existingIndex].quantity += 1;
      setCurrentOrderItems(newItems);
    } else {
      // Thêm dòng mới
      setCurrentOrderItems([
        ...currentOrderItems, 
        {
          menuItem,
          quantity: 1,
          notes: "",
          size: size.name,
          maPhienBan: size.id,
          isConfirmed: false, // Đánh dấu là MỚI
          // Không cần fixedPrice cho món mới, sẽ lấy từ size
        },
      ]);
    }
  };

  const removeFromOrder = (index: number) => {
    if (!currentOrderItems[index].isConfirmed) {
      const newItems = [...currentOrderItems];
      newItems.splice(index, 1);
      setCurrentOrderItems(newItems);
    }
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (currentOrderItems[index].isConfirmed) return;

    if (quantity <= 0) {
      removeFromOrder(index);
    } else {
      const newItems = [...currentOrderItems];
      newItems[index].quantity = quantity;
      setCurrentOrderItems(newItems);
    }
  };

  const updateNotes = (index: number, notes: string) => {
    if (currentOrderItems[index].isConfirmed) return;

    const newItems = [...currentOrderItems];
    newItems[index].notes = notes;
    setCurrentOrderItems(newItems);
  };

  // --- 3. LOGIC LƯU ---
  const handleSaveOrder = async () => {
    const newItemsToSend = currentOrderItems.filter((item) => !item.isConfirmed);

    if (newItemsToSend.length === 0) {
      onClose();
      return;
    }

    setSubmitting(true);
    try {
        const payload = {
            maDonHang: maDonHang,
            items: newItemsToSend.map(item => ({
                maMonAn: item.menuItem.id,
                maPhienBan: item.maPhienBan || "",
                soLuong: item.quantity,
                ghiChu: item.notes
            }))
        };

        await donHangService.addItemsToOrder(payload);
        
        notify({
            tone: "success",
            title: "Thành công",
            description: `Đã thêm ${newItemsToSend.length} món vào đơn.`,
        });
        
        onSuccess();
        onClose();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Không thể lưu món ăn.";
      notify({ tone: "error", title: "Lỗi", description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Tính tổng tiền (Sửa logic lấy giá)
  const subtotal = currentOrderItems.reduce((acc, item) => {
    let price = 0;
    if (item.isConfirmed) {
        // Món cũ: Lấy từ fixedPrice đã map từ API
        price = item.fixedPrice || 0;
    } else {
        // Món mới: Lấy từ thông tin Size trong Menu (item.menuItem.sizes)
        // Cần tìm size object khớp với tên size đã chọn
        if (item.menuItem.sizes && item.menuItem.sizes.length > 0) {
             const sizeObj = item.menuItem.sizes.find((s) => s.name === item.size);
             price = sizeObj ? sizeObj.price : 0;
        }
    }
    return acc + price * item.quantity;
  }, 0);

  const filteredMenuItems = useMemo(() => {
    if (selectedCategoryId === "ALL") return menuItems;
    return menuItems.filter(
      (item: MenuItem) => item.categoryId === selectedCategoryId
    );
  }, [selectedCategoryId, menuItems]);

  const hasNewItems = currentOrderItems.some((i) => !i.isConfirmed);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
             <h2 className="text-xl font-bold text-gray-900">Gọi Món</h2>
             {tenDonHang && <p className="text-sm text-indigo-600 font-medium">{tenDonHang}</p>}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 transition">
            <XIcon className="w-8 h-8" />
          </button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT SIDE: MENU LIST */}
          <div className="w-3/5 p-4 overflow-y-auto border-r border-gray-200 bg-gray-50/30">
            <div className="mb-4 sticky top-0 z-10 bg-white/90 backdrop-blur py-2 border-b border-gray-100">
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                <button
                  onClick={() => setSelectedCategoryId("ALL")}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                    selectedCategoryId === "ALL"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  Tất cả
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                      selectedCategoryId === cat.id
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
              {filteredMenuItems.map((item: MenuItem) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onSelect={(size) => addToOrder(item, size)}
                />
              ))}
            </div>
          </div>

          {/* RIGHT SIDE: CURRENT ORDER LIST */}
          <div className="w-2/5 p-4 flex flex-col bg-white">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                 <h3 className="text-lg font-bold text-gray-800">Danh sách món</h3>
                 <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {currentOrderItems.length} món
                 </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {loadingData ? (
                  <div className="text-center text-gray-500 mt-10">Đang tải món đã gọi...</div>
              ) : currentOrderItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                    <PlusIcon className="w-12 h-12 mb-2" />
                    <p>Chưa có món nào</p>
                    <p className="text-sm">Chọn món từ thực đơn bên trái</p>
                </div>
              ) : (
                currentOrderItems.map((item, i) => {
                    // Tính giá hiển thị cho từng dòng
                    let displayPrice = 0;
                    if (item.isConfirmed) {
                        displayPrice = item.fixedPrice || 0; // Món cũ: Lấy giá cũ
                    } else {
                        // Món mới: Lấy từ menu items
                        const s = item.menuItem.sizes.find(x => x.name === item.size);
                        displayPrice = s ? s.price : 0; 
                    }

                    return (
                      <div
                        key={i}
                        className={`rounded-xl p-3 border transition-all ${
                          item.isConfirmed
                            ? "bg-gray-50 border-gray-200 opacity-80" 
                            : "bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-50"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-gray-800">{item.menuItem.name}</h4>
                                {item.isConfirmed && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">Đã gọi</span>}
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Size: {item.size} • {formatVND(displayPrice)}
                            </p>
                          </div>
                          <div className="text-right font-bold text-indigo-600">
                            {formatVND(displayPrice * item.quantity)}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                           <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                                <button 
                                    onClick={() => updateQuantity(i, item.quantity - 1)}
                                    disabled={item.isConfirmed}
                                    className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >-</button>
                                <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                <button 
                                    onClick={() => updateQuantity(i, item.quantity + 1)}
                                    disabled={item.isConfirmed}
                                    className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >+</button>
                           </div>

                           <input
                              type="text"
                              value={item.notes}
                              disabled={item.isConfirmed}
                              onChange={(e) => updateNotes(i, e.target.value)}
                              placeholder={item.isConfirmed ? "Ghi chú..." : "Ghi chú (ít cay...)"}
                              className="flex-1 text-sm bg-transparent border-b border-gray-200 focus:border-indigo-500 outline-none py-1 text-gray-600 disabled:text-gray-400"
                           />

                           {!item.isConfirmed && (
                               <button onClick={() => removeFromOrder(i)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition">
                                   <TrashIcon className="w-5 h-5" />
                               </button>
                           )}
                        </div>
                      </div>
                    );
                })
              )}
            </div>

            <div className="mt-4 border-t border-gray-200 pt-4 space-y-3">
              <div className="flex justify-between items-center text-lg">
                <span className="text-gray-600 font-medium">Tạm tính:</span>
                <span className="text-2xl font-bold text-indigo-700">{formatVND(subtotal)}</span>
              </div>
              
              <button
                onClick={handleSaveOrder}
                disabled={!hasNewItems || submitting}
                className={`w-full py-3.5 font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 ${
                  hasNewItems
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                }`}
              >
                 {submitting ? "Đang gửi bếp..." : <><PlusIcon className="w-5 h-5" /> GỬI BẾP / LƯU MÓN</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
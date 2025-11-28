import React, { useMemo, useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatVND } from "@/utils";
import { useFeedback } from "@/contexts/FeedbackContext";
import { useAuth } from "@/contexts/AuthContext";
import { reservationsApi } from "@/api/reservations";
import { menuApi } from "@/api/menu";
import HomeTab from "@/pages/customer/sections/HomeTab";
import BookingTab from "@/pages/customer/sections/BookingTab";
import MenuTab from "@/pages/customer/sections/MenuTab";
import AboutTab from "@/pages/customer/sections/AboutTab";
import ContactTab from "@/pages/customer/sections/ContactTab";

export type CustomerTab =
  | "home"
  | "booking"
  | "menu"
  | "order"
  | "loyalty"
  | "promotions"
  | "feedback";

type CustomerPortalViewProps = {
  tab: CustomerTab;
  onTabChange: (tab: CustomerTab) => void;
};

const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  tab,
  onTabChange,
}) => {
  const { menuItems } = useAppContext() as any;
  const { user, isAuthenticated } = useAuth();
  const { notify } = useFeedback();

  // Cart (shared cho menu & order tab)
  const [cart, setCart] = useState<any[]>([]);

  // Categories from API
  const [categoriesFromApi, setCategoriesFromApi] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Menu view mode: khungGio, eMenu, all
  const [menuViewMode, setMenuViewMode] = useState<
    "khungGio" | "eMenu" | "all"
  >("khungGio");

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const data = await menuApi.getCategories();

        if (data && Array.isArray(data) && data.length > 0) {
          const mappedCategories = data.map((cat: any) => ({
            id: cat.maDanhMuc || cat.MaDanhMuc || "",
            name: cat.tenDanhMuc || cat.TenDanhMuc || "",
          }));
          setCategoriesFromApi(mappedCategories);
        } else {
          setCategoriesFromApi([]);
        }
      } catch (error: any) {
        setCategoriesFromApi([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // Menu - only show items in stock (default to true if undefined)
  // Also map category name from categoriesFromApi if category is missing
  const availableMenuItems = useMemo(() => {
    const items = (menuItems || [])
      .filter((m: any) => {
        // Show item if inStock is true or undefined (default to showing)
        const shouldShow = m.inStock !== false;
        return shouldShow;
      })
      .map((m: any) => {
        // If category is missing or empty, try to get it from categoriesFromApi
        if (!m.category && m.categoryId && categoriesFromApi.length > 0) {
          const foundCategory = categoriesFromApi.find(
            (c) => c.id === m.categoryId
          );
          if (foundCategory) {
            return { ...m, category: foundCategory.name };
          }
        }
        return m;
      });
    return items;
  }, [menuItems, categoriesFromApi]);
  // Use categories from API, fallback to extracting from menu items
  const categories = useMemo<string[]>(() => {
    if (categoriesFromApi.length > 0) {
      return categoriesFromApi.map((c) => c.name);
    }
    // Fallback: extract from menu items if API categories not loaded yet
    return Array.from(
      new Set(availableMenuItems.map((m: any) => m.category).filter(Boolean))
    );
  }, [categoriesFromApi, availableMenuItems]);
  const [cat, setCat] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc">(
    "name"
  );

  const filtered = useMemo(() => {
    let result = availableMenuItems;

    // Filter by category
    if (cat) {
      result = result.filter((m: any) => {
        const itemCategory = (m.category || "").trim();
        const selectedCategory = cat.trim();
        return itemCategory === selectedCategory;
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (m: any) =>
          m.name.toLowerCase().includes(term) ||
          m.description?.toLowerCase().includes(term) ||
          m.category?.toLowerCase().includes(term)
      );
    }

    // Sort
    result = [...result].sort((a: any, b: any) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "vi");
      } else if (sortBy === "price-asc") {
        const aMinPrice = Math.min(...a.sizes.map((s: any) => s.price));
        const bMinPrice = Math.min(...b.sizes.map((s: any) => s.price));
        return aMinPrice - bMinPrice;
      } else if (sortBy === "price-desc") {
        const aMaxPrice = Math.max(...a.sizes.map((s: any) => s.price));
        const bMaxPrice = Math.max(...b.sizes.map((s: any) => s.price));
        return bMaxPrice - aMaxPrice;
      }
      return 0;
    });

    return result;
  }, [availableMenuItems, cat, searchTerm, sortBy]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 12 items per page

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [cat, searchTerm, sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filtered.slice(startIndex, endIndex);

  // Featured dishes (top 6 by price as a simple proxy)
  const featured = useMemo(() => {
    const flat: any[] = [];
    availableMenuItems.forEach((m: any) => {
      m.sizes.forEach((s: any) =>
        flat.push({
          ...m,
          featureKey: `${m.id}-${s.name}`,
          sizeName: s.name,
          price: s.price,
        })
      );
    });
    return flat.sort((a, b) => b.price - a.price).slice(0, 6);
  }, [availableMenuItems]);

  const addToCart = (item: any, sizeName: string) => {
    const key = item.id + "-" + sizeName;
    const found = cart.find((c) => c.key === key);
    if (found)
      setCart(cart.map((c) => (c.key === key ? { ...c, qty: c.qty + 1 } : c)));
    else
      setCart([
        {
          key,
          id: item.id,
          name: item.name,
          size: sizeName,
          price: item.sizes.find((s: any) => s.name === sizeName)?.price || 0,
          qty: 1,
        },
        ...cart,
      ]);
  };
  const inc = (key: string) =>
    setCart(cart.map((c) => (c.key === key ? { ...c, qty: c.qty + 1 } : c)));
  const dec = (key: string) =>
    setCart(
      cart.flatMap((c) =>
        c.key === key ? (c.qty > 1 ? [{ ...c, qty: c.qty - 1 }] : []) : [c]
      )
    );
  const total = cart.reduce((a, c) => a + c.price * c.qty, 0);

  return (
    <div className="space-y-4">
      {/* Tabs dùng để quản lý các phần nội dung, phần điều hướng nằm trên header */}
      <Tabs value={tab} onValueChange={(v) => onTabChange(v as CustomerTab)}>
        <TabsContent value="home" className="space-y-10">
          <HomeTab onNavigate={onTabChange} />
        </TabsContent>

        <TabsContent value="booking">
          <BookingTab />
        </TabsContent>

        <TabsContent value="menu">
          <MenuTab
            menuViewMode={menuViewMode}
            setMenuViewMode={setMenuViewMode}
            loadingCategories={loadingCategories}
            categories={categories}
            cat={cat}
            setCat={setCat}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortBy}
            setSortBy={setSortBy}
            filtered={filtered}
            paginatedItems={paginatedItems}
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            startIndex={startIndex}
            endIndex={endIndex}
            availableMenuItems={availableMenuItems}
            menuItemsCount={menuItems?.length || 0}
          />
        </TabsContent>

        <TabsContent value="order">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white border border-gray-200 p-4 rounded">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Đặt món online
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableMenuItems.map((m: any) => (
                  <div
                    key={m.id}
                    className="bg-white border border-gray-200 rounded p-3"
                  >
                    <div className="text-gray-900 font-semibold">{m.name}</div>
                    <div className="text-gray-600 text-sm mb-2">
                      {m.category}
                    </div>
                    {m.sizes.map((s: any) => (
                      <button
                        key={s.name}
                        onClick={() => addToCart(m, s.name)}
                        className="w-full text-left bg-gray-50 hover:bg-gray-100 text-gray-900 px-2 py-1 rounded border border-gray-200 mb-1"
                      >
                        {s.name} - {formatVND(s.price)}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Giỏ hàng
              </h3>
              <div className="space-y-2">
                {cart.length === 0 ? (
                  <div className="text-gray-500">Chưa có món.</div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.key}
                      className="flex justify-between text-gray-900"
                    >
                      <span>
                        {item.qty}x {item.name} ({item.size})
                      </span>
                      <span>{formatVND(item.price * item.qty)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 flex justify-between text-gray-900 font-bold">
                <span>Tổng</span>
                <span>{formatVND(total)}</span>
              </div>
              <Button className="mt-3 w-full" variant="default">
                Đặt hàng (demo)
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-6">
          <AboutTab onNavigate={onTabChange} />
        </TabsContent>

        <TabsContent value="promotions">
          <Card>
            <CardHeader>
              <CardTitle>Khuyến mãi & Sự kiện</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Hiển thị các chương trình ưu đãi và form đăng ký sự kiện (demo).
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <ContactTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerPortalView;

export const BookingHistorySection: React.FC<{ token: string }> = ({
  token,
}) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { notify, confirm } = useFeedback();

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await reservationsApi.getMyBookings(token);
        setBookings(data || []);
      } catch (err: any) {
        notify({
          tone: "error",
          title: "Lỗi tải lịch sử",
          description: err?.message || "Không thể tải lịch sử đặt bàn",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, notify]);

  const handleCancel = async (maDonHang: string) => {
    if (!token) return;
    const shouldCancel = await confirm({
      title: "Hủy đặt bàn",
      description: "Bạn có chắc chắn muốn hủy đặt bàn này?",
      confirmText: "Hủy đặt bàn",
      cancelText: "Giữ lại",
      tone: "danger",
    });
    if (!shouldCancel) return;
    try {
      await reservationsApi.cancelBooking(maDonHang, token);
      setBookings((prev) =>
        prev.map((b) =>
          b.maDonHang === maDonHang || b.MaDonHang === maDonHang
            ? { ...b, daHuy: true, coTheHuy: false }
            : b
        )
      );
      notify({
        tone: "success",
        title: "Đã gửi yêu cầu hủy",
        description: "Nhân viên sẽ kiểm tra và xác nhận trong giây lát.",
      });
    } catch (err: any) {
      notify({
        tone: "error",
        title: "Lỗi hủy đặt bàn",
        description: err?.message || "Không thể hủy đặt bàn",
      });
    }
  };

  if (loading) return <div className="text-gray-500">Đang tải...</div>;
  if (bookings.length === 0)
    return <div className="text-gray-500">Chưa có lịch sử đặt bàn.</div>;

  return (
    <div className="space-y-3">
      <h4 className="text-lg font-semibold text-gray-900">Lịch sử đặt bàn</h4>
      {bookings.map((b: any) => {
        const maDon = b.maDonHang || b.MaDonHang;
        const tenBan = b.tenBan || b.TenBan;
        const thoiGian = b.thoiGianBatDau || b.ThoiGianBatDau;
        const thoiGianDuKien = b.thoiGianDuKien || b.ThoiGianDuKien;
        const soNguoi = b.soLuongNguoi || b.SoLuongNguoi;
        const trangThai = b.trangThai || b.TrangThai;
        const daHuy = b.daHuy || b.DaHuy;
        const coTheHuy = b.coTheHuy || b.CoTheHuy;

        return (
          <div key={maDon} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-gray-900">{tenBan}</div>
                <div className="text-sm text-gray-600">
                  Thời gian đặt: {new Date(thoiGian).toLocaleString("vi-VN")} ·{" "}
                  {soNguoi} khách
                </div>
                {thoiGianDuKien && (
                  <div className="text-sm text-blue-600 mt-1">
                    Thời gian dự kiến:{" "}
                    {new Date(thoiGianDuKien).toLocaleString("vi-VN")}
                  </div>
                )}
                <div className="text-sm text-gray-700 mt-1">
                  Trạng thái: {trangThai}
                </div>
              </div>
              {coTheHuy && !daHuy && (
                <div className="flex flex-col gap-2 items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancel(maDon)}
                    className="text-amber-600 border-amber-300 hover:bg-amber-50"
                  >
                    Yêu cầu hủy đơn
                  </Button>
                  <p className="text-[11px] text-amber-600">
                    Nhà hàng sẽ xác nhận trước khi hủy
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

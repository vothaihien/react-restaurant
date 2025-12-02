import React, { useMemo, useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatVND } from "@/utils";
import { menuApi } from "@/api/menu";
import { BASE_URL } from "@/utils/api";
import HomeTab from "@/pages/customer/sections/HomeTab";
import BookingTab from "@/pages/customer/sections/BookingTab";
import MenuTab from "@/pages/customer/sections/MenuTab";
import AboutTab from "@/pages/customer/sections/AboutTab";
import ContactTab from "@/pages/customer/sections/ContactTab";
import BookingHistoryByPhoneTab from "@/pages/customer/sections/BookingHistoryByPhoneTab";

export type CustomerTab =
  | "home"
  | "booking"
  | "menu"
  | "history"
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

  // State để load menu items cho phần "all" nếu menuItems từ context rỗng
  const [allMenuItems, setAllMenuItems] = useState<any[]>([]);
  const [loadingAllMenuItems, setLoadingAllMenuItems] = useState(false);

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

  // Load menu items cho phần "all" nếu menuItems từ context rỗng
  useEffect(() => {
    const loadAllMenuItems = async () => {
      // Chỉ load nếu menuItems từ context rỗng và đang ở tab menu
      if (menuItems && menuItems.length > 0) {
        setAllMenuItems([]);
        return;
      }

      // Nếu menuItems rỗng, tự load từ API
      if (menuViewMode === "all" && menuItems.length === 0) {
        setLoadingAllMenuItems(true);
        try {
          const data = await menuApi.getDishes();
          
          // Map dữ liệu từ API sang format MenuItem
          const mapped: any[] = (Array.isArray(data) ? data : []).map((m: any) => {
            const imgs: string[] = (
              m.hinhAnhMonAns ||
              m.HinhAnhMonAns ||
              []
            ).map((h: any) => {
              const url = h.urlHinhAnh || h.URLHinhAnh || h.url || h.URL;
              return url?.startsWith("http") ? url : `${BASE_URL}/${url}`;
            });

            const tenDanhMuc =
              m.maDanhMucNavigation?.tenDanhMuc ||
              m.MaDanhMucNavigation?.TenDanhMuc ||
              m.tenDanhMuc ||
              m.TenDanhMuc ||
              "";

            const sizes = (m.phienBanMonAns || m.PhienBanMonAns || []).map(
              (p: any) => ({
                id: p.maPhienBan || p.MaPhienBan || "",
                name: p.tenPhienBan || p.TenPhienBan || "",
                price: Number(p.gia || p.Gia) || 0,
                recipe: { id: "", name: "", ingredients: [] },
              })
            );

            return {
              id: m.maMonAn || m.MaMonAn || "",
              name: m.tenMonAn || m.TenMonAn || "",
              description: m.moTa || m.MoTa || "",
              categoryId: m.maDanhMuc || m.MaDanhMuc || "",
              category: tenDanhMuc,
              imageUrls: imgs,
              inStock: m.isShow !== false,
              sizes,
            };
          });
          
          setAllMenuItems(mapped);
        } catch (error: any) {
          console.warn("Không thể tải món ăn từ API cho phần all:", error);
          setAllMenuItems([]);
        } finally {
          setLoadingAllMenuItems(false);
        }
      }
    };
    loadAllMenuItems();
  }, [menuViewMode, menuItems]);

  // Menu - only show items in stock (default to true if undefined)
  // Also map category name from categoriesFromApi if category is missing
  // Sử dụng allMenuItems nếu menuItems từ context rỗng
  const availableMenuItems = useMemo(() => {
    const sourceItems = (menuItems && menuItems.length > 0) ? menuItems : allMenuItems;
    const items = (sourceItems || [])
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
  }, [menuItems, allMenuItems, categoriesFromApi]);
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
            menuItemsCount={(menuItems?.length || 0) + (allMenuItems.length > 0 ? allMenuItems.length : 0)}
          />
        </TabsContent>

        <TabsContent value="history">
          <BookingHistoryByPhoneTab />
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

import React, { useMemo, useState, useEffect } from "react";
import { useAppContext } from "@/core/context/AppContext";
import { TableStatus } from "@/features/tables/domain/types";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/shared/components/ui/card";
import { DateTimePicker } from "@/shared/components/ui/date-time-picker";
import { formatVND } from "@/shared/utils";
import { useFeedback } from "@/core/context/FeedbackContext";
import { useAuth } from "@/core/context/AuthContext";
import { tablesApi } from "@/shared/api/tables";
import { reservationsApi } from "@/shared/api/reservations";
import { menuApi } from "@/shared/api/menu";

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
  const { menuItems, createReservation, tables, getAvailableTables } =
    useAppContext() as any;
  const { user, isAuthenticated, checkUser, login, register, logout } =
    useAuth();
  const { notify } = useFeedback();

  // Booking form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [party, setParty] = useState(2);
  const [dateTime, setDateTime] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);

  // Available tables for selected date/time
  const [availableTables, setAvailableTables] = useState<
    Array<{
      id: string;
      name: string;
      capacity: number;
      status: string;
      maTang?: string;
      tenTang?: string;
    }>
  >([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [selectedTang, setSelectedTang] = useState<string>("");
  const [tangs, setTangs] = useState<
    Array<{ maTang: string; tenTang: string }>
  >([]);

  // Cart (shared for booking pre-order & order tab)
  const [cart, setCart] = useState<any[]>([]);

  // Categories from API
  const [categoriesFromApi, setCategoriesFromApi] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

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

  // Load tầng
  useEffect(() => {
    const loadTangs = async () => {
      try {
        const data = await tablesApi.getTangs();

        if (data && Array.isArray(data) && data.length > 0) {
          const mappedTangs = data.map((t: any) => ({
            maTang: t.maTang || t.MaTang,
            tenTang: t.tenTang || t.TenTang,
          }));
          setTangs(mappedTangs);
        }
      } catch (error: any) {
        // Silent fail
      }
    };
    loadTangs();
  }, []);

  // Fetch available tables when dateTime and party change
  useEffect(() => {
    if (!dateTime || !party || party < 1) {
      setAvailableTables([]);
      setSelectedTableIds([]);
      return;
    }

    const fetchTables = async () => {
      setLoadingTables(true);
      try {
        const tables = await getAvailableTables(dateTime.getTime(), party);
        setAvailableTables(tables || []);
        // Reset selected tables when new tables are loaded
        setSelectedTableIds([]);
      } catch (error: any) {
        notify({
          tone: "error",
          title: "Lỗi tải danh sách bàn",
          description:
            error?.message ||
            "Không thể tải danh sách bàn có sẵn. Vui lòng thử lại.",
        });
        setAvailableTables([]);
      } finally {
        setLoadingTables(false);
      }
    };

    fetchTables();
  }, [dateTime, party, getAvailableTables, notify]);

  // Filter tables by selected tầng
  const filteredTables = useMemo(() => {
    if (!selectedTang || selectedTang.trim() === "") {
      return availableTables;
    }

    const selectedMaTang = selectedTang.toString().trim();
    return availableTables.filter((t) => {
      const tableMaTang = (t.maTang || "").toString().trim();
      return tableMaTang === selectedMaTang;
    });
  }, [availableTables, selectedTang]);

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dateTime) {
      notify({
        tone: "warning",
        title: "Thiếu thông tin đặt bàn",
        description: "Vui lòng nhập họ tên và chọn ngày giờ mong muốn.",
      });
      return;
    }

    const ts = dateTime.getTime();
    // Phần đặt món trước đã được ẩn tạm thời
    // const preorder = cart.length
    //     ? `\n[Đặt món trước] ${cart.map(c => `${c.qty}x ${c.name} (${c.size})`).join(', ')}`
    //     : '';

    try {
      // Get selected table (only one table is allowed)
      const tableId = selectedTableIds.length > 0 ? selectedTableIds[0] : null;

      const reservationData: any = {
        customerName: name,
        phone,
        partySize: party,
        time: ts,
        source: "App",
        notes: notes || "", // Đã bỏ preorder
        tableId: tableId,
      };

      await createReservation(reservationData);

      // Reset form
      setName("");
      setPhone("");
      setParty(2);
      setDateTime(undefined);
      setNotes("");
      setSelectedTableIds([]);
      setCart([]);
      setAvailableTables([]);

      notify({
        tone: "success",
        title: "Đã gửi yêu cầu",
        description: tableId
          ? `Đã gửi yêu cầu đặt bàn ${
              availableTables.find((t) => t.id === tableId)?.name || tableId
            }. Nhà hàng sẽ liên hệ lại để xác nhận.`
          : "Đã gửi yêu cầu đặt bàn. Nhà hàng sẽ liên hệ lại để xác nhận.",
      });
    } catch (error: any) {
      notify({
        tone: "error",
        title: "Lỗi đặt bàn",
        description:
          error?.message || "Không thể gửi yêu cầu đặt bàn. Vui lòng thử lại.",
      });
    }
  };

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
  const categories = useMemo(() => {
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

  const statusClass = (s: string | TableStatus, selected: boolean) => {
    const base = "p-4 rounded-lg border-2 transition cursor-pointer";
    if (selected) return `${base} border-indigo-600 bg-indigo-50`;

    // Normalize status to check
    const statusValue = typeof s === "string" ? s : s;
    const statusStr =
      typeof statusValue === "string" ? statusValue.toLowerCase().trim() : "";

    // Check if it's the enum value
    if (statusValue === TableStatus.Available) {
      return `${base} border-green-500 bg-green-50 hover:bg-green-100`;
    }
    if (
      statusValue === TableStatus.Occupied ||
      statusValue === TableStatus.Reserved ||
      statusValue === TableStatus.CleaningNeeded
    ) {
      return `${base} border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed`;
    }

    // Check string values
    const isAvailable =
      statusStr === "available" ||
      statusStr === "đang trống" ||
      statusStr === "trống";
    const isOccupied =
      statusStr === "occupied" ||
      statusStr === "đang sử dụng" ||
      statusStr === "đang dùng";
    const isReserved =
      statusStr === "reserved" ||
      statusStr === "đã đặt" ||
      statusStr === "đặt trước";
    const isCleaning =
      statusStr === "cleaning needed" ||
      statusStr === "chờ dọn" ||
      statusStr === "dọn" ||
      statusStr === "bảo trì" ||
      statusStr === "đang bảo trì";
    const isNotEnoughCapacity =
      statusStr === "không đủ sức chứa" || statusStr === "không đủ chỗ";

    if (isAvailable) {
      return `${base} border-green-500 bg-green-50 hover:bg-green-100`;
    }
    if (isOccupied || isReserved || isCleaning || isNotEnoughCapacity) {
      return `${base} border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed`;
    }
    return `${base} border-gray-300 bg-white`;
  };

  return (
    <div className="space-y-4">
      {/* Tabs dùng để quản lý các phần nội dung, phần điều hướng nằm trên header */}
      <Tabs value={tab} onValueChange={(v) => onTabChange(v as CustomerTab)}>
        <TabsContent value="home" className="space-y-10">
          {/* Hero section dựa trên design code.html */}
          <section className="relative rounded-xl overflow-hidden min-h-[320px] md:min-h-[420px] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.65)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAg9QSgrxyT28Ng0YKudOW7aGTwdpENZtEv9esqaGnbSCGQIt7Cc8Zw_qbtKsq2Sfzs9iqol6yE12VajK07FgRRyMUd12SKRC3vEv12P_jv3-YOis9c4FAlLamdhJUARgsq9vCkk4GX-ijZ1pWcnvkj0xnrLQ6K_fPtXq_PSIFr80e1hKRzIbbkJBgneE9P4d4sVntNc8-ZCR1ngeRB3e8M5hK94TvJkc5RNC4JpJ0A4ERxCUxVALaoDDd1GkdQXmKUZ2fsvK1c1ukd")',
              }}
            />
            <div className="relative z-10 px-4 sm:px-8 py-10 text-center max-w-3xl">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
                Trải Nghiệm Tinh Hoa Ẩm Thực Việt
              </h2>
              <p className="mt-4 text-base sm:text-lg text-white/90">
                Khám phá hương vị truyền thống trong một không gian sang trọng
                và ấm cúng.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  className="h-12 px-6 text-base font-semibold"
                  onClick={() => onTabChange("booking")}
                >
                  Đặt bàn ngay
                </Button>
                <Button
                  variant="outline"
                  className="h-12 px-6 text-base font-semibold bg-white/10 border-white/60 text-white hover:bg-white/20"
                  onClick={() => onTabChange("menu")}
                >
                  Xem thực đơn
                </Button>
              </div>
            </div>
          </section>

          {/* Combo đặc biệt hôm nay */}
          <section className="py-4 md:py-6">
            <h3 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-6">
              Combo Đặc Biệt Hôm Nay
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <article className="flex flex-col gap-3 pb-3 group">
                <div
                  className="w-full bg-center bg-no-repeat aspect-[3/4] bg-cover rounded-xl overflow-hidden transform group-hover:scale-105 transition-transform duration-300 ease-in-out"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDbOinRNLxEOEtRG5ml6_E0UQg3hSzoBCXOdvDyLmOyH_DNmlu8D3nZ1BWZeul2QkYWL5SH2yQwiQQ-k-_1uQa1JPO_kwrr7U7D8rLCSxArEZGiIkIZhYIdZMugniMzwPN78NkvUTNjjjAaW5dqCPZnJp0Eg9HjdcPtsicEjDlRsAMs6ltUIE7IKWrHJ6OqbdQ5AO5eR_uHCHftduFyd17Q-nN5zfC2Yp_lVS9WpNH-QeJ56qJSp8O-No9ZnDMkM7YkV_iM1K2vTt6d")',
                  }}
                />
                <div className="text-center mt-1">
                  <p className="text-xl font-bold text-gray-900">
                    Combo Sum Vầy
                  </p>
                  <p className="text-sm text-gray-600">
                    Bữa ăn thịnh soạn cho gia đình
                  </p>
                </div>
              </article>

              <article className="flex flex-col gap-3 pb-3 group">
                <div
                  className="w-full bg-center bg-no-repeat aspect-[3/4] bg-cover rounded-xl overflow-hidden transform group-hover:scale-105 transition-transform duration-300 ease-in-out"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDJLaFiCvAJAsGTxHyAJ82t4pP6t2OoeK76Ix7gyCYt2ahA5qm4BP8owas9_0G057HTn543Y69sHZGdnxE5ADKtGmyw2mBWa-BWa4ZJJaV3NBw6bhJ-xQXEmjXY7V9NlgpC6sTTj9EkzQy7WqOKin6_OIZiVb4N-MPewKLo8VDG7uA6LslGd3qjsn9HvtsJbYLKO9zBi91ggQdSymiuOfdLSYjgQoPCs3tQaC_3MD29Qr9Prdx_0HnKhq1CaKU-9OV2t0Ge77VlnYye")',
                  }}
                />
                <div className="text-center mt-1">
                  <p className="text-xl font-bold text-gray-900">
                    Combo Tình Yêu
                  </p>
                  <p className="text-sm text-gray-600">
                    Lựa chọn hoàn hảo cho cặp đôi
                  </p>
                </div>
              </article>

              <article className="flex flex-col gap-3 pb-3 group">
                <div
                  className="w-full bg-center bg-no-repeat aspect-[3/4] bg-cover rounded-xl overflow-hidden transform group-hover:scale-105 transition-transform duration-300 ease-in-out"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBbFhV5Ktx_QnnIpUckagpOofBcSMTR_cdhB1scgAMbGM_GlxyywQT7cP_978xfVrmsZqBNh8mPXl5-Oj7OZ04u-s2Py4xO_wBh1ntBQVjSDnlpeLRY8D5KtgSQEHJs4FTXdcVWkUyfn3qDjMZss_yqJ3IJLvIRzM-KOgt3YosURqzvy71aLxSmBTG12FkkOqp3eyvaFYjpRIVgH_YNLEIrZho5Ikd7OSvYnpWgNbuTYXc18fcQ_-Rlur4W5kxsXXcTqiOk8gxX_Grv")',
                  }}
                />
                <div className="text-center mt-1">
                  <p className="text-xl font-bold text-gray-900">
                    Combo Bạn Bè
                  </p>
                  <p className="text-sm text-gray-600">
                    Chia sẻ khoảnh khắc vui vẻ
                  </p>
                </div>
              </article>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="booking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chọn thời gian và số lượng khách</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày và giờ muốn đặt
                  </label>
                  <DateTimePicker value={dateTime} onChange={setDateTime} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng khách
                  </label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Số khách"
                    value={party}
                    onChange={(e) => setParty(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              {dateTime && party >= 1 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Đã chọn:{" "}
                    <strong>
                      {new Date(dateTime).toLocaleString("vi-VN")}
                    </strong>{" "}
                    cho <strong>{party}</strong> khách
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {dateTime && party >= 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Chọn bàn có sẵn</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTables ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Đang tải danh sách bàn có sẵn...</p>
                  </div>
                ) : availableTables.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Không có bàn nào trống trong khung giờ này.</p>
                    <p className="text-sm mt-2">
                      Vui lòng chọn thời gian khác hoặc liên hệ nhà hàng.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="text-sm text-gray-600">
                        Tìm thấy <strong>{filteredTables.length}</strong> bàn có
                        sẵn cho {party} khách vào{" "}
                        {new Date(dateTime).toLocaleString("vi-VN")}
                      </div>
                      {tangs.length > 0 && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">
                            Lọc theo tầng:
                          </label>
                          <select
                            value={selectedTang}
                            onChange={(e) => setSelectedTang(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Tất cả tầng</option>
                            {tangs.map((tang) => (
                              <option key={tang.maTang} value={tang.maTang}>
                                {tang.tenTang}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {filteredTables.map((t: any) => {
                        const isAvailable =
                          t.status === "Đang trống" ||
                          t.status === "Available" ||
                          t.status === TableStatus.Available;
                        const disabled = !isAvailable;
                        const selected = selectedTableIds.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            disabled={disabled}
                            onClick={() => {
                              if (selected) {
                                setSelectedTableIds([]);
                              } else {
                                // Only allow selecting one table
                                setSelectedTableIds([t.id]);
                              }
                            }}
                            className={statusClass(t.status, selected)}
                            title={
                              disabled
                                ? "Bàn không khả dụng"
                                : selected
                                ? "Bỏ chọn bàn này"
                                : "Chọn bàn này"
                            }
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-900">
                                {t.name}
                              </span>
                              <span className="text-xs text-gray-600">
                                {t.capacity} khách
                              </span>
                            </div>
                            {t.tenTang && (
                              <div className="mt-1 text-xs text-gray-500">
                                {t.tenTang}
                              </div>
                            )}
                            <div className="mt-1 text-sm text-gray-700">
                              {t.status === "Đang trống" ||
                              t.status === "Available" ||
                              t.status === TableStatus.Available
                                ? "Trống"
                                : t.status === "Đã đặt" ||
                                  t.status === "Reserved" ||
                                  t.status === TableStatus.Reserved
                                ? "Đã đặt"
                                : t.status === "Đang sử dụng" ||
                                  t.status === "Occupied" ||
                                  t.status === TableStatus.Occupied
                                ? "Đang sử dụng"
                                : t.status === "Không đủ sức chứa"
                                ? "Không đủ chỗ"
                                : t.status === "Đang bảo trì"
                                ? "Bảo trì"
                                : t.status}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {selectedTableIds.length > 0 && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          Đã chọn bàn:{" "}
                          <strong>
                            {availableTables.find(
                              (t: any) => t.id === selectedTableIds[0]
                            )?.name || selectedTableIds[0]}
                          </strong>
                          {availableTables.find(
                            (t: any) => t.id === selectedTableIds[0]
                          )?.tenTang && (
                            <span>
                              {" "}
                              -{" "}
                              {
                                availableTables.find(
                                  (t: any) => t.id === selectedTableIds[0]
                                )?.tenTang
                              }
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Phần đặt món trước đã được ẩn tạm thời */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 bg-white border border-gray-200 p-4 rounded">
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Đặt món trước (tuỳ chọn)</h4>
                            <div className="flex gap-2 mb-3 flex-wrap">
                                <button onClick={() => setCat('')} className={`px-3 py-1 rounded ${cat === '' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Tất cả</button>
                                {categories.map((c: string) => (
                                    <button key={c} onClick={() => setCat(c)} className={`px-3 py-1 rounded ${cat === c ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{c}</button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {filtered.map((m: any) => (
                                    <div key={m.id} className="bg-white border border-gray-200 rounded p-3">
                                        <div className="text-gray-900 font-semibold">{m.name}</div>
                                        <div className="text-gray-600 text-sm mb-2">{m.category}</div>
                                        {m.sizes.map((s: any) => (
                                            <button key={s.name} onClick={() => addToCart(m, s.name)} className="w-full text-left bg-gray-50 hover:bg-gray-100 text-gray-900 px-2 py-1 rounded border border-gray-200 mb-1">
                                                {s.name} - {formatVND(s.price)}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 p-4 rounded">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Giỏ hàng (tuỳ chọn)</h4>
                            <div className="space-y-2">
                                {cart.length === 0 ? <div className="text-gray-500">Chưa có món.</div> : cart.map(item => (
                                    <div key={item.key} className="flex items-center justify-between text-gray-900">
                                        <span className="mr-2">{item.qty}x {item.name} ({item.size})</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => dec(item.key)} className="px-2 py-1 rounded border border-gray-300">-</button>
                                            <button onClick={() => inc(item.key)} className="px-2 py-1 rounded border border-gray-300">+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 flex justify-between text-gray-900 font-semibold">
                                <span>Tạm tính</span><span>{formatVND(total)}</span>
                            </div>
                        </div>
                    </div> */}

          {dateTime && party >= 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Thông tin đặt bàn</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitBooking} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Họ tên *
                      </label>
                      <Input
                        placeholder="Nhập họ tên"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Điện thoại
                      </label>
                      <Input
                        placeholder="Nhập số điện thoại"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú (dịp, yêu cầu đặc biệt)
                    </label>
                    <Input
                      placeholder="Ví dụ: Sinh nhật, yêu cầu bàn gần cửa sổ..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-muted-foreground">
                      {selectedTableIds.length > 0
                        ? `Đã chọn bàn: ${
                            availableTables.find(
                              (t: any) => t.id === selectedTableIds[0]
                            )?.name || selectedTableIds[0]
                          }${
                            availableTables.find(
                              (t: any) => t.id === selectedTableIds[0]
                            )?.tenTang
                              ? ` - ${
                                  availableTables.find(
                                    (t: any) => t.id === selectedTableIds[0]
                                  )?.tenTang
                                }`
                              : ""
                          }`
                        : "Chưa chọn bàn (tuỳ chọn)"}
                    </div>
                    <Button type="submit" disabled={!name || !dateTime}>
                      Gửi yêu cầu đặt bàn
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="menu">
          <Card>
            <CardHeader>
              <CardTitle>Thực đơn trực tuyến</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search and Sort */}
              <div className="mb-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Input */}
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Tìm kiếm món ăn, mô tả, danh mục..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Sort Dropdown */}
                  <div className="sm:w-48">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="name">Sắp xếp: Tên A-Z</option>
                      <option value="price-asc">Giá: Thấp → Cao</option>
                      <option value="price-desc">Giá: Cao → Thấp</option>
                    </select>
                  </div>
                </div>

                {/* Active filters display and clear button */}
                {(searchTerm || cat) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setCat("");
                      }}
                    >
                      Xóa bộ lọc
                    </Button>
                    {searchTerm && (
                      <span className="text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded">
                        Tìm: <strong>"{searchTerm}"</strong>
                      </span>
                    )}
                    {cat && (
                      <span className="text-sm text-gray-600 px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                        Danh mục: <strong>{cat}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Category Quick Filters (Optional - for quick access) */}
              {loadingCategories ? (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">
                    Đang tải danh mục...
                  </p>
                </div>
              ) : categories.length > 0 ? (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">
                    Lọc nhanh theo danh mục:
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setCat("")}
                      className={`px-3 py-1.5 rounded text-sm transition ${
                        cat === ""
                          ? "bg-indigo-600 text-white font-medium"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Tất cả
                    </button>
                    {categories.map((c: string) => (
                      <button
                        key={c}
                        onClick={() => setCat(c)}
                        className={`px-3 py-1.5 rounded text-sm transition ${
                          cat === c
                            ? "bg-indigo-600 text-white font-medium"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-3">
                  <p className="text-sm text-gray-500">
                    Chưa có danh mục nào. Danh mục sẽ được hiển thị khi có dữ
                    liệu.
                  </p>
                </div>
              )}
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? (
                    <>
                      <p>Không tìm thấy món nào phù hợp với "{searchTerm}".</p>
                      <p className="text-sm mt-2">
                        Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.
                      </p>
                    </>
                  ) : cat ? (
                    <>
                      <p>Chưa có món nào trong danh mục "{cat}".</p>
                      <p className="text-sm mt-2">
                        Thử chọn danh mục khác hoặc xem tất cả món.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>Chưa có món nào trong thực đơn.</p>
                      <p className="text-sm mt-2">
                        Tổng số món: {menuItems?.length || 0}, Còn hàng:{" "}
                        {availableMenuItems.length}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
                    key={`menu-grid-${menuItems?.length || 0}`}
                  >
                    {paginatedItems.map((m: any) => (
                      <div
                        key={m.id}
                        className="bg-white border border-gray-200 rounded p-3"
                      >
                        <img
                          src={m.imageUrls?.[0]}
                          className="w-full h-28 object-cover rounded"
                        />
                        <div className="mt-2 text-gray-900 font-semibold">
                          {m.name}
                        </div>
                        <div className="text-gray-600 text-sm">
                          {m.description}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {m.sizes.map((s: any) => (
                            <div
                              key={s.name}
                              className="text-sm text-gray-900 flex items-center justify-between bg-gray-50 border border-gray-200 px-3 py-1.5 rounded min-w-[120px] flex-shrink-0"
                            >
                              <span className="whitespace-nowrap">
                                {s.name}
                              </span>
                              <span className="ml-2 whitespace-nowrap font-semibold">
                                {formatVND(s.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Trước
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((page) => {
                          // Show first page, last page, current page, and pages around current
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <Button
                                key={page}
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="min-w-[40px]"
                              >
                                {page}
                              </Button>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <span key={page} className="px-2 text-gray-500">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                      >
                        Sau
                      </Button>
                    </div>
                  )}

                  {/* Pagination info */}
                  <div className="mt-4 text-center text-sm text-gray-600">
                    Hiển thị {startIndex + 1}-
                    {Math.min(endIndex, filtered.length)} trong tổng số{" "}
                    {filtered.length} món
                  </div>
                </>
              )}
            </CardContent>
          </Card>
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

        <TabsContent value="loyalty">
          <Card>
            <CardHeader>
              <CardTitle>Thành viên & Lịch sử đặt bàn</CardTitle>
            </CardHeader>
            <CardContent>
              {!isAuthenticated ? (
                <AuthBox />
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-gray-900">
                      Xin chào,{" "}
                      <span className="font-semibold">{user?.name}</span>
                    </div>
                    <div className="text-gray-700 text-sm">
                      Mã KH: {user?.customerId}
                    </div>
                    <Button variant="outline" onClick={logout}>
                      Đăng xuất
                    </Button>
                  </div>
                  <BookingHistorySection token={user?.token || ""} />
                </div>
              )}
            </CardContent>
          </Card>
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

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Phản hồi & Hỗ trợ</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Gửi đánh giá và liên hệ CSKH (demo).</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerPortalView;

const BookingHistorySection: React.FC<{ token: string }> = ({ token }) => {
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
      notify({
        tone: "success",
        title: "Đã hủy đặt bàn",
        description: "Đặt bàn đã được hủy thành công.",
      });
      setBookings((prev) =>
        prev.map((b) =>
          b.maDonHang === maDonHang || b.MaDonHang === maDonHang
            ? { ...b, daHuy: true, coTheHuy: false }
            : b
        )
      );
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
        const soNguoi = b.soLuongNguoi || b.SoLuongNguoi;
        const trangThai = b.trangThai || b.TrangThai;
        const daHuy = b.daHuy || b.DaHuy;
        const coTheHuy = b.coTheHuy || b.CoTheHuy;

        return (
          <div key={maDon} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-gray-900">Bàn {tenBan}</div>
                <div className="text-sm text-gray-600">
                  {new Date(thoiGian).toLocaleString("vi-VN")} · {soNguoi} khách
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  Trạng thái: {trangThai}
                </div>
              </div>
              {coTheHuy && !daHuy && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(maDon)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Hủy đặt
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AuthBox: React.FC = () => {
  const { notify } = useFeedback();
  const { checkUser, login, register } = useAuth();
  const [step, setStep] = useState<"identify" | "otp">("identify");
  const [identifier, setIdentifier] = useState("");
  const [exists, setExists] = useState<boolean | null>(null);
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");

  const doCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    try {
      const res = await checkUser(identifier);
      setExists(res.userExists);
      setStep("otp");
      notify({
        tone: "success",
        title: "Đã gửi OTP",
        description: identifier.includes("@")
          ? "Vui lòng kiểm tra email"
          : "OTP đã hiển thị ở server console (dev)",
      });
    } catch (err: any) {
      notify({
        tone: "error",
        title: "Lỗi",
        description: err?.message || "Không gửi được OTP",
      });
    }
  };

  const doSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    try {
      if (exists) {
        await login(identifier, otp);
        notify({ tone: "success", title: "Đăng nhập thành công" });
      } else {
        if (!name) {
          notify({ tone: "warning", title: "Thiếu họ tên đăng ký" });
          return;
        }
        await register(identifier, name, otp);
        notify({ tone: "success", title: "Đăng ký thành công" });
      }
    } catch (err: any) {
      notify({
        tone: "error",
        title: "Lỗi",
        description: err?.message || "Xác thực thất bại",
      });
    }
  };

  return (
    <div className="max-w-md space-y-3">
      {step === "identify" ? (
        <form onSubmit={doCheck} className="space-y-2">
          <Input
            placeholder="Email hoặc SĐT"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <Button type="submit">Nhận OTP</Button>
        </form>
      ) : (
        <form onSubmit={doSubmitOtp} className="space-y-2">
          {!exists && (
            <Input
              placeholder="Họ tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <Input
            placeholder="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <Button type="submit">{exists ? "Đăng nhập" : "Đăng ký"}</Button>
        </form>
      )}
    </div>
  );
};

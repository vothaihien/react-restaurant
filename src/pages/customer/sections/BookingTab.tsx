import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useAppContext } from "@/contexts/AppContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import { tablesApi } from "@/api/tables";
import { TableStatus } from "@/types/tables";
import { formatVND } from "@/utils";
import { khachHangService } from "@/services/khachHangService";

const BookingTab: React.FC = () => {
  const { createReservation, getAvailableTables } = useAppContext() as any;
  const { notify } = useFeedback();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [party, setParty] = useState(2);
  const [dateTime, setDateTime] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [wantDeposit, setWantDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [wantEmailNotification, setWantEmailNotification] = useState(false);
  const [visitType, setVisitType] = useState<"first" | "returning">("first");
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<
    "idle" | "success" | "notfound" | "error"
  >("idle");
  const [lookupMessage, setLookupMessage] = useState("");
  const [hasLookupAttempt, setHasLookupAttempt] = useState(false);

  // Tính tiền cọc tự động dựa trên số người (theo logic backend)
  const calculateDeposit = useMemo(() => {
    if (party >= 6) {
      const donGiaCoc = 50000;
      let tienCoc = party * donGiaCoc;
      if (tienCoc < 200000) {
        tienCoc = 200000;
      }
      return tienCoc;
    }
    return 0;
  }, [party]);

  // Tự động set tiền cọc khi số người >= 6
  useEffect(() => {
    if (party >= 6) {
      setWantDeposit(true);
      setDepositAmount(calculateDeposit);
    }
  }, [party, calculateDeposit]);

  const prevVisitTypeRef = useRef<"first" | "returning">("first");

  useEffect(() => {
    if (visitType === "first") {
      setCustomerId(undefined);
      setLookupStatus("idle");
      setLookupMessage("");
      setHasLookupAttempt(false);
      setLookupPhone("");
      if (prevVisitTypeRef.current === "returning") {
        setName("");
        setPhone("");
        setEmail("");
        setNotes("");
        setWantEmailNotification(false);
      }
    } else {
      setLookupPhone((prev) => prev || phone);
    }
    prevVisitTypeRef.current = visitType;
  }, [visitType, phone]);

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
  const [viewMode, setViewMode] = useState<"grid" | "grouped">("grid");

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
      } catch {
        setTangs([]);
      }
    };
    loadTangs();
  }, []);

  useEffect(() => {
    if (!dateTime || !party || party < 1) {
      setAvailableTables([]);
      setSelectedTableIds([]);
      return;
    }
    const fetchTables = async () => {
      setLoadingTables(true);
      try {
        const tables = await getAvailableTables(
          dateTime.getTime(),
          party,
          customerId
        );
        setAvailableTables(tables || []);
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

  const handleCustomerLookup = async () => {
    if (!lookupPhone.trim()) {
      notify({
        tone: "warning",
        title: "Thiếu số điện thoại",
        description: "Vui lòng nhập số điện thoại để tra cứu khách hàng.",
      });
      return;
    }
    setLookupLoading(true);
    setHasLookupAttempt(true);
    try {
      const result = await khachHangService.searchByPhone(lookupPhone.trim());
      if (result.found) {
        setCustomerId(result.maKhachHang);
        setName((prev) => result.tenKhach || prev || "");
        setPhone(lookupPhone.trim());
        setEmail((prev) => result.email || prev || "");
        setLookupStatus("success");
        setLookupMessage(
          result.message || "Đã tìm thấy khách hàng thân thiết."
        );
      } else {
        setCustomerId(undefined);
        setLookupStatus("notfound");
        setLookupMessage(
          result.message ||
            "Không tìm thấy khách hàng. Bạn có thể tiếp tục nhập thông tin như khách mới."
        );
      }
    } catch (error: any) {
      setCustomerId(undefined);
      setLookupStatus("error");
      setLookupMessage(
        error?.message || "Không thể tra cứu khách hàng. Vui lòng thử lại."
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const filteredTables = useMemo(() => {
    // Loại bỏ các bàn đã được đặt
    let tables = availableTables.filter((t) => {
      const status = (t.status || "").toLowerCase();
      return (
        status !== "đã đặt" &&
        status !== "đã được đặt" &&
        status !== "da dat" &&
        status !== "da duoc dat"
      );
    });

    // Filter theo tầng nếu có chọn
    if (selectedTang && selectedTang.trim() !== "") {
      const selectedMaTang = selectedTang.toString().trim();
      tables = tables.filter((t) => {
        const tableMaTang = (t.maTang || "").toString().trim();
        return tableMaTang === selectedMaTang;
      });
    }

    return tables;
  }, [availableTables, selectedTang]);

  // Nhóm bàn theo trạng thái
  const groupedTables = useMemo(() => {
    // Hàm chuẩn hóa trạng thái (định nghĩa bên trong useMemo)
    const normalizeStatus = (status: string): string => {
      const s = (status || "").toLowerCase();
      if (
        s === "đang trống" ||
        s === "available" ||
        s === "trống" ||
        s === "trong"
      ) {
        return "Đang trống";
      }
      if (
        s === "không đủ sức chứa" ||
        s === "không đủ chỗ" ||
        s === "suc chua nho" ||
        s === "sức chứa nhỏ"
      ) {
        return "Không đủ sức chứa";
      }
      if (s === "bảo trì" || s === "bao tri" || s === "đang bảo trì") {
        return "Bảo trì";
      }
      return status || "Khác";
    };

    const groups: Record<string, typeof filteredTables> = {};

    filteredTables.forEach((table) => {
      const status = table.status || "Khác";
      const normalizedStatus = normalizeStatus(status);

      if (!groups[normalizedStatus]) {
        groups[normalizedStatus] = [];
      }
      groups[normalizedStatus].push(table);
    });

    // Sắp xếp các nhóm theo thứ tự ưu tiên
    const statusOrder = ["Đang trống", "Không đủ sức chứa", "Bảo trì", "Khác"];

    const sortedGroups: Array<{
      status: string;
      tables: typeof filteredTables;
    }> = [];

    statusOrder.forEach((status) => {
      if (groups[status]) {
        sortedGroups.push({ status, tables: groups[status] });
      }
    });

    // Thêm các nhóm còn lại
    Object.keys(groups).forEach((status) => {
      if (!statusOrder.includes(status)) {
        sortedGroups.push({ status, tables: groups[status] });
      }
    });

    return sortedGroups;
  }, [filteredTables]);

  const selectedTables = useMemo(
    () =>
      selectedTableIds
        .map((id) => availableTables.find((t) => t.id === id))
        .filter((t): t is (typeof availableTables)[number] => Boolean(t)),
    [selectedTableIds, availableTables]
  );

  const totalSelectedCapacity = useMemo(
    () =>
      selectedTables.reduce(
        (sum, table) => sum + (Number(table.capacity) || 0),
        0
      ),
    [selectedTables]
  );

  const remainingGuests =
    party > 0 ? Math.max(party - totalSelectedCapacity, 0) : 0;
  const hasEnoughCapacity =
    selectedTableIds.length > 0 && totalSelectedCapacity >= party;

  // Helper function để render một bàn
  const renderTableButton = (t: any) => {
    const isAvailable =
      t.status === "Đang trống" ||
      t.status === "Available" ||
      t.status === TableStatus.Empty;
    const isCapacityLimited =
      t.status === "Không đủ sức chứa" ||
      t.status === "Không đủ chỗ" ||
      t.status === "Suc chua nho" ||
      t.status === "Sức chứa nhỏ";
    const disabled = !(isAvailable || isCapacityLimited);
    const selected = selectedTableIds.includes(t.id);

    const statusDotClass = isAvailable
      ? "bg-emerald-500"
      : isCapacityLimited
      ? "bg-amber-500"
      : "bg-slate-400";

    return (
      <button
        key={t.id}
        disabled={disabled}
        onClick={() => {
          if (selected) {
            setSelectedTableIds(selectedTableIds.filter((id) => id !== t.id));
          } else {
            setSelectedTableIds([...selectedTableIds, t.id]);
          }
        }}
        className={`relative p-4 rounded-2xl border transition cursor-pointer bg-white/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex flex-col gap-2 overflow-hidden ${
          selected ? "border-indigo-600 bg-indigo-50" : ""
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        title={
          disabled
            ? "Bàn không khả dụng"
            : selected
            ? "Bỏ chọn bàn này"
            : isCapacityLimited
            ? "Bàn nhỏ - bạn có thể chọn nhiều bàn để đủ chỗ"
            : "Chọn bàn này"
        }
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass}`} />
              {t.name}
            </span>
            {t.tenTang && (
              <span className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-500">
                {t.tenTang}
              </span>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-medium">
          <span className="text-emerald-600">{t.capacity} khách</span>
        </div>
      </button>
    );
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !dateTime || (wantEmailNotification && !email)) {
      notify({
        tone: "warning",
        title: "Thiếu thông tin đặt bàn",
        description:
          "Vui lòng nhập Họ tên, Điện thoại, Email và chọn ngày giờ mong muốn.",
      });
      return;
    }

    if (dateTime.getTime() < Date.now()) {
      notify({
        tone: "warning",
        title: "Thời gian không hợp lệ",
        description: "Vui lòng chọn thời điểm trong tương lai để đặt bàn.",
      });
      return;
    }

    const ts = dateTime.getTime();
    try {
      const tableIds = selectedTableIds.length > 0 ? selectedTableIds : [];
      const reservationData: any = {
        customerName: name,
        phone,
        customerId: customerId,
        partySize: party,
        time: ts,
        source: "App",
        notes: notes || "",
        tableIds: tableIds.length > 0 ? tableIds : undefined,
        tienDatCoc: wantDeposit && depositAmount > 0 ? depositAmount : 0,
        email: wantEmailNotification && email ? email : undefined,
      };

      const result = await createReservation(reservationData);

      // Xử lý payment URL nếu backend yêu cầu thanh toán
      if (result?.requiresPayment && result?.paymentUrl) {
        notify({
          tone: "info",
          title: "Yêu cầu đặt cọc",
          description: `Vui lòng thanh toán đặt cọc ${formatVND(
            result.depositAmount || depositAmount
          )} để hoàn tất đặt bàn.`,
        });
        // Redirect đến payment URL
        window.location.href = result.paymentUrl;
        return;
      }

      setName("");
      setPhone("");
      setEmail("");
      setParty(2);
      setDateTime(undefined);
      setNotes("");
      setSelectedTableIds([]);
      setAvailableTables([]);
      setWantDeposit(false);
      setDepositAmount(0);
      setCustomerId(undefined);
      setVisitType("first");
      setLookupPhone("");
      setLookupStatus("idle");
      setLookupMessage("");
      setHasLookupAttempt(false);
      setWantEmailNotification(false);

      const selectedTablesNames = selectedTableIds
        .map((id) => availableTables.find((t) => t.id === id)?.name || id)
        .join(", ");

      let description = "";
      if (selectedTableIds.length > 0) {
        description = `Đã gửi yêu cầu đặt ${selectedTableIds.length} bàn (${selectedTablesNames}).`;
      } else {
        description = "Đã gửi yêu cầu đặt bàn.";
      }
      if (wantDeposit && depositAmount > 0) {
        description += ` Đã đặt cọc ${formatVND(depositAmount)}.`;
      }
      description += " Nhà hàng sẽ liên hệ lại để xác nhận.";

      notify({
        tone: "success",
        title: "Đã gửi yêu cầu",
        description,
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bạn đã từng ăn tại Viet Restaurant?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVisitType("returning")}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                visitType === "returning"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-slate-200 hover:border-primary/60 hover:bg-primary/5"
              }`}
            >
              <div className="text-base font-semibold">Đã từng ăn</div>
              <p className="text-sm text-slate-600">
                Tra cứu nhanh bằng số điện thoại để tự động điền thông tin.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setVisitType("first")}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                visitType === "first"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-slate-200 hover:border-primary/60 hover:bg-primary/5"
              }`}
            >
              <div className="text-base font-semibold">Lần đầu ăn</div>
              <p className="text-sm text-slate-600">
                Nhập thông tin đặt bàn đầy đủ như thông thường.
              </p>
            </button>
          </div>

          {visitType === "returning" && (
            <div className="mt-5 space-y-3">
              <p className="text-sm text-slate-600">
                Nhập số điện thoại bạn từng dùng để đặt bàn, hệ thống sẽ tìm và
                điền lại thông tin giúp bạn.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <Input
                  placeholder="Nhập số điện thoại đã dùng trước đây"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  className="flex-1 min-w-[240px]"
                />
                <Button
                  type="button"
                  onClick={handleCustomerLookup}
                  disabled={lookupLoading}
                >
                  {lookupLoading ? "Đang tra cứu..." : "Tra cứu khách hàng"}
                </Button>
              </div>
              {hasLookupAttempt && lookupMessage && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    lookupStatus === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : lookupStatus === "notfound"
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {lookupMessage}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr,1.3fr] gap-4">
        <div className="space-y-4">
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
            <>
              {availableTables.length > 0 && (
                <>
                  <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-700 space-y-1">
                    <div className="font-semibold text-slate-900">
                      Tổng sức chứa đã chọn: {totalSelectedCapacity} / {party}{" "}
                      khách
                    </div>
                    {selectedTableIds.length === 0 ? (
                      <p className="text-amber-700">
                        Vui lòng chọn ít nhất một bàn để gửi yêu cầu đặt chỗ.
                      </p>
                    ) : remainingGuests > 0 ? (
                      <p className="text-amber-700">
                        Còn thiếu {remainingGuests} chỗ. Vui lòng chọn thêm bàn
                        hoặc giảm số khách.
                      </p>
                    ) : (
                      <p className="text-emerald-700">
                        Đã đủ chỗ cho {party} khách. Bạn vẫn có thể ghi chú thêm
                        yêu cầu đặc biệt phía dưới.
                      </p>
                    )}
                  </div>
                  <div className="mb-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600">
                    <div className="font-semibold text-gray-900 mb-2">
                      Chú thích trạng thái bàn:
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                        <span>Bàn trống - có thể đặt ngay</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                        <span>Bàn nhỏ - có thể chọn nhiều bàn</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Chọn bàn có sẵn</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Bạn có thể chọn nhiều bàn nhỏ để đủ chỗ cho {party} khách.
                    Tổng sức chứa đã chọn sẽ hiển thị ngay bên dưới.
                  </p>
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
                          Tìm thấy <strong>{filteredTables.length}</strong> bàn
                          có sẵn cho {party} khách vào{" "}
                          {new Date(dateTime).toLocaleString("vi-VN")}
                        </div>
                        <div className="flex items-center gap-3">
                          {tangs.length > 0 && (
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium text-gray-700">
                                Lọc theo tầng:
                              </label>
                              <select
                                value={selectedTang}
                                onChange={(e) =>
                                  setSelectedTang(e.target.value)
                                }
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
                          <div className="flex items-center gap-2 border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setViewMode("grid")}
                              className={`px-3 py-1.5 text-sm font-medium transition ${
                                viewMode === "grid"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-white text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              Lưới
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewMode("grouped")}
                              className={`px-3 py-1.5 text-sm font-medium transition ${
                                viewMode === "grouped"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-white text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              Phân loại
                            </button>
                          </div>
                        </div>
                      </div>

                      {viewMode === "grid" ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                          {filteredTables.map((t: any) => renderTableButton(t))}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {groupedTables.map((group) => {
                            const getStatusColor = (status: string) => {
                              if (status === "Đang trống")
                                return "bg-emerald-100 border-emerald-300 text-emerald-800";
                              if (status === "Không đủ sức chứa")
                                return "bg-amber-100 border-amber-300 text-amber-800";
                              if (status === "Bảo trì")
                                return "bg-red-100 border-red-300 text-red-800";
                              return "bg-gray-100 border-gray-300 text-gray-800";
                            };

                            const getStatusIcon = (status: string) => {
                              if (status === "Đang trống") return "✓";
                              if (status === "Không đủ sức chứa") return "⚠";
                              if (status === "Bảo trì") return "🔧";
                              return "•";
                            };

                            return (
                              <div key={group.status} className="space-y-3">
                                <div
                                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(
                                    group.status
                                  )}`}
                                >
                                  <span className="text-lg font-semibold">
                                    {getStatusIcon(group.status)}
                                  </span>
                                  <h3 className="font-semibold text-sm">
                                    {group.status} ({group.tables.length} bàn)
                                  </h3>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                                  {group.tables.map((t: any) =>
                                    renderTableButton(t)
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="space-y-4">
          <Card className="lg:sticky lg:top-20">
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
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={wantEmailNotification}
                      onChange={(e) =>
                        setWantEmailNotification(e.target.checked)
                      }
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    Tôi muốn nhận email xác nhận
                  </label>
                  {wantEmailNotification && (
                    <Input
                      type="email"
                      placeholder="Nhập email để nhận thông báo"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  )}
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
                <div className="pt-4 border-t border-gray-200">
                  {party >= 6 && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm font-semibold text-amber-900 mb-1">
                        ⚠️ Yêu cầu đặt cọc
                      </p>
                      <p className="text-xs text-amber-800">
                        Với {party} khách, nhà hàng yêu cầu đặt cọc để giữ chỗ.
                        Số tiền đặt cọc:{" "}
                        <span className="font-bold">
                          {formatVND(calculateDeposit)}
                        </span>{" "}
                        ({party} người × 50,000 VNĐ, tối thiểu 200,000 VNĐ).
                      </p>
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wantDeposit}
                        disabled={party >= 6}
                        onChange={(e) => {
                          if (party >= 6) return;
                          setWantDeposit(e.target.checked);
                          if (!e.target.checked) {
                            setDepositAmount(0);
                          } else if (depositAmount === 0) {
                            setDepositAmount(200000);
                          }
                        }}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {party >= 6
                          ? "Đặt cọc bắt buộc (tự động)"
                          : "Tôi muốn đặt cọc để giữ chỗ"}
                      </span>
                    </label>
                    {wantDeposit && (
                      <div className="mt-3 ml-6">
                        {party >= 6 ? (
                          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                            <p className="text-sm text-blue-900">
                              <span className="font-semibold">
                                Số tiền đặt cọc: {formatVND(depositAmount)}
                              </span>
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              Số tiền này sẽ được tính tự động và yêu cầu thanh
                              toán online để hoàn tất đặt bàn.
                            </p>
                          </div>
                        ) : (
                          <>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Số tiền đặt cọc (VNĐ)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="10000"
                              placeholder="Nhập số tiền đặt cọc"
                              value={depositAmount || ""}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setDepositAmount(value);
                              }}
                              className="w-full"
                            />
                            {depositAmount > 0 && (
                              <p className="mt-2 text-sm text-gray-600">
                                Số tiền đặt cọc:{" "}
                                <span className="font-semibold text-primary">
                                  {formatVND(depositAmount)}
                                </span>
                              </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                              Số tiền đặt cọc sẽ được trừ vào tổng hóa đơn khi
                              thanh toán.
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-muted-foreground mb-3">
                    {selectedTableIds.length > 0
                      ? `Đã chọn ${selectedTableIds.length} bàn · tổng sức chứa ${totalSelectedCapacity} khách`
                      : "Chưa chọn bàn (nhà hàng sẽ sắp xếp giúp bạn)"}
                  </div>
                  {selectedTableIds.length > 0 && remainingGuests > 0 && (
                    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      Còn thiếu {remainingGuests} chỗ để đủ cho {party} khách.
                      Vui lòng chọn thêm bàn hoặc điều chỉnh số khách.
                    </div>
                  )}
                  {selectedTableIds.length > 0 && remainingGuests <= 0 && (
                    <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      Đủ chỗ cho {party} khách. Nếu cần ghép sát nhau, hãy ghi
                      chú để nhà hàng hỗ trợ.
                    </div>
                  )}

                  {selectedTableIds.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {selectedTableIds.map((tableId) => {
                        const table = availableTables.find(
                          (t: any) => t.id === tableId
                        );
                        return (
                          <div
                            key={tableId}
                            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {table?.name || tableId}
                              </span>
                              {table?.tenTang && (
                                <span className="text-xs text-gray-600">
                                  ({table.tenTang})
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                - {table?.capacity || "?"} khách
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedTableIds(
                                  selectedTableIds.filter(
                                    (id) => id !== tableId
                                  )
                                )
                              }
                              className="text-red-600 hover:text-red-800 font-bold text-lg leading-none px-2 py-1 hover:bg-red-50 rounded"
                              title="Bỏ chọn bàn này"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-end">
                    <Button
                      type="submit"
                      disabled={!name || !dateTime || !hasEnoughCapacity}
                    >
                      Gửi yêu cầu đặt bàn
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingTab;

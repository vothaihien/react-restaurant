import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useAppContext } from "@/contexts/AppContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import { useAuth } from "@/contexts/AuthContext";
import { tablesApi } from "@/api/tables";
import { TableStatus } from "@/types/tables";
import AuthBox from "@/pages/customer/components/AuthBox";
import {
  CONTACT_EMAIL_KEY,
  CONTACT_NAME_KEY,
} from "@/pages/customer/constants";

const BookingTab: React.FC = () => {
  const { createReservation, getAvailableTables } = useAppContext() as any;
  const { user, isAuthenticated } = useAuth();
  const { notify } = useFeedback();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [party, setParty] = useState(2);
  const [dateTime, setDateTime] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [showAuthForBooking, setShowAuthForBooking] = useState(false);

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
  const [tangs, setTangs] = useState<Array<{ maTang: string; tenTang: string }>>([]);

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
        const tables = await getAvailableTables(dateTime.getTime(), party);
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

  useEffect(() => {
    if (!user || user.type !== "customer") return;
    setName((prev) => (prev ? prev : user.name || ""));
    const fallbackEmail =
      user.email ||
      (user.identifier && user.identifier.includes("@")
        ? user.identifier
        : undefined);
    if (fallbackEmail) setEmail((prev) => (prev ? prev : fallbackEmail));
    const fallbackPhone =
      user.phone ||
      (user.identifier && !user.identifier.includes("@")
        ? user.identifier
        : undefined);
    if (fallbackPhone) setPhone((prev) => (prev ? prev : fallbackPhone));
  }, [user]);

  useEffect(() => {
    if (!name) {
      const cachedName = localStorage.getItem(CONTACT_NAME_KEY);
      if (cachedName) setName(cachedName);
    }
    if (!email) {
      const cachedEmail = localStorage.getItem(CONTACT_EMAIL_KEY);
      if (cachedEmail) setEmail(cachedEmail);
    }
  }, [name, email]);

  useEffect(() => {
    if (name) localStorage.setItem(CONTACT_NAME_KEY, name);
  }, [name]);

  useEffect(() => {
    if (email) localStorage.setItem(CONTACT_EMAIL_KEY, email);
  }, [email]);

  const filteredTables = useMemo(() => {
    if (!selectedTang || selectedTang.trim() === "") return availableTables;
    const selectedMaTang = selectedTang.toString().trim();
    return availableTables.filter((t) => {
      const tableMaTang = (t.maTang || "").toString().trim();
      return tableMaTang === selectedMaTang;
    });
  }, [availableTables, selectedTang]);

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

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email || !dateTime) {
      notify({
        tone: "warning",
        title: "Thiếu thông tin đặt bàn",
        description:
          "Vui lòng nhập Họ tên, Điện thoại, Email và chọn ngày giờ mong muốn.",
      });
      return;
    }

    if (!isAuthenticated) {
      notify({
        tone: "warning",
        title: "Cần đăng nhập để đặt bàn",
        description:
          "Vui lòng đăng nhập hoặc đăng ký bằng Email/SĐT để quản lý lịch sử và hủy đặt bàn của bạn.",
      });
      setShowAuthForBooking(true);
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
        email,
        customerId:
          user && "customerId" in user && user.type === "customer"
            ? user.customerId
            : undefined,
        partySize: party,
        time: ts,
        source: "App",
        notes: notes || "",
        tableIds: tableIds.length > 0 ? tableIds : undefined,
      };

      await createReservation(reservationData);

      setName("");
      setPhone("");
      setEmail("");
      setParty(2);
      setDateTime(undefined);
      setNotes("");
      setSelectedTableIds([]);
      setAvailableTables([]);

      const selectedTablesNames = selectedTableIds
        .map((id) => availableTables.find((t) => t.id === id)?.name || id)
        .join(", ");

      notify({
        tone: "success",
        title: "Đã gửi yêu cầu",
        description:
          selectedTableIds.length > 0
            ? `Đã gửi yêu cầu đặt ${selectedTableIds.length} bàn (${selectedTablesNames}). Nhà hàng sẽ liên hệ lại để xác nhận.`
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

  useEffect(() => {
    if (isAuthenticated && showAuthForBooking) {
      setShowAuthForBooking(false);
    }
  }, [isAuthenticated, showAuthForBooking]);

  return (
    <div className="space-y-4">
      {!isAuthenticated && (
        <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-800">
            <div className="font-semibold text-indigo-900">
              Đăng nhập bằng Email / SĐT để quản lý lịch sử & hủy đặt bàn của bạn
            </div>
            <div className="text-xs sm:text-sm text-gray-700 mt-1">
              Khi đăng nhập, mỗi lần đặt bàn sẽ được lưu lại, bạn có thể xem lại
              và chủ động hủy trên mục Lịch sử.
            </div>
          </div>
          <Button
            variant="default"
            className="sm:flex-shrink-0"
            onClick={() => setShowAuthForBooking(true)}
          >
            Đăng nhập / Đăng ký nhanh
          </Button>
        </div>
      )}

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
                    <strong>{new Date(dateTime).toLocaleString("vi-VN")}</strong>{" "}
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
                <p className="text-sm text-gray-500 mt-1">
                  Bạn có thể chọn nhiều bàn nhỏ để đủ chỗ cho {party} khách. Tổng
                  sức chứa đã chọn sẽ hiển thị ngay bên dưới.
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

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                      {filteredTables.map((t: any) => {
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
                                setSelectedTableIds(
                                  selectedTableIds.filter((id) => id !== t.id)
                                );
                              } else {
                                setSelectedTableIds([
                                  ...selectedTableIds,
                                  t.id,
                                ]);
                              }
                            }}
                            className={`relative p-4 rounded-2xl border transition cursor-pointer bg-white/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex flex-col gap-2 overflow-hidden ${
                              selected ? "border-indigo-600 bg-indigo-50" : ""
                            }`}
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
                                  <span
                                    className={`h-2.5 w-2.5 rounded-full ${statusDotClass}`}
                                  />
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
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-600">
                                  {t.capacity} khách
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                  {t.status}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="Nhập email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
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
                  <div className="text-sm text-muted-foreground mb-3">
                    {selectedTableIds.length > 0
                      ? `Đã chọn ${selectedTableIds.length} bàn · tổng sức chứa ${totalSelectedCapacity} khách`
                      : "Chưa chọn bàn (nhà hàng sẽ sắp xếp giúp bạn)"}
                  </div>
                  {selectedTableIds.length > 0 && remainingGuests > 0 && (
                    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      Còn thiếu {remainingGuests} chỗ để đủ cho {party} khách. Vui
                      lòng chọn thêm bàn hoặc điều chỉnh số khách.
                    </div>
                  )}
                  {selectedTableIds.length > 0 && remainingGuests <= 0 && (
                    <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      Đủ chỗ cho {party} khách. Nếu cần ghép sát nhau, hãy ghi chú
                      để nhà hàng hỗ trợ.
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
                                  selectedTableIds.filter((id) => id !== tableId)
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

          {showAuthForBooking && !isAuthenticated && (
            <Card className="border border-dashed border-indigo-300 bg-indigo-50/40">
              <CardHeader>
                <CardTitle>Đăng nhập / Đăng ký để hoàn tất đặt bàn</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">
                  Vui lòng xác thực Email hoặc Số điện thoại để có thể xem lại
                  lịch sử và chủ động hủy đặt bàn sau này.
                </p>
                <AuthBox onSuccess={() => setShowAuthForBooking(false)} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingTab;


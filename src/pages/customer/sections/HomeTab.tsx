import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { menuApi } from "@/api/menu";
import { formatVND } from "@/utils";
import { BASE_URL } from "@/utils/api";
import { useFeedback } from "@/contexts/FeedbackContext";

type HomeTabProps = {
  onNavigate: (tab: "booking" | "menu") => void;
};

const HomeTab: React.FC<HomeTabProps> = ({ onNavigate }) => {
  const { notify } = useFeedback();
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState<any>(null);
  const [menuDetail, setMenuDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load menu đang áp dụng
  useEffect(() => {
    const loadMenus = async () => {
      setLoading(true);
      try {
        const response = await menuApi.getMenuDangApDung();
        const data = response?.data || response || [];
        // Chỉ lấy 6 menu đầu tiên để hiển thị
        setMenus(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch (error: any) {
        notify({
          tone: "error",
          title: "Lỗi tải menu",
          description: error?.message || "Không thể tải danh sách menu. Vui lòng thử lại.",
        });
        setMenus([]);
      } finally {
        setLoading(false);
      }
    };
    loadMenus();
  }, [notify]);

  // Load chi tiết menu khi click
  useEffect(() => {
    if (!selectedMenu) {
      setMenuDetail(null);
      return;
    }

    const loadMenuDetail = async () => {
      setLoadingDetail(true);
      try {
        const response = await menuApi.getChiTietMenu(selectedMenu.maMenu || selectedMenu.MaMenu);
        const data = response?.data || response;
        setMenuDetail(data);
      } catch (error: any) {
        notify({
          tone: "error",
          title: "Lỗi tải chi tiết menu",
          description: error?.message || "Không thể tải chi tiết menu. Vui lòng thử lại.",
        });
      } finally {
        setLoadingDetail(false);
      }
    };

    loadMenuDetail();
  }, [selectedMenu, notify]);

  const getImageUrl = (imageUrl: string | undefined) => {
    if (!imageUrl) return undefined;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }
    return `${BASE_URL}/${imageUrl.replace(/^\//, "")}`;
  };

  return (
  <div className="space-y-10">
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
          Khám phá hương vị truyền thống trong một không gian sang trọng và ấm
          cúng.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            className="h-12 px-6 text-base font-semibold"
            onClick={() => onNavigate("booking")}
          >
            Đặt bàn ngay
          </Button>
          <Button
            variant="outline"
            className="h-12 px-6 text-base font-semibold bg-white/10 border-white/60 text-white hover:bg-white/20"
            onClick={() => onNavigate("menu")}
          >
            Xem thực đơn
          </Button>
        </div>
      </div>
    </section>

    <section className="py-4 md:py-6">
      <h3 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-6">
        Menu Đặc Biệt
      </h3>
      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <p>Đang tải menu...</p>
        </div>
      ) : menus.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Hiện tại chưa có menu nào đang áp dụng.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menus.map((menu: any) => {
            const imageUrl = getImageUrl(menu.hinhAnh || menu.HinhAnh);
            const tenMenu = menu.tenMenu || menu.TenMenu || "";
            const loaiMenu = menu.loaiMenu || menu.LoaiMenu || menu.tenLoaiMenu || menu.TenLoaiMenu || "";
            const giaMenu = menu.giaMenu || menu.GiaMenu || 0;
            const giaGoc = menu.giaGoc || menu.GiaGoc;
            const phanTramGiamGia = menu.phanTramGiamGia || menu.PhanTramGiamGia || 0;
            const soLuongMonAn = menu.soLuongMonAn || menu.SoLuongMonAn || 0;
            
            return (
              <article
                key={menu.maMenu || menu.MaMenu}
                className="flex flex-col gap-3 pb-3 group cursor-pointer"
                onClick={() => setSelectedMenu(menu)}
              >
                <div className="w-full aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden transform group-hover:scale-105 transition-transform duration-300 ease-in-out relative">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={tenMenu}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🍽️</div>
                        <div className="text-sm">Chưa có ảnh</div>
                      </div>
                    </div>
                  )}
                  {phanTramGiamGia > 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{phanTramGiamGia}%
                    </div>
                  )}
                </div>
                <div className="text-center mt-1">
                  <p className="text-xl font-bold text-gray-900">{tenMenu}</p>
                  <p className="text-sm text-gray-600">{loaiMenu}</p>
                  {soLuongMonAn > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {soLuongMonAn} món trong menu
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-center gap-2">
                    {giaGoc && giaGoc > giaMenu && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatVND(giaGoc)}
                      </span>
                    )}
                    <p className="text-lg font-semibold text-primary">
                      {formatVND(giaMenu)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>

    {/* Modal xem chi tiết menu */}
    {selectedMenu && (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={() => setSelectedMenu(null)}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-900">
              {selectedMenu.tenMenu || selectedMenu.TenMenu || ""}
            </h3>
            <button
              onClick={() => setSelectedMenu(null)}
              className="text-gray-500 hover:text-gray-700 transition text-2xl"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {loadingDetail ? (
              <div className="text-center py-8 text-gray-500">
                <p>Đang tải chi tiết menu...</p>
              </div>
            ) : menuDetail ? (
              <>
                {/* Hình ảnh */}
                {menuDetail.hinhAnh || menuDetail.HinhAnh ? (
                  <div className="w-full aspect-video bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={getImageUrl(menuDetail.hinhAnh || menuDetail.HinhAnh)}
                      alt={menuDetail.tenMenu || menuDetail.TenMenu}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}

                {/* Thông tin */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-500">Loại menu:</span>
                      <span className="ml-2 text-gray-900 font-medium">
                        {menuDetail.tenLoaiMenu || menuDetail.TenLoaiMenu || menuDetail.loaiMenu || menuDetail.LoaiMenu || "Chưa phân loại"}
                      </span>
                    </div>
                    <div className="text-right">
                      {menuDetail.giaGoc && menuDetail.giaGoc > (menuDetail.giaMenu || menuDetail.GiaMenu) && (
                        <span className="text-sm text-gray-400 line-through block">
                          {formatVND(menuDetail.giaGoc || menuDetail.GiaGoc)}
                        </span>
                      )}
                      <p className="text-2xl font-bold text-primary">
                        {formatVND(menuDetail.giaMenu || menuDetail.GiaMenu || 0)}
                      </p>
                      {menuDetail.phanTramGiamGia > 0 && (
                        <span className="text-sm text-red-600 font-semibold">
                          Giảm {menuDetail.phanTramGiamGia}%
                        </span>
                      )}
                    </div>
                  </div>

                  {menuDetail.moTa || menuDetail.MoTa ? (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Mô tả:</p>
                      <p className="text-gray-700">{menuDetail.moTa || menuDetail.MoTa}</p>
                    </div>
                  ) : null}

                  {/* Danh sách món trong menu */}
                  {menuDetail.chiTietMenus && menuDetail.chiTietMenus.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-3">
                        Danh sách món trong menu:
                      </p>
                      <div className="space-y-2">
                        {menuDetail.chiTietMenus.map((ct: any, index: number) => {
                          const monAn = ct.monAn || ct.MonAn;
                          const tenMonAn = monAn?.tenMonAn || monAn?.TenMonAn || "Chưa có tên";
                          const soLuong = ct.soLuong || ct.SoLuong || 1;
                          const ghiChu = ct.ghiChu || ct.GhiChu;
                          const hinhAnh = monAn?.hinhAnh || monAn?.HinhAnh || (monAn?.HinhAnh && monAn.HinhAnh[0] ? monAn.HinhAnh[0].URL : null);
                          
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              {hinhAnh && (
                                <img
                                  src={getImageUrl(hinhAnh)}
                                  alt={tenMonAn}
                                  className="w-16 h-16 rounded-lg object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {tenMonAn}
                                </p>
                                {ghiChu && (
                                  <p className="text-xs text-gray-500 mt-1">{ghiChu}</p>
                                )}
                                <p className="text-xs text-gray-600 mt-1">
                                  Số lượng: {soLuong}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Trạng thái */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-3 w-3 rounded-full ${
                          (menuDetail.tenTrangThai || menuDetail.TenTrangThai || "").toLowerCase().includes("áp dụng")
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      />
                      <span className="text-sm text-gray-700">
                        {menuDetail.tenTrangThai || menuDetail.TenTrangThai || "Chưa xác định"}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Không thể tải chi tiết menu.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setSelectedMenu(null)}
            >
              Đóng
            </Button>
            <Button onClick={() => {
              setSelectedMenu(null);
              onNavigate("menu");
            }}>
              Xem trong thực đơn
            </Button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

export default HomeTab;


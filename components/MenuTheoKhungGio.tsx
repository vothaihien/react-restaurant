import React, { useState, useEffect } from "react";
import { menuApi } from "@/shared/api/menu";
import { BASE_URL } from "@/shared/utils/api";
import { formatVND } from "@/shared/utils";
import { useFeedback } from "@/core/context/FeedbackContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";

interface MenuItem {
  maMenu: string;
  tenMenu: string;
  loaiMenu: string;
  giaMenu: number;
  giaGoc?: number;
  phanTramGiamGia: number;
  moTa?: string;
  hinhAnh?: string;
  chiTietMenus: Array<{
    soLuong: number;
    ghiChu?: string;
    monAn: {
      tenMonAn: string;
      hinhAnh?: string;
      gia?: number;
    };
  }>;
}

interface MenuData {
  success: boolean;
  khungGio: string;
  tenKhungGio: string;
  isNgayLe: boolean;
  timeRemaining: number;
  nextTimeSlot: string;
  data: MenuItem[];
}

const MenuTheoKhungGio: React.FC = () => {
  const { notify } = useFeedback();
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);

  // Load menu hiện tại
  const loadMenu = async () => {
    setLoading(true);
    try {
      const data = await menuApi.getMenuHienTai();
      setMenuData(data);
      setTimeRemaining(data.timeRemaining || 0);
    } catch (error: any) {
      notify({
        tone: "error",
        title: "Lỗi tải menu",
        description: error?.message || "Không thể tải menu hiện tại",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
    // Refresh mỗi phút
    const interval = setInterval(() => {
      loadMenu();
    }, 60000); // 1 phút

    return () => clearInterval(interval);
  }, [notify]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          loadMenu(); // Reload khi hết thời gian
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${BASE_URL}/${url.replace(/^\//, "")}`;
  };

  const getKhungGioIcon = (khungGio: string) => {
    switch (khungGio) {
      case "SANG":
        return "🌅";
      case "TRUA":
        return "☀️";
      case "CHIEU":
        return "🌆";
      case "TOI":
        return "🌙";
      default:
        return "🍽️";
    }
  };

  if (loading && !menuData) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Đang tải menu...</p>
      </div>
    );
  }

  if (!menuData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header với thông tin khung giờ */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">
                  {getKhungGioIcon(menuData.khungGio)}
                </span>
                <div>
                  <h2 className="text-2xl font-bold">
                    Menu {menuData.tenKhungGio}
                  </h2>
                  {menuData.isNgayLe && (
                    <p className="text-sm text-yellow-200 mt-1">
                      🎉 Menu đặc biệt cho ngày lễ
                    </p>
                  )}
                </div>
              </div>
              <p className="text-indigo-100 text-sm">
                Menu sẽ tự động thay đổi theo khung giờ
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-indigo-100 mb-1">
                Còn lại trong khung giờ này:
              </div>
              <div className="text-3xl font-bold font-mono">
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danh sách menu */}
      {menuData.data.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              Chưa có menu nào cho khung giờ {menuData.tenKhungGio.toLowerCase()}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuData.data.map((menu) => (
            <Card
              key={menu.maMenu}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedMenu(menu)}
            >
              {menu.hinhAnh && (
                <img
                  src={getImageUrl(menu.hinhAnh)}
                  alt={menu.tenMenu}
                  className="w-full h-48 object-cover"
                />
              )}
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg text-gray-900">
                    {menu.tenMenu}
                  </h3>
                  {menu.loaiMenu && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                      {menu.loaiMenu}
                    </span>
                  )}
                </div>
                {menu.moTa && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {menu.moTa}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Giá:</span>
                    <div className="text-right">
                      {menu.giaGoc && menu.giaGoc > menu.giaMenu ? (
                        <>
                          <div className="text-sm text-gray-400 line-through">
                            {formatVND(menu.giaGoc)}
                          </div>
                          <div className="text-indigo-600 font-bold">
                            {formatVND(menu.giaMenu)}
                          </div>
                          {menu.phanTramGiamGia > 0 && (
                            <div className="text-xs text-red-600 font-semibold">
                              -{menu.phanTramGiamGia}%
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-indigo-600 font-bold">
                          {formatVND(menu.giaMenu)}
                        </div>
                      )}
                    </div>
                  </div>
                  {menu.chiTietMenus.length > 0 && (
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      {menu.chiTietMenus.length} món trong menu
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal chi tiết menu */}
      {selectedMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMenu(null)}
        >
          <Card
            className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{selectedMenu.tenMenu}</CardTitle>
                  {selectedMenu.loaiMenu && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedMenu.loaiMenu}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMenu(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Hình ảnh */}
              {selectedMenu.hinhAnh && (
                <img
                  src={getImageUrl(selectedMenu.hinhAnh)}
                  alt={selectedMenu.tenMenu}
                  className="w-full h-64 object-cover rounded"
                />
              )}

              {/* Mô tả */}
              {selectedMenu.moTa && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Mô tả</h5>
                  <p className="text-gray-700">{selectedMenu.moTa}</p>
                </div>
              )}

              {/* Giá */}
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Giá</h5>
                <div className="flex items-center gap-4">
                  {selectedMenu.giaGoc &&
                  selectedMenu.giaGoc > selectedMenu.giaMenu ? (
                    <>
                      <div className="text-2xl font-bold text-indigo-600">
                        {formatVND(selectedMenu.giaMenu)}
                      </div>
                      <div className="text-lg text-gray-400 line-through">
                        {formatVND(selectedMenu.giaGoc)}
                      </div>
                      {selectedMenu.phanTramGiamGia > 0 && (
                        <div className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
                          Giảm {selectedMenu.phanTramGiamGia}%
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-2xl font-bold text-indigo-600">
                      {formatVND(selectedMenu.giaMenu)}
                    </div>
                  )}
                </div>
              </div>

              {/* Chi tiết món trong menu */}
              {selectedMenu.chiTietMenus.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">
                    Danh sách món ({selectedMenu.chiTietMenus.length})
                  </h5>
                  <div className="space-y-2">
                    {selectedMenu.chiTietMenus.map((ct, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        {ct.monAn.hinhAnh && (
                          <img
                            src={getImageUrl(ct.monAn.hinhAnh)}
                            alt={ct.monAn.tenMonAn}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {ct.monAn.tenMonAn}
                          </div>
                          {ct.ghiChu && (
                            <div className="text-xs text-gray-500">
                              {ct.ghiChu}
                            </div>
                          )}
                        </div>
                        {ct.monAn.gia && (
                          <div className="text-indigo-600 font-semibold">
                            {formatVND(ct.monAn.gia)}
                          </div>
                        )}
                        {ct.soLuong > 1 && (
                          <div className="text-sm text-gray-500">
                            x{ct.soLuong}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MenuTheoKhungGio;


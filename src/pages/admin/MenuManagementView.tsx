import React, { useState, useEffect, useMemo } from "react";
import { menuApi } from "@/api/menu";
import { useFeedback } from "@/contexts/FeedbackContext";
import { BASE_URL } from "@/utils/api";
import { formatVND } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FALLBACK_CARD_IMAGE } from "@/utils/placeholders";

interface MenuItem {
  maMenu: string;
  tenMenu: string;
  loaiMenu?: string;
  maLoaiMenu?: string;
  giaMenu: number;
  giaGoc?: number;
  phanTramGiamGia?: number;
  moTa?: string;
  hinhAnh?: string;
  ngayBatDau?: string;
  ngayKetThuc?: string;
  trangThai?: string;
  maTrangThai?: string;
  chiTietMenus?: Array<{
    soLuong: number;
    ghiChu?: string;
    monAn?: {
      tenMonAn: string;
      hinhAnh?: string;
      gia?: number;
    };
  }>;
}

interface LoaiMenu {
  maLoaiMenu: string;
  tenLoaiMenu: string;
}

interface TrangThaiMenu {
  maTrangThai: string;
  tenTrangThai: string;
}

interface CongThuc {
  maCongThuc: string;
  tenMonAn: string;
  tenPhienBan: string;
  gia: number;
  tenChiTietMonAn?: string;
}

interface ChiTietMenuForm {
  maMonAn: string;
  maPhienBan: string;
  maCongThuc: string;
  soLuong: number;
  ghiChu: string;
  thuTu: number;
}

interface MonAnOption {
  maMonAn: string;
  tenMonAn: string;
  phienBans: Array<{
    maPhienBan: string;
    tenPhienBan: string;
    congThucs: Array<{
      maCongThuc: string;
      gia: number;
    }>;
  }>;
}

const MenuManagementView: React.FC = () => {
  const { notify, confirm } = useFeedback();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loaiMenus, setLoaiMenus] = useState<LoaiMenu[]>([]);
  const [trangThaiMenus, setTrangThaiMenus] = useState<TrangThaiMenu[]>([]);
  const [monAnOptions, setMonAnOptions] = useState<MonAnOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailMenu, setDetailMenu] = useState<any>(null);
  const [chiTietMenus, setChiTietMenus] = useState<ChiTietMenuForm[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    tenMenu: "",
    maLoaiMenu: "",
    maTrangThai: "",
    giaMenu: 0,
    giaGoc: 0,
    moTa: "",
    hinhAnh: "",
    ngayBatDau: "",
    ngayKetThuc: "",
    thuTu: 0,
    isShow: true,
  });

  // Load danh sách menu
  const loadMenus = async () => {
    setLoading(true);
    try {
      const response = await menuApi.getAllMenus();
      let menuList: MenuItem[] = [];

      if (Array.isArray(response)) {
        menuList = response;
      } else if (response && typeof response === "object") {
        if (Array.isArray(response.data)) {
          menuList = response.data;
        } else if (Array.isArray((response as any).Data)) {
          menuList = (response as any).Data;
        }
      }

      // Map dữ liệu
      const mapped: MenuItem[] = menuList.map((m: any) => ({
        maMenu: m.maMenu || m.MaMenu || "",
        tenMenu: m.tenMenu || m.TenMenu || "",
        loaiMenu:
          m.tenLoaiMenu || m.TenLoaiMenu || m.loaiMenu || m.LoaiMenu || "",
        maLoaiMenu: m.maLoaiMenu || m.MaLoaiMenu || "",
        giaMenu: Number(m.giaMenu || m.GiaMenu) || 0,
        giaGoc: m.giaGoc || m.GiaGoc ? Number(m.giaGoc || m.GiaGoc) : undefined,
        phanTramGiamGia: m.phanTramGiamGia || m.PhanTramGiamGia || 0,
        moTa: m.moTa || m.MoTa || "",
        hinhAnh: m.hinhAnh || m.HinhAnh || "",
        ngayBatDau: m.ngayBatDau || m.NgayBatDau || "",
        ngayKetThuc: m.ngayKetThuc || m.NgayKetThuc || "",
        trangThai:
          m.tenTrangThai || m.TenTrangThai || m.trangThai || m.TrangThai || "",
        maTrangThai: m.maTrangThai || m.MaTrangThai || "",
        chiTietMenus: m.chiTietMenus || m.ChiTietMenus || [],
      }));

      setMenus(mapped);
    } catch (error: any) {
      notify({
        tone: "error",
        title: "Lỗi tải danh sách menu",
        description: error?.message || "Không thể tải danh sách menu",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load loại menu
  const loadLoaiMenus = async () => {
    try {
      const response = await menuApi.getLoaiMenus();
      const data = response?.data || response || [];
      const mapped = (data || []).map((lm: any) => ({
        maLoaiMenu: lm.maLoaiMenu || lm.MaLoaiMenu || "",
        tenLoaiMenu: lm.tenLoaiMenu || lm.TenLoaiMenu || "",
      }));
      setLoaiMenus(mapped);
    } catch (error: any) {
      console.error("Lỗi tải loại menu:", error);
    }
  };

  // Load trạng thái menu
  const loadTrangThaiMenus = async () => {
    try {
      const response = await menuApi.getTrangThaiMenus();
      const data = response?.data || response || [];
      const mapped = (data || []).map((tt: any) => ({
        maTrangThai: tt.maTrangThai || tt.MaTrangThai || "",
        tenTrangThai: tt.tenTrangThai || tt.TenTrangThai || "",
      }));
      setTrangThaiMenus(mapped);
    } catch (error: any) {
      console.error("Lỗi tải trạng thái menu:", error);
    }
  };

  // Load danh sách món ăn từ thực đơn
  const loadMonAnOptions = async () => {
    try {
      const dishes = await menuApi.getDishes();
      const options: MonAnOption[] = [];

      for (const dish of dishes) {
        const maMonAn = dish.maMonAn || dish.MaMonAn || "";
        const tenMonAn = dish.tenMonAn || dish.TenMonAn || "";

        // Load chi tiết món ăn để lấy đầy đủ phiên bản và công thức
        try {
          const dishDetail = await menuApi.getDish(maMonAn);
          const phienBans =
            dishDetail?.phienBanMonAns || dishDetail?.PhienBanMonAns || [];

          if (phienBans.length > 0) {
            const phienBanList = phienBans
              .map((pb: any) => {
                // Backend trả về CongThucNauAns là mảng các nguyên liệu của công thức
                // Mỗi nguyên liệu có MaCongThuc, tất cả nguyên liệu trong cùng một công thức có cùng MaCongThuc
                // Group theo MaCongThuc để lấy danh sách công thức duy nhất
                const congThucNauAns =
                  pb.congThucNauAns || pb.CongThucNauAns || [];

                // Group theo MaCongThuc để lấy danh sách công thức duy nhất
                const congThucMap = new Map<
                  string,
                  { maCongThuc: string; gia: number }
                >();

                // Nếu có nguyên liệu trong CongThucNauAns, lấy MaCongThuc từ đó
                if (congThucNauAns.length > 0) {
                  congThucNauAns.forEach((ct: any) => {
                    const maCongThuc = ct.maCongThuc || ct.MaCongThuc || "";
                    if (maCongThuc && !congThucMap.has(maCongThuc)) {
                      // Lấy giá từ phiên bản (backend đã tính sẵn)
                      congThucMap.set(maCongThuc, {
                        maCongThuc: maCongThuc,
                        gia: Number(pb.gia || pb.Gia || 0),
                      });
                    }
                  });
                }

                // Nếu không có công thức trong CongThucNauAns, bỏ qua phiên bản này
                // (không log warning để tránh spam console)
                if (congThucMap.size === 0) {
                  return null;
                }

                return {
                  maPhienBan: pb.maPhienBan || pb.MaPhienBan || "",
                  tenPhienBan: pb.tenPhienBan || pb.TenPhienBan || "",
                  congThucs: Array.from(congThucMap.values()),
                };
              })
              .filter((pb: any) => pb !== null && pb.congThucs.length > 0); // Lọc bỏ null và chỉ lấy phiên bản có công thức

            // Chỉ thêm món ăn vào options nếu có ít nhất một phiên bản có công thức
            if (phienBanList.length > 0) {
              options.push({
                maMonAn,
                tenMonAn,
                phienBans: phienBanList,
              });
            }
          }
        } catch (err) {
          // Bỏ qua lỗi cho từng món ăn, không log để tránh spam
          // Chỉ log trong development mode
          if (process.env.NODE_ENV === "development") {
            console.error(`Lỗi load chi tiết món ${maMonAn}:`, err);
          }
        }
      }

      setMonAnOptions(options);
    } catch (error: any) {
      console.error("Lỗi tải món ăn:", error);
      notify({
        tone: "warning",
        title: "Cảnh báo",
        description: "Không thể tải danh sách món ăn. Vui lòng thử lại.",
      });
    }
  };

  useEffect(() => {
    loadMenus();
    loadLoaiMenus();
    loadTrangThaiMenus();
    loadMonAnOptions();
  }, []);

  // Tính tổng giá gốc từ các món ăn trong menu
  const calculateGiaGoc = useMemo(() => {
    let total = 0;
    chiTietMenus.forEach((ct) => {
      if (ct.maMonAn && ct.maPhienBan && ct.maCongThuc) {
        const selectedMonAn = monAnOptions.find(
          (m) => m.maMonAn === ct.maMonAn
        );
        const selectedPhienBan = selectedMonAn?.phienBans.find(
          (pb) => pb.maPhienBan === ct.maPhienBan
        );
        const selectedCongThuc = selectedPhienBan?.congThucs.find(
          (c) => c.maCongThuc === ct.maCongThuc
        );

        if (selectedCongThuc) {
          total += selectedCongThuc.gia * ct.soLuong;
        }
      }
    });
    return total;
  }, [chiTietMenus, monAnOptions]);

  // Tự động cập nhật giá gốc khi chiTietMenus thay đổi (chỉ khi thêm menu mới)
  useEffect(() => {
    if (isModalOpen && !isEditMode && calculateGiaGoc > 0) {
      // Chỉ tự động cập nhật khi đang thêm menu mới và có món trong menu
      setFormData((prev) => ({
        ...prev,
        giaGoc: calculateGiaGoc,
      }));
    }
  }, [calculateGiaGoc, isModalOpen, isEditMode]);

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setSelectedMenu(null);
    setFormData({
      tenMenu: "",
      maLoaiMenu: "",
      maTrangThai: "",
      giaMenu: 0,
      giaGoc: 0,
      moTa: "",
      hinhAnh: "",
      ngayBatDau: "",
      ngayKetThuc: "",
      thuTu: 0,
      isShow: true,
    });
    setChiTietMenus([]);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (menu: MenuItem) => {
    setIsEditMode(true);
    setSelectedMenu(menu);

    // Load chi tiết menu để lấy đầy đủ thông tin
    try {
      const detail = await menuApi.getChiTietMenu(menu.maMenu);
      const menuDetail = detail?.data || detail;

      // Lấy maLoaiMenu và maTrangThai từ chi tiết menu hoặc từ menu object
      const maLoaiMenu =
        menuDetail?.MaLoaiMenu ||
        menuDetail?.maLoaiMenu ||
        menu.maLoaiMenu ||
        "";
      const maTrangThai =
        menuDetail?.MaTrangThai ||
        menuDetail?.maTrangThai ||
        menu.maTrangThai ||
        "";

      setFormData({
        tenMenu: menu.tenMenu,
        maLoaiMenu: maLoaiMenu,
        maTrangThai: maTrangThai,
        giaMenu: menu.giaMenu,
        giaGoc: menu.giaGoc || 0,
        moTa: menu.moTa || "",
        hinhAnh: menu.hinhAnh || "",
        ngayBatDau: menu.ngayBatDau || "",
        ngayKetThuc: menu.ngayKetThuc || "",
        thuTu: 0,
        isShow: true,
      });

      // Load chi tiết menu (danh sách món ăn)
      const chiTiet =
        menuDetail?.ChiTietMenus || menuDetail?.chiTietMenus || [];
      setChiTietMenus(
        chiTiet.map((ct: any, index: number) => {
          const monAn = ct.MonAn || ct.monAn || {};
          return {
            maMonAn: monAn.MaMonAn || monAn.maMonAn || "",
            maPhienBan:
              monAn.MaPhienBan || ct.MaPhienBan || ct.maPhienBan || "",
            maCongThuc: ct.MaCongThuc || ct.maCongThuc || "",
            soLuong: ct.SoLuong || ct.soLuong || 1,
            ghiChu: ct.GhiChu || ct.ghiChu || "",
            thuTu: ct.ThuTu || ct.thuTu || index + 1,
          };
        })
      );
    } catch (error) {
      console.error("Lỗi tải chi tiết menu:", error);
      // Fallback: sử dụng dữ liệu từ menu object
      setFormData({
        tenMenu: menu.tenMenu,
        maLoaiMenu: menu.maLoaiMenu || "",
        maTrangThai: menu.maTrangThai || "",
        giaMenu: menu.giaMenu,
        giaGoc: menu.giaGoc || 0,
        moTa: menu.moTa || "",
        hinhAnh: menu.hinhAnh || "",
        ngayBatDau: menu.ngayBatDau || "",
        ngayKetThuc: menu.ngayKetThuc || "",
        thuTu: 0,
        isShow: true,
      });
      setChiTietMenus([]);
      notify({
        tone: "warning",
        title: "Cảnh báo",
        description: "Không thể tải đầy đủ thông tin menu. Vui lòng thử lại.",
      });
    }

    setIsModalOpen(true);
  };

  const handleViewDetail = async (menu: MenuItem) => {
    try {
      const detail = await menuApi.getChiTietMenu(menu.maMenu);
      setDetailMenu(detail?.data || detail);
      setIsDetailModalOpen(true);
    } catch (error: any) {
      notify({
        tone: "error",
        title: "Lỗi tải chi tiết",
        description: error?.message || "Không thể tải chi tiết menu",
      });
    }
  };

  const handleDelete = async (maMenu: string) => {
    const shouldDelete = await confirm({
      title: "Xóa menu",
      description: "Bạn có chắc chắn muốn xóa menu này?",
      confirmText: "Xóa",
      cancelText: "Hủy",
      tone: "danger",
    });

    if (!shouldDelete) return;

    try {
      await menuApi.deleteMenu(maMenu);
      notify({
        tone: "success",
        title: "Đã xóa menu",
        description: "Menu đã được xóa thành công",
      });
      loadMenus();
    } catch (error: any) {
      notify({
        tone: "error",
        title: "Lỗi xóa menu",
        description: error?.message || "Không thể xóa menu",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate bước 2
    if (chiTietMenus.length === 0) {
      notify({
        tone: "warning",
        title: "Thiếu thông tin",
        description: "Vui lòng thêm ít nhất một món ăn vào menu",
      });
      return;
    }

    // Validate từng món ăn và tự động tìm công thức nếu thiếu
    const updatedChiTiet = [...chiTietMenus];

    for (let i = 0; i < updatedChiTiet.length; i++) {
      const ct = updatedChiTiet[i];

      if (!ct.maMonAn || !ct.maPhienBan) {
        notify({
          tone: "warning",
          title: "Thiếu thông tin",
          description:
            "Vui lòng chọn đầy đủ món ăn và phiên bản cho tất cả các món",
        });
        return;
      }

      // Nếu chưa có maCongThuc, tự động tìm từ phiên bản đã chọn
      if (!ct.maCongThuc) {
        const selectedMonAn = monAnOptions.find(
          (m) => m.maMonAn === ct.maMonAn
        );
        const selectedPhienBan = selectedMonAn?.phienBans.find(
          (pb) => pb.maPhienBan === ct.maPhienBan
        );

        if (selectedPhienBan && selectedPhienBan.congThucs.length > 0) {
          updatedChiTiet[i].maCongThuc =
            selectedPhienBan.congThucs[0].maCongThuc;
        } else {
          // Nếu không tìm thấy trong cache, thử load lại chi tiết món ăn
          try {
            const dishDetail = await menuApi.getDish(ct.maMonAn);
            const phienBans =
              dishDetail?.phienBanMonAns || dishDetail?.PhienBanMonAns || [];
            const pb = phienBans.find(
              (p: any) => (p.maPhienBan || p.MaPhienBan) === ct.maPhienBan
            );

            if (pb) {
              const congThucs = pb.congThucNauAns || pb.CongThucNauAns || [];
              if (congThucs.length > 0) {
                updatedChiTiet[i].maCongThuc =
                  congThucs[0].maCongThuc || congThucs[0].MaCongThuc || "";
              } else {
                notify({
                  tone: "warning",
                  title: "Thiếu thông tin",
                  description: `Phiên bản "${
                    pb.tenPhienBan || pb.TenPhienBan || ct.maPhienBan
                  }" không có công thức. Vui lòng chọn phiên bản khác.`,
                });
                return;
              }
            } else {
              notify({
                tone: "warning",
                title: "Thiếu thông tin",
                description: `Không tìm thấy phiên bản "${ct.maPhienBan}" cho món này.`,
              });
              return;
            }
          } catch (err) {
            console.error("Lỗi load chi tiết món:", err);
            notify({
              tone: "warning",
              title: "Thiếu thông tin",
              description: `Không thể tải công thức cho món "${
                selectedMonAn?.tenMonAn || ct.maMonAn
              }". Vui lòng thử lại.`,
            });
            return;
          }
        }
      }
    }

    // Cập nhật state với công thức đã tìm được
    if (JSON.stringify(updatedChiTiet) !== JSON.stringify(chiTietMenus)) {
      setChiTietMenus(updatedChiTiet);
    }

    try {
      let imageUrl: string | undefined = undefined;

      // Upload ảnh nếu có file mới
      if (imageFile) {
        try {
          const uploadResult = await menuApi.uploadMenuImage(imageFile);
          imageUrl = uploadResult.url;
          if (!imageUrl) {
            throw new Error("Không nhận được URL ảnh từ server");
          }
        } catch (uploadError: any) {
          notify({
            tone: "error",
            title: "Lỗi upload ảnh",
            description: uploadError?.message || "Không thể tải ảnh lên",
          });
          return;
        }
      } else if (formData.hinhAnh && !formData.hinhAnh.startsWith("data:")) {
        // Nếu có URL ảnh (không phải base64), sử dụng nó
        imageUrl = formData.hinhAnh;
      }

      const menuData = {
        TenMenu: formData.tenMenu,
        MaLoaiMenu: formData.maLoaiMenu || undefined, // Backend sẽ default "LM001" nếu null
        MaTrangThai: formData.maTrangThai || undefined, // Backend sẽ default "CHUA_AP_DUNG" nếu null
        GiaMenu: formData.giaMenu,
        GiaGoc: formData.giaGoc > 0 ? formData.giaGoc : undefined,
        MoTa: formData.moTa || undefined,
        HinhAnh: imageUrl || undefined,
        NgayBatDau: formData.ngayBatDau || undefined,
        NgayKetThuc: formData.ngayKetThuc || undefined,
        ThuTu: formData.thuTu || undefined,
        IsShow: formData.isShow,
        ChiTietMenus: updatedChiTiet.map((ct) => ({
          MaCongThuc: ct.maCongThuc,
          SoLuong: ct.soLuong,
          GhiChu: ct.ghiChu || "",
          ThuTu: ct.thuTu,
        })),
      };

      if (isEditMode && selectedMenu) {
        await menuApi.updateMenu(selectedMenu.maMenu, menuData);
        notify({
          tone: "success",
          title: "Đã cập nhật menu",
          description: "Menu đã được cập nhật thành công",
        });
      } else {
        await menuApi.createMenu(menuData);
        notify({
          tone: "success",
          title: "Đã tạo menu",
          description: "Menu đã được tạo thành công",
        });
      }
      setIsModalOpen(false);
      setImageFile(null);
      loadMenus();
    } catch (error: any) {
      console.error("Lỗi khi tạo/cập nhật menu:", error);
      notify({
        tone: "error",
        title: isEditMode ? "Lỗi cập nhật menu" : "Lỗi tạo menu",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể lưu menu",
      });
    }
  };

  const getImageUrl = (url?: string) => {
    if (!url) return FALLBACK_CARD_IMAGE;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const cleanUrl = url.replace(/^\//, "");
    return `${BASE_URL}/${cleanUrl}`;
  };

  if (loading && menus.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Đang tải danh sách menu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý Menu</h2>
        <Button onClick={handleOpenAddModal}>+ Thêm menu mới</Button>
      </div>

      {menus.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Chưa có menu nào</p>
            <Button onClick={handleOpenAddModal} className="mt-4">
              Tạo menu đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menus.map((menu) => (
            <Card
              key={menu.maMenu}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              {menu.hinhAnh && (
                <img
                  src={getImageUrl(menu.hinhAnh)}
                  alt={menu.tenMenu}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_CARD_IMAGE;
                  }}
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
                <div className="space-y-2 mb-4">
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
                          {menu.phanTramGiamGia && menu.phanTramGiamGia > 0 && (
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
                  {menu.chiTietMenus && menu.chiTietMenus.length > 0 && (
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      {menu.chiTietMenus.length} món trong menu
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetail(menu)}
                    className="flex-1"
                  >
                    Chi tiết
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditModal(menu)}
                    className="flex-1"
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(menu.maMenu)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal thêm/sửa menu */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0"
          onClick={() => setIsModalOpen(false)}
        >
          <Card
            className="w-full h-full max-w-full max-h-full rounded-none flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">
                  {isEditMode ? "Sửa menu" : "Thêm menu mới"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsModalOpen(false);
                  }}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <form onSubmit={handleSubmit} className="h-full flex flex-col">
                <div className="flex-1 grid grid-cols-2 gap-0 overflow-hidden">
                  {/* Cột trái: Thông tin menu */}
                  <div className="border-r p-6 overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">
                      Thông tin menu
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên menu *
                        </label>
                        <Input
                          value={formData.tenMenu}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tenMenu: e.target.value,
                            })
                          }
                          placeholder="Ví dụ: Combo sáng, Set trưa..."
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Giá menu (VNĐ) *
                          </label>
                          <Input
                            type="number"
                            value={formData.giaMenu}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                giaMenu: Number(e.target.value) || 0,
                              })
                            }
                            min="0"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Giá gốc (VNĐ)
                          </label>
                          <Input
                            type="number"
                            value={formData.giaGoc}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                giaGoc: Number(e.target.value) || 0,
                              })
                            }
                            min="0"
                            placeholder="Tự động tính"
                          />
                          {calculateGiaGoc > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              Tổng giá các món: {formatVND(calculateGiaGoc)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {loaiMenus.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Loại menu
                            </label>
                            <select
                              value={formData.maLoaiMenu}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  maLoaiMenu: e.target.value,
                                })
                              }
                              className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900"
                            >
                              <option value="">Chọn loại menu</option>
                              {loaiMenus.map((lm) => (
                                <option
                                  key={lm.maLoaiMenu}
                                  value={lm.maLoaiMenu}
                                >
                                  {lm.tenLoaiMenu}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {trangThaiMenus.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Trạng thái menu
                            </label>
                            <select
                              value={formData.maTrangThai}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  maTrangThai: e.target.value,
                                })
                              }
                              className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900"
                            >
                              <option value="">Chọn trạng thái</option>
                              {trangThaiMenus.map((tt) => (
                                <option
                                  key={tt.maTrangThai}
                                  value={tt.maTrangThai}
                                >
                                  {tt.tenTrangThai}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mô tả
                        </label>
                        <textarea
                          value={formData.moTa}
                          onChange={(e) =>
                            setFormData({ ...formData, moTa: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900"
                          rows={3}
                          placeholder="Mô tả về menu..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ngày bắt đầu
                          </label>
                          <Input
                            type="date"
                            value={formData.ngayBatDau}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ngayBatDau: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ngày kết thúc
                          </label>
                          <Input
                            type="date"
                            value={formData.ngayKetThuc}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ngayKetThuc: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hình ảnh menu
                        </label>
                        <div className="space-y-2">
                          <input
                            type="file"
                            id="hinhAnh"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setImageFile(file);
                                // Tạo URL preview
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setFormData({
                                    ...formData,
                                    hinhAnh: reader.result as string,
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="hinhAnh"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                          >
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Tải ảnh lên
                          </label>
                          {formData.hinhAnh && (
                            <div className="mt-2">
                              <img
                                src={formData.hinhAnh}
                                alt="Preview"
                                className="max-w-full h-48 object-cover rounded-md border border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    hinhAnh: "",
                                  });
                                  setImageFile(null);
                                  const fileInput = document.getElementById(
                                    "hinhAnh"
                                  ) as HTMLInputElement;
                                  if (fileInput) {
                                    fileInput.value = "";
                                  }
                                }}
                                className="mt-2 text-sm text-red-600 hover:text-red-700"
                              >
                                Xóa ảnh
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isShow"
                          checked={formData.isShow}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isShow: e.target.checked,
                            })
                          }
                          className="w-4 h-4"
                        />
                        <label
                          htmlFor="isShow"
                          className="text-sm text-gray-700"
                        >
                          Hiển thị menu
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: Danh sách món ăn */}
                  <div className="p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Món ăn trong menu
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setChiTietMenus([
                            ...chiTietMenus,
                            {
                              maMonAn: "",
                              maPhienBan: "",
                              maCongThuc: "",
                              soLuong: 1,
                              ghiChu: "",
                              thuTu: chiTietMenus.length + 1,
                            },
                          ]);
                        }}
                      >
                        + Thêm món
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {chiTietMenus.map((ct, index) => {
                        const selectedMonAn = monAnOptions.find(
                          (m) => m.maMonAn === ct.maMonAn
                        );
                        const selectedPhienBan = selectedMonAn?.phienBans.find(
                          (pb) => pb.maPhienBan === ct.maPhienBan
                        );
                        const selectedCongThuc =
                          selectedPhienBan?.congThucs.find(
                            (c) => c.maCongThuc === ct.maCongThuc
                          );

                        return (
                          <div
                            key={index}
                            className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                          >
                            <div className="space-y-2">
                              <div className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-5">
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Món ăn *
                                  </label>
                                  <select
                                    value={ct.maMonAn}
                                    onChange={(e) => {
                                      const updated = [...chiTietMenus];
                                      updated[index].maMonAn = e.target.value;
                                      updated[index].maPhienBan = "";
                                      updated[index].maCongThuc = "";
                                      setChiTietMenus(updated);
                                    }}
                                    className="w-full h-9 px-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900"
                                    required
                                  >
                                    <option value="">Chọn món ăn</option>
                                    {monAnOptions.map((m) => (
                                      <option key={m.maMonAn} value={m.maMonAn}>
                                        {m.tenMonAn}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-span-4">
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Phiên bản *
                                  </label>
                                  <select
                                    value={ct.maPhienBan}
                                    onChange={async (e) => {
                                      const updated = [...chiTietMenus];
                                      const newMaPhienBan = e.target.value;
                                      updated[index].maPhienBan = newMaPhienBan;

                                      // Tự động chọn công thức đầu tiên của phiên bản
                                      const currentMonAn = monAnOptions.find(
                                        (m) =>
                                          m.maMonAn === updated[index].maMonAn
                                      );
                                      const pb = currentMonAn?.phienBans.find(
                                        (p) => p.maPhienBan === newMaPhienBan
                                      );

                                      if (pb && pb.congThucs.length > 0) {
                                        updated[index].maCongThuc =
                                          pb.congThucs[0].maCongThuc;
                                        setChiTietMenus(updated);
                                      } else {
                                        // Nếu không tìm thấy trong cache, thử load lại từ API
                                        try {
                                          const dishDetail =
                                            await menuApi.getDish(
                                              updated[index].maMonAn
                                            );
                                          const phienBans =
                                            dishDetail?.phienBanMonAns ||
                                            dishDetail?.PhienBanMonAns ||
                                            [];
                                          const foundPb = phienBans.find(
                                            (p: any) =>
                                              (p.maPhienBan || p.MaPhienBan) ===
                                              newMaPhienBan
                                          );

                                          if (foundPb) {
                                            const congThucs =
                                              foundPb.congThucNauAns ||
                                              foundPb.CongThucNauAns ||
                                              [];
                                            if (congThucs.length > 0) {
                                              updated[index].maCongThuc =
                                                congThucs[0].maCongThuc ||
                                                congThucs[0].MaCongThuc ||
                                                "";
                                              setChiTietMenus(updated);
                                            } else {
                                              updated[index].maCongThuc = "";
                                              setChiTietMenus(updated);
                                              notify({
                                                tone: "warning",
                                                title: "Cảnh báo",
                                                description: `Phiên bản "${
                                                  foundPb.tenPhienBan ||
                                                  foundPb.TenPhienBan ||
                                                  newMaPhienBan
                                                }" không có công thức.`,
                                              });
                                            }
                                          } else {
                                            updated[index].maCongThuc = "";
                                            setChiTietMenus(updated);
                                          }
                                        } catch (err) {
                                          console.error(
                                            "Lỗi load chi tiết món:",
                                            err
                                          );
                                          updated[index].maCongThuc = "";
                                          setChiTietMenus(updated);
                                        }
                                      }
                                    }}
                                    className="w-full h-9 px-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900"
                                    required
                                    disabled={!ct.maMonAn}
                                  >
                                    <option value="">Chọn phiên bản</option>
                                    {selectedMonAn?.phienBans.map((pb) => (
                                      <option
                                        key={pb.maPhienBan}
                                        value={pb.maPhienBan}
                                      >
                                        {pb.tenPhienBan}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Số lượng *
                                  </label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={ct.soLuong}
                                    onChange={(e) => {
                                      const updated = [...chiTietMenus];
                                      updated[index].soLuong =
                                        Number(e.target.value) || 1;
                                      setChiTietMenus(updated);
                                    }}
                                    className="h-9 text-sm"
                                    required
                                  />
                                </div>
                                <div className="col-span-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setChiTietMenus(
                                        chiTietMenus.filter(
                                          (_, i) => i !== index
                                        )
                                      );
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full h-9"
                                  >
                                    ✕
                                  </Button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  Ghi chú
                                </label>
                                <Input
                                  value={ct.ghiChu}
                                  onChange={(e) => {
                                    const updated = [...chiTietMenus];
                                    updated[index].ghiChu = e.target.value;
                                    setChiTietMenus(updated);
                                  }}
                                  placeholder="Ghi chú cho món này..."
                                  className="h-9 text-sm"
                                />
                              </div>
                              {selectedCongThuc && (
                                <div className="text-xs text-gray-500 pt-1 border-t">
                                  <span className="font-medium">Giá:</span>{" "}
                                  {formatVND(selectedCongThuc.gia)} ×{" "}
                                  {ct.soLuong} ={" "}
                                  <span className="font-semibold text-indigo-600">
                                    {formatVND(
                                      selectedCongThuc.gia * ct.soLuong
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {chiTietMenus.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-sm text-gray-500 mb-2">
                            Chưa có món nào
                          </p>
                          <p className="text-xs text-gray-400">
                            Nhấn "Thêm món" để thêm món ăn vào menu
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nút submit - cố định ở dưới */}
                <div className="border-t p-4 bg-gray-50 flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button type="submit">
                    {isEditMode ? "Cập nhật menu" : "Tạo menu"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal xem chi tiết menu */}
      {isDetailModalOpen && detailMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <Card
            className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>
                  Chi tiết menu: {detailMenu.TenMenu || detailMenu.tenMenu}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Loại menu:
                  </label>
                  <p className="text-gray-900">
                    {detailMenu.LoaiMenu || detailMenu.loaiMenu || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Trạng thái:
                  </label>
                  <p className="text-gray-900">
                    {detailMenu.TenTrangThai || detailMenu.trangThai || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Giá menu:
                  </label>
                  <p className="text-gray-900 font-bold">
                    {formatVND(detailMenu.GiaMenu || detailMenu.giaMenu || 0)}
                  </p>
                </div>
                {detailMenu.GiaGoc || detailMenu.giaGoc ? (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Giá gốc:
                    </label>
                    <p className="text-gray-900">
                      <span className="line-through text-gray-400">
                        {formatVND(detailMenu.GiaGoc || detailMenu.giaGoc || 0)}
                      </span>
                      {detailMenu.PhanTramGiamGia ||
                      detailMenu.phanTramGiamGia ? (
                        <span className="ml-2 text-red-600 font-semibold">
                          (-
                          {detailMenu.PhanTramGiamGia ||
                            detailMenu.phanTramGiamGia}
                          %)
                        </span>
                      ) : null}
                    </p>
                  </div>
                ) : null}
                {detailMenu.NgayBatDau || detailMenu.ngayBatDau ? (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Ngày bắt đầu:
                    </label>
                    <p className="text-gray-900">
                      {new Date(
                        detailMenu.NgayBatDau || detailMenu.ngayBatDau
                      ).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                ) : null}
                {detailMenu.NgayKetThuc || detailMenu.ngayKetThuc ? (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Ngày kết thúc:
                    </label>
                    <p className="text-gray-900">
                      {new Date(
                        detailMenu.NgayKetThuc || detailMenu.ngayKetThuc
                      ).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                ) : null}
              </div>

              {detailMenu.MoTa || detailMenu.moTa ? (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Mô tả:
                  </label>
                  <p className="text-gray-900">
                    {detailMenu.MoTa || detailMenu.moTa}
                  </p>
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Danh sách món ăn trong menu:
                </label>
                <div className="space-y-2">
                  {(
                    detailMenu.ChiTietMenus ||
                    detailMenu.chiTietMenus ||
                    []
                  ).map((ct: any, index: number) => {
                    const monAn = ct.MonAn || ct.monAn || {};
                    return (
                      <div
                        key={index}
                        className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {monAn.TenMonAn || monAn.tenMonAn || "N/A"}
                              {monAn.PhienBan || monAn.phienBan ? (
                                <span className="text-sm text-gray-500 ml-2">
                                  ({monAn.PhienBan || monAn.phienBan})
                                </span>
                              ) : null}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Số lượng: {ct.SoLuong || ct.soLuong || 1}
                              {monAn.Gia || monAn.gia ? (
                                <span className="ml-4">
                                  Giá: {formatVND(monAn.Gia || monAn.gia)} ×{" "}
                                  {ct.SoLuong || ct.soLuong || 1} ={" "}
                                  {formatVND(
                                    (monAn.Gia || monAn.gia) *
                                      (ct.SoLuong || ct.soLuong || 1)
                                  )}
                                </span>
                              ) : null}
                            </div>
                            {ct.GhiChu || ct.ghiChu ? (
                              <div className="text-xs text-gray-500 mt-1">
                                Ghi chú: {ct.GhiChu || ct.ghiChu}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {(!detailMenu.ChiTietMenus ||
                    detailMenu.ChiTietMenus.length === 0) &&
                  (!detailMenu.chiTietMenus ||
                    detailMenu.chiTietMenus.length === 0) ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Chưa có món nào trong menu này.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Đóng
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MenuManagementView;

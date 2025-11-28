import React, { useState, useEffect, useMemo } from "react";
import { employeeService, Employee, Role } from "@/services/employeeService";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import { EditIcon, TrashIcon, PlusCircleIcon } from "@/components/icons";

const EmployeesView: React.FC = () => {
  const { user } = useAuth();
  const { notify, confirm } = useFeedback();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    hoTen: "",
    tenDangNhap: "",
    matKhau: "",
    email: "",
    soDienThoai: "",
    maVaiTro: "",
  });

  const isManager = user?.type === "admin"; 

  useEffect(() => {
    if (user && isManager) {
        loadEmployees();
        loadRoles();
    }
  }, [user]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await employeeService.getEmployees();
      // --- DEBUG QUAN TRỌNG: Xem dữ liệu API trả về thực tế là gì ---
      console.log("🔥 Dữ liệu nhân viên (Gốc):", data); 
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await employeeService.getRoles();
      console.log("🔥 Danh sách vai trò:", data); // Debug vai trò
      setRoles(Array.isArray(data) ? data : []);
      
      if (data && data.length > 0 && !formData.maVaiTro) {
        // Fallback: Tìm MaVaiTro hoặc maVaiTro
        const firstRoleCode = (data[0] as any).MaVaiTro || data[0].maVaiTro;
        setFormData((prev) => ({ ...prev, maVaiTro: firstRoleCode }));
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  // --- HÀM TRA CỨU TÊN VAI TRÒ (ĐÃ NÂNG CẤP) ---
  const getRoleName = (emp: Employee) => {
    // 1. Lấy mã vai trò từ nhân viên (Thử cả viết hoa và viết thường)
    const empRoleCode = emp.maVaiTro || (emp as any).MaVaiTro;

    if (!empRoleCode) return <span className="text-gray-400 italic">Chưa phân quyền</span>;

    // 2. Tìm trong danh sách roles
    const role = roles.find(r => {
        const rCode = r.maVaiTro || (r as any).MaVaiTro;
        return rCode === empRoleCode;
    });

    // 3. Trả về tên hiển thị
    if (role) {
        const rName = role.tenVaiTro || (role as any).TenVaiTro;
        // Tô màu cho đẹp: Quản lý (xanh), Nhân viên (xám)
        const isManager = rName.toLowerCase().includes("quản lý") || rName.toLowerCase().includes("admin");
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isManager ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                {rName}
            </span>
        );
    }

    return <span className="text-gray-500">{empRoleCode}</span>; // Không tìm thấy tên thì hiện mã
  };

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    // Lấy mã vai trò mặc định an toàn
    const defaultRole = roles[0] ? (roles[0].maVaiTro || (roles[0] as any).MaVaiTro) : "";
    
    setFormData({
      hoTen: "",
      tenDangNhap: "",
      matKhau: "",
      email: "",
      soDienThoai: "",
      maVaiTro: defaultRole,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (employee: any) => {
    setEditingEmployee(employee);
    // Lấy mã vai trò từ employee (an toàn)
    const currentRole = employee.maVaiTro || employee.MaVaiTro || "";
    const defaultRole = roles[0] ? (roles[0].maVaiTro || (roles[0] as any).MaVaiTro) : "";

    setFormData({
      hoTen: employee.hoTen || employee.HoTen || "",
      tenDangNhap: employee.tenDangNhap || employee.TenDangNhap || "",
      matKhau: "", 
      email: employee.email || employee.Email || "",
      soDienThoai: employee.soDienThoai || employee.SoDienThoai || "",
      maVaiTro: currentRole || defaultRole,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    const defaultRole = roles[0] ? (roles[0].maVaiTro || (roles[0] as any).MaVaiTro) : "";
    setFormData({
      hoTen: "",
      tenDangNhap: "",
      matKhau: "",
      email: "",
      soDienThoai: "",
      maVaiTro: defaultRole,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hoTen.trim() || !formData.maVaiTro) {
      notify({ tone: "warning", title: "Thiếu thông tin", description: "Vui lòng nhập đầy đủ họ tên và chọn vai trò." });
      return;
    }

    if (!editingEmployee && (!formData.tenDangNhap.trim() || !formData.matKhau.trim())) {
      notify({ tone: "warning", title: "Thiếu thông tin", description: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu." });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        HoTen: formData.hoTen.trim(),
        Email: formData.email.trim() || undefined,
        SoDienThoai: formData.soDienThoai.trim() || undefined,
        MaVaiTro: formData.maVaiTro,
      };

      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.maNhanVien || (editingEmployee as any).MaNhanVien, payload);
        notify({ tone: "success", title: "Cập nhật thành công", description: "Thông tin nhân viên đã được cập nhật." });
      } else {
        await employeeService.createEmployee({
          ...payload,
          TenDangNhap: formData.tenDangNhap.trim(),
          MatKhau: formData.matKhau,
        });
        notify({ tone: "success", title: "Tạo thành công", description: "Tài khoản nhân viên đã được tạo." });
      }
      handleCloseModal();
      loadEmployees();
    } catch (error: any) {
      notify({ tone: "error", title: editingEmployee ? "Cập nhật thất bại" : "Tạo thất bại", description: error?.response?.data?.message || "Đã xảy ra lỗi. Vui lòng thử lại." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employee: any) => {
    const empName = employee.hoTen || employee.HoTen;
    const empId = employee.maNhanVien || employee.MaNhanVien;

    const shouldDelete = await confirm({
      title: "Xóa nhân viên",
      description: `Bạn có chắc chắn muốn xóa nhân viên "${empName}"? Thao tác này không thể hoàn tác.`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      tone: "danger",
    });

    if (shouldDelete) {
      setLoading(true);
      try {
        await employeeService.deleteEmployee(empId);
        notify({ tone: "success", title: "Xóa thành công", description: `Nhân viên "${empName}" đã được xóa.` });
        loadEmployees();
      } catch (error: any) {
        notify({ tone: "error", title: "Xóa thất bại", description: error?.message || "Không thể xóa nhân viên. Vui lòng thử lại." });
      } finally {
        setLoading(false);
      }
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(employees.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return employees.slice(startIndex, endIndex);
  }, [employees, currentPage, itemsPerPage]);

  // Reset về trang 1 khi dữ liệu thay đổi
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  if (!isManager) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-2">Không có quyền truy cập</p>
          <p className="text-gray-500">Chỉ quản lý mới có quyền quản lý nhân viên.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Nhân viên</h1>
        <button onClick={handleOpenAddModal} className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-500 transition">
          <PlusCircleIcon className="w-5 h-5" />
          <span>Thêm nhân viên</span>
        </button>
      </div>

      {loading && !isModalOpen && (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      )}

      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">STT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Họ tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tên đăng nhập</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Số điện thoại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedItems.length > 0 ? (
                paginatedItems.map((employee: any, index) => {
                  const orderNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                  <tr key={employee.maNhanVien || employee.MaNhanVien} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{orderNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.hoTen || employee.HoTen}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{employee.tenDangNhap || employee.TenDangNhap}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{employee.email || employee.Email || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{employee.soDienThoai || employee.SoDienThoai || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {/* GỌI HÀM getRoleName MỚI */}
                      {getRoleName(employee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => handleOpenEditModal(employee)} className="text-indigo-600 hover:text-indigo-700 transition" title="Chỉnh sửa">
                          <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(employee)} className="text-red-600 hover:text-red-700 transition" title="Xóa">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    {loading ? "Đang tải..." : "Chưa có nhân viên nào"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {employees.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-700">Hiển thị:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value={5}>5 nhân viên</option>
                <option value={10}>10 nhân viên</option>
                <option value={20}>20 nhân viên</option>
                <option value={50}>50 nhân viên</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded bg-white disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Trước
              </button>
              <span className="text-sm text-gray-700">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded bg-white disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingEmployee ? "Chỉnh sửa Nhân viên" : "Thêm Nhân viên Mới"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ tên <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.hoTen} onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.tenDangNhap} onChange={(e) => setFormData({ ...formData, tenDangNhap: e.target.value })} required={!editingEmployee} disabled={!!editingEmployee} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100" />
                </div>

                {!editingEmployee && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input type="password" value={formData.matKhau} onChange={(e) => setFormData({ ...formData, matKhau: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input type="tel" value={formData.soDienThoai} onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vai trò <span className="text-red-500">*</span>
                  </label>
                  <select value={formData.maVaiTro} onChange={(e) => setFormData({ ...formData, maVaiTro: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {roles.map((role: any) => {
                        const rCode = role.maVaiTro || role.MaVaiTro;
                        const rName = role.tenVaiTro || role.TenVaiTro;
                        return (
                            <option key={rCode} value={rCode}>
                                {rName}
                            </option>
                        );
                    })}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition">Hủy</button>
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition disabled:opacity-50">
                    {loading ? "Đang xử lý..." : editingEmployee ? "Cập nhật" : "Tạo mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesView;
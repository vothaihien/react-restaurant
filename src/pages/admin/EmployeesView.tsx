import React, { useState, useEffect } from "react";
import { employeesApi } from "@/api/employees";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import { EditIcon, TrashIcon, PlusCircleIcon } from "@/components/icons";

interface Employee {
  maNhanVien: string;
  hoTen: string;
  tenDangNhap: string;
  email?: string;
  soDienThoai?: string;
  vaiTro?: string;
  maVaiTro?: string;
}

interface Role {
  maVaiTro: string;
  tenVaiTro: string;
}

const EmployeesView: React.FC = () => {
  const { user } = useAuth();
  const { notify, confirm } = useFeedback();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    hoTen: "",
    tenDangNhap: "",
    matKhau: "",
    email: "",
    soDienThoai: "",
    maVaiTro: "",
  });

  // Kiểm tra quyền quản lý
  const isManager = user?.type === "admin" && user?.maVaiTro === "VT001";

  useEffect(() => {
    loadEmployees();
    loadRoles();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await employeesApi.getEmployees();
      setEmployees(data || []);
    } catch (error: any) {
      notify({
        tone: "error",
        title: "Lỗi tải danh sách nhân viên",
        description: error?.message || "Không thể tải danh sách nhân viên.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await employeesApi.getRoles();
      setRoles(data || []);
      if (data && data.length > 0 && !formData.maVaiTro) {
        setFormData((prev) => ({ ...prev, maVaiTro: data[0].maVaiTro }));
      }
    } catch (error: any) {
      notify({
        tone: "error",
        title: "Lỗi tải danh sách vai trò",
        description: error?.message || "Không thể tải danh sách vai trò.",
      });
    }
  };

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      hoTen: "",
      tenDangNhap: "",
      matKhau: "",
      email: "",
      soDienThoai: "",
      maVaiTro: roles[0]?.maVaiTro || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      hoTen: employee.hoTen || "",
      tenDangNhap: employee.tenDangNhap || "",
      matKhau: "", // Không hiển thị mật khẩu
      email: employee.email || "",
      soDienThoai: employee.soDienThoai || "",
      maVaiTro: employee.maVaiTro || roles[0]?.maVaiTro || "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setFormData({
      hoTen: "",
      tenDangNhap: "",
      matKhau: "",
      email: "",
      soDienThoai: "",
      maVaiTro: roles[0]?.maVaiTro || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hoTen.trim() || !formData.maVaiTro) {
      notify({
        tone: "warning",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập đầy đủ họ tên và chọn vai trò.",
      });
      return;
    }

    if (!editingEmployee && (!formData.tenDangNhap.trim() || !formData.matKhau.trim())) {
      notify({
        tone: "warning",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.",
      });
      return;
    }

    setLoading(true);
    try {
      if (editingEmployee) {
        // Cập nhật nhân viên
        await employeesApi.updateEmployee(editingEmployee.maNhanVien, {
          HoTen: formData.hoTen.trim(),
          Email: formData.email.trim() || undefined,
          SoDienThoai: formData.soDienThoai.trim() || undefined,
          MaVaiTro: formData.maVaiTro,
        });
        notify({
          tone: "success",
          title: "Cập nhật thành công",
          description: "Thông tin nhân viên đã được cập nhật.",
        });
      } else {
        // Tạo nhân viên mới
        await employeesApi.createEmployee({
          HoTen: formData.hoTen.trim(),
          TenDangNhap: formData.tenDangNhap.trim(),
          MatKhau: formData.matKhau,
          Email: formData.email.trim() || undefined,
          SoDienThoai: formData.soDienThoai.trim() || undefined,
          MaVaiTro: formData.maVaiTro,
        });
        notify({
          tone: "success",
          title: "Tạo thành công",
          description: "Tài khoản nhân viên đã được tạo.",
        });
      }
      handleCloseModal();
      loadEmployees();
    } catch (error: any) {
      notify({
        tone: "error",
        title: editingEmployee ? "Cập nhật thất bại" : "Tạo thất bại",
        description: error?.message || "Đã xảy ra lỗi. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employee: Employee) => {
    const shouldDelete = await confirm({
      title: "Xóa nhân viên",
      description: `Bạn có chắc chắn muốn xóa nhân viên "${employee.hoTen}"? Thao tác này không thể hoàn tác.`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      tone: "danger",
    });

    if (shouldDelete) {
      setLoading(true);
      try {
        await employeesApi.deleteEmployee(employee.maNhanVien);
        notify({
          tone: "success",
          title: "Xóa thành công",
          description: `Nhân viên "${employee.hoTen}" đã được xóa.`,
        });
        loadEmployees();
      } catch (error: any) {
        notify({
          tone: "error",
          title: "Xóa thất bại",
          description: error?.message || "Không thể xóa nhân viên. Vui lòng thử lại.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isManager) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-2">
            Không có quyền truy cập
          </p>
          <p className="text-gray-500">
            Chỉ quản lý mới có quyền quản lý nhân viên.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Nhân viên</h1>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-500 transition"
        >
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  STT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Họ tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Tên đăng nhập
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Số điện thoại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.length > 0 ? (
                employees.map((employee, index) => (
                  <tr key={employee.maNhanVien} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.hoTen}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {employee.tenDangNhap}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {employee.email || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {employee.soDienThoai || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {employee.vaiTro || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleOpenEditModal(employee)}
                          className="text-indigo-600 hover:text-indigo-700 transition"
                          title="Chỉnh sửa"
                        >
                          <EditIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee)}
                          className="text-red-600 hover:text-red-700 transition"
                          title="Xóa"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    Chưa có nhân viên nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
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
                  <input
                    type="text"
                    value={formData.hoTen}
                    onChange={(e) =>
                      setFormData({ ...formData, hoTen: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tenDangNhap}
                    onChange={(e) =>
                      setFormData({ ...formData, tenDangNhap: e.target.value })
                    }
                    required={!editingEmployee}
                    disabled={!!editingEmployee}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  />
                </div>

                {!editingEmployee && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.matKhau}
                      onChange={(e) =>
                        setFormData({ ...formData, matKhau: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.soDienThoai}
                    onChange={(e) =>
                      setFormData({ ...formData, soDienThoai: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vai trò <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.maVaiTro}
                    onChange={(e) =>
                      setFormData({ ...formData, maVaiTro: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {roles.map((role) => (
                      <option key={role.maVaiTro} value={role.maVaiTro}>
                        {role.tenVaiTro}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition disabled:opacity-50"
                  >
                    {loading
                      ? "Đang xử lý..."
                      : editingEmployee
                      ? "Cập nhật"
                      : "Tạo mới"}
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





import React, { useState, useEffect, useMemo } from "react";
import { employeeService, Employee, Role } from "@/services/employeeService";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import { EditIcon, TrashIcon, PlusCircleIcon } from "@/components/icons";
import { Search, User, Phone, Mail, Shield, Users, UserPlus, Fingerprint } from "lucide-react";

const EmployeesView: React.FC = () => {
  // --- 1. LOGIC GỐC (GIỮ NGUYÊN KHÔNG ĐỤNG CHẠM) ---
  const { user } = useAuth();
  const { notify, confirm } = useFeedback();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // State tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");

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
      // console.log("🔥 Dữ liệu nhân viên:", data); 
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error(error);
      notify({ tone: "error", title: "Lỗi", description: "Không tải được danh sách nhân viên" });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await employeeService.getRoles();
      setRoles(Array.isArray(data) ? data : []);
      
      if (data && data.length > 0 && !formData.maVaiTro) {
        const firstRoleCode = (data[0] as any).MaVaiTro || data[0].maVaiTro;
        setFormData((prev) => ({ ...prev, maVaiTro: firstRoleCode }));
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  // Hàm render Avatar
  const getAvatar = (name: string) => {
    const names = name.split(' ');
    const initials = names.length >= 2 
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
    
    const colors = [
        'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300',
        'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300',
        'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300',
        'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300',
    ];
    // Hash nhẹ để màu cố định theo tên
    const colorIndex = name.length % colors.length;
    const colorClass = colors[colorIndex];

    return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${colorClass}`}>
            {initials}
        </div>
    );
  };

  // Hàm render Badge Vai trò
  const getRoleName = (emp: Employee) => {
    const empRoleCode = emp.maVaiTro || (emp as any).MaVaiTro;
    if (!empRoleCode) return <span className="text-gray-400 italic text-xs">Chưa phân quyền</span>;

    const role = roles.find(r => {
        const rCode = r.maVaiTro || (r as any).MaVaiTro;
        return rCode === empRoleCode;
    });

    if (role) {
        const rName = role.tenVaiTro || (role as any).TenVaiTro;
        const isManager = rName.toLowerCase().includes("quản lý") || rName.toLowerCase().includes("admin");
        
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                isManager 
                ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
            }`}>
                {isManager ? <Shield className="w-3 h-3 mr-1.5" /> : <User className="w-3 h-3 mr-1.5" />}
                {rName}
            </span>
        );
    }
    return <span className="text-gray-500 text-xs">{empRoleCode}</span>;
  };

  // --- MODAL HANDLERS ---
  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    const defaultRole = roles[0] ? (roles[0].maVaiTro || (roles[0] as any).MaVaiTro) : "";
    setFormData({ hoTen: "", tenDangNhap: "", matKhau: "", email: "", soDienThoai: "", maVaiTro: defaultRole });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (employee: any) => {
    setEditingEmployee(employee);
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
    // Reset form...
    const defaultRole = roles[0] ? (roles[0].maVaiTro || (roles[0] as any).MaVaiTro) : "";
    setFormData({ hoTen: "", tenDangNhap: "", matKhau: "", email: "", soDienThoai: "", maVaiTro: defaultRole });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hoTen.trim() || !formData.maVaiTro) {
      notify({ tone: "warning", title: "Thiếu thông tin", description: "Vui lòng nhập họ tên và vai trò." });
      return;
    }
    if (!editingEmployee && (!formData.tenDangNhap.trim() || !formData.matKhau.trim())) {
      notify({ tone: "warning", title: "Thiếu thông tin", description: "Tạo mới cần tên đăng nhập và mật khẩu." });
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
        notify({ tone: "success", title: "Thành công", description: "Đã cập nhật nhân viên." });
      } else {
        await employeeService.createEmployee({
          ...payload,
          TenDangNhap: formData.tenDangNhap.trim(),
          MatKhau: formData.matKhau,
        });
        notify({ tone: "success", title: "Thành công", description: "Đã thêm nhân viên mới." });
      }
      handleCloseModal();
      loadEmployees();
    } catch (error: any) {
      notify({ tone: "error", title: "Thất bại", description: error?.response?.data?.message || "Có lỗi xảy ra." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employee: any) => {
    const empName = employee.hoTen || employee.HoTen;
    const empId = employee.maNhanVien || employee.MaNhanVien;

    const shouldDelete = await confirm({
      title: "Xóa nhân viên",
      description: `Xác nhận xóa nhân viên "${empName}"?`,
      confirmText: "Xóa ngay",
      cancelText: "Hủy",
      tone: "danger",
    });

    if (shouldDelete) {
      setLoading(true);
      try {
        await employeeService.deleteEmployee(empId);
        notify({ tone: "success", title: "Đã xóa", description: `Đã xóa nhân viên ${empName}.` });
        loadEmployees();
      } catch (error: any) {
        notify({ tone: "error", title: "Lỗi", description: "Không thể xóa nhân viên này." });
      } finally {
        setLoading(false);
      }
    }
  };

  // --- FILTER & PAGINATION ---
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    const lowerTerm = searchTerm.toLowerCase();
    return employees.filter(emp => 
        (emp.hoTen || (emp as any).HoTen || "").toLowerCase().includes(lowerTerm) ||
        (emp.email || (emp as any).Email || "").toLowerCase().includes(lowerTerm)
    );
  }, [employees, searchTerm]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);
  }, [totalPages, currentPage]);

  if (!isManager) return null;

  // --- 2. GIAO DIỆN MỚI (ĐẸP HƠN, KHÔNG BỊ "PHÈN") ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      
      {/* HEADER SECTION: Gọn gàng, hiện đại hơn */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Users className="w-8 h-8 text-indigo-600" />
                Quản lý Nhân sự
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-10">
                Tổng số: <span className="font-semibold text-indigo-600">{employees.length}</span> nhân viên
            </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
            {/* Thanh tìm kiếm đẹp hơn */}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Tìm nhân viên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full sm:w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm transition-all"
                />
            </div>

            {/* Nút thêm mới nổi bật */}
            <button 
                onClick={handleOpenAddModal} 
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
            >
                <UserPlus className="w-5 h-5" />
                <span>Thêm mới</span>
            </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        
        {loading && !isModalOpen && (
            <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div className="h-full bg-indigo-500 animate-progress"></div>
            </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thông tin nhân viên</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Liên hệ</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tên đăng nhập</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {paginatedItems.length > 0 ? (
                paginatedItems.map((employee: any) => (
                  <tr key={employee.maNhanVien || employee.MaNhanVien} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                    {/* Cột 1: Avatar + Tên + ID */}
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                {getAvatar(employee.hoTen || employee.HoTen || "?")}
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                    {employee.hoTen || employee.HoTen}
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                                    #{employee.maNhanVien || employee.MaNhanVien}
                                </div>
                            </div>
                        </div>
                    </td>

                    {/* Cột 2: Email + SĐT */}
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                {employee.email || employee.Email || <span className="text-gray-300 italic text-xs">Trống</span>}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                {employee.soDienThoai || employee.SoDienThoai || <span className="text-gray-300 italic text-xs">Trống</span>}
                            </div>
                        </div>
                    </td>

                    {/* Cột 3: Badge Vai trò */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleName(employee)}
                    </td>

                    {/* Cột 4: Tên đăng nhập (ĐÃ SỬA: Không bôi đậm, nhìn sạch sẽ) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Fingerprint className="w-4 h-4 mr-2 text-gray-400" />
                            {employee.tenDangNhap || employee.TenDangNhap}
                        </div>
                    </td>

                    {/* Cột 5: Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => handleOpenEditModal(employee)} 
                            className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors" 
                            title="Sửa thông tin"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleDelete(employee)} 
                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors" 
                            title="Xóa nhân viên"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                        <Users className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-base font-medium">{loading ? "Đang đồng bộ dữ liệu..." : "Chưa có nhân viên nào"}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* PAGINATION */}
        {employees.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
                Hiển thị <span className="font-semibold text-gray-900 dark:text-white">{paginatedItems.length}</span> trên tổng <span className="font-semibold text-gray-900 dark:text-white">{employees.length}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                Trước
              </button>
              <div className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm">
                {currentPage}
              </div>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL - Giữ nguyên logic, chỉnh lại style cho khớp theme mới */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-auto border border-gray-100 dark:border-gray-700 transform scale-100 transition-all">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingEmployee ? "Cập nhật hồ sơ" : "Thêm nhân sự mới"}
                  </h2>
                  <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <span className="text-2xl">&times;</span>
                  </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Họ tên */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.hoTen} onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })} required 
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all" placeholder="Ví dụ: Nguyễn Văn A" />
                </div>

                {/* Tên đăng nhập & Pass */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Username <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.tenDangNhap} onChange={(e) => setFormData({ ...formData, tenDangNhap: e.target.value })} required={!editingEmployee} disabled={!!editingEmployee}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-60 dark:text-white" />
                    </div>
                    {!editingEmployee && (
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Mật khẩu <span className="text-red-500">*</span></label>
                        <input type="password" value={formData.matKhau} onChange={(e) => setFormData({ ...formData, matKhau: e.target.value })} required
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white" />
                    </div>
                    )}
                </div>

                {/* Email & SĐT */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Số điện thoại</label>
                        <input type="tel" value={formData.soDienThoai} onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })} 
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white" />
                    </div>
                </div>

                {/* Vai trò */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phân quyền <span className="text-red-500">*</span></label>
                  <select value={formData.maVaiTro} onChange={(e) => setFormData({ ...formData, maVaiTro: e.target.value })} required 
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white cursor-pointer">
                    {roles.map((role: any) => (
                        <option key={role.maVaiTro || role.MaVaiTro} value={role.maVaiTro || role.MaVaiTro}>{role.tenVaiTro || role.TenVaiTro}</option>
                    ))}
                  </select>
                </div>

                {/* Footer Modal */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                  <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">Hủy bỏ</button>
                  <button type="submit" disabled={loading} className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition disabled:opacity-50">
                    {loading ? "Đang lưu..." : "Lưu thông tin"}
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
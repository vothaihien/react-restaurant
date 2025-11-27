// components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"; 
import { Box, CircularProgress } from "@mui/material"; // Import thêm loading UI

interface ProtectedRouteProps {
  allowedRoles: string[]; 
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  // Lấy thêm isLoading từ AuthContext
  const { user, isLoading } = useAuth();

  // 1. QUAN TRỌNG: Nếu đang load thông tin từ localStorage (lúc F5), hiện loading chờ xíu
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 2. Check xong rồi mà không có user -> Đuổi về Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Có user nhưng sai quyền -> Đuổi về trang Unauthorized
  if (!allowedRoles.includes(user.type)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Ok hết -> Cho vào
  return <Outlet />;
};

export default ProtectedRoute;
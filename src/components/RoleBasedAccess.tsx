import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RoleBasedAccessProps {
  allowedRoles: string[]; // ['admin'] hoặc ['admin', 'staff']
  children: React.ReactNode;
  fallback?: React.ReactNode; // Component hiển thị nếu không có quyền (mặc định: null)
}

/**
 * Component để ẩn/hiện nội dung dựa trên role của user
 * @example
 * <RoleBasedAccess allowedRoles={['admin']}>
 *   <Button>Chỉ Admin mới thấy</Button>
 * </RoleBasedAccess>
 */
export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  allowedRoles,
  children,
  fallback = null,
}) => {
  const { user } = useAuth();
  const userRole = user?.type || '';

  // Kiểm tra xem user có role được phép không
  const hasAccess = allowedRoles.includes(userRole);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleBasedAccess;


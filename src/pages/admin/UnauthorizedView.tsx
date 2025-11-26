import React from "react";
import { Box, Typography, Button, Container, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { LockPerson, Home, ArrowBack } from "@mui/icons-material";

const UnauthorizedView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "#f5f5f5", // Màu nền xám nhẹ
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* 1. Icon Khóa to đùng */}
          <Box
            sx={{
              bgcolor: "#ffebee", // Nền đỏ nhạt
              p: 3,
              borderRadius: "50%",
              mb: 3,
            }}
          >
            <LockPerson sx={{ fontSize: 60, color: "#d32f2f" }} />
          </Box>

          {/* 2. Tiêu đề & Thông báo */}
          <Typography variant="h4" fontWeight="bold" gutterBottom color="text.primary">
            Truy cập bị từ chối
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
            Xin lỗi, tài khoản hiện tại của bạn không có đủ quyền hạn để truy cập vào trang này.
            <br />
            Vui lòng liên hệ với Quản lý nếu bạn nghĩ đây là một sự nhầm lẫn.
          </Typography>

          {/* 3. Các nút điều hướng */}
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)} // Quay lại trang trước
              size="large"
            >
              Quay lại
            </Button>

            <Button
              variant="contained"
              startIcon={<Home />}
              onClick={() => navigate("/")} // Về Dashboard
              size="large"
              color="primary"
            >
              Về trang chủ
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default UnauthorizedView;
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFeedback } from "@/contexts/FeedbackContext";
import { useAuth } from "@/contexts/AuthContext";
import { CONTACT_EMAIL_KEY, CONTACT_NAME_KEY } from "@/pages/customer/constants";

interface AuthBoxProps {
  onSuccess?: () => void;
}

const AuthBox: React.FC<AuthBoxProps> = ({ onSuccess }) => {
  const { notify } = useFeedback();
  const { checkUser, login, register } = useAuth();
  const [step, setStep] = useState<"identify" | "otp">("identify");
  const [identifier, setIdentifier] = useState("");
  const [exists, setExists] = useState<boolean | null>(null);
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");

  const doCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    try {
      const res = await checkUser(identifier);
      setExists(res.userExists);
      setStep("otp");
      notify({
        tone: "success",
        title: "Đã gửi OTP",
        description: identifier.includes("@")
          ? "Vui lòng kiểm tra email"
          : "OTP đã hiển thị ở server console (dev)",
      });
    } catch (err: any) {
      notify({
        tone: "error",
        title: "Lỗi",
        description: err?.message || "Không gửi được OTP",
      });
    }
  };

  const doSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    try {
      if (exists) {
        await login(identifier, otp);
        if (identifier.includes("@")) {
          localStorage.setItem(CONTACT_EMAIL_KEY, identifier.trim());
        }
        notify({ tone: "success", title: "Đăng nhập thành công" });
        onSuccess?.();
      } else {
        if (!name) {
          notify({ tone: "warning", title: "Thiếu họ tên đăng ký" });
          return;
        }
        await register(identifier, name, otp);
        localStorage.setItem(CONTACT_NAME_KEY, name.trim());
        if (identifier.includes("@")) {
          localStorage.setItem(CONTACT_EMAIL_KEY, identifier.trim());
        }
        notify({ tone: "success", title: "Đăng ký thành công" });
        onSuccess?.();
      }
    } catch (err: any) {
      notify({
        tone: "error",
        title: "Lỗi",
        description: err?.message || "Xác thực thất bại",
      });
    }
  };

  return (
    <div className="max-w-md space-y-3">
      {step === "identify" ? (
        <form onSubmit={doCheck} className="space-y-2">
          <Input
            placeholder="Email hoặc SĐT"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <Button type="submit">Nhận OTP</Button>
        </form>
      ) : (
        <form onSubmit={doSubmitOtp} className="space-y-2">
          {!exists && (
            <Input
              placeholder="Họ tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <Input
            placeholder="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <Button type="submit">{exists ? "Đăng nhập" : "Đăng ký"}</Button>
        </form>
      )}
    </div>
  );
};

export default AuthBox;


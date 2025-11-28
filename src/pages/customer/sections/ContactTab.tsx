import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFeedback } from "@/contexts/FeedbackContext";

const ContactTab: React.FC = () => {
  const { notify } = useFeedback();
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactTopic, setContactTopic] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      notify({
        tone: "warning",
        title: "Thiếu thông tin liên hệ",
        description: "Vui lòng nhập Họ tên, Email và nội dung cần hỗ trợ.",
      });
      return;
    }
    notify({
      tone: "success",
      title: "Đã gửi yêu cầu",
      description: "Chúng tôi sẽ liên hệ lại trong vòng 24 giờ làm việc.",
    });
    setContactName("");
    setContactEmail("");
    setContactTopic("");
    setContactMessage("");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-primary/20 bg-white p-6 lg:p-10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">
              Kết nối với Viet Restaurant
            </p>
            <h2 className="text-3xl font-bold text-slate-900">
              Chúng tôi luôn lắng nghe mọi phản hồi từ bạn
            </h2>
            <p className="text-sm text-slate-600">
              Dù bạn muốn đặt tiệc riêng, hợp tác sự kiện hay đơn giản là góp ý
              về dịch vụ, đội ngũ CSKH sẽ phản hồi trong vòng 24 giờ làm việc.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5 space-y-3">
            <p className="text-sm font-semibold text-slate-900">
              Hotline & Zalo
            </p>
            <p className="text-2xl font-bold text-primary">0902 888 999</p>
            <p className="text-xs text-slate-500">
              Hoạt động 9:00 - 22:00 hằng ngày
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5 space-y-3">
            <p className="text-sm font-semibold text-slate-900">Email</p>
            <p className="text-2xl font-bold text-primary">
              hello@vietrestaurant.vn
            </p>
            <p className="text-xs text-slate-500">
              Ưu tiên gửi file thiết kế sự kiện tại đây
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.1fr,0.9fr] gap-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Thông tin liên hệ trực tiếp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Nhà hàng flagship
                </p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  140 Lê Trọng Tấn, Q. Tân Phú, TP.HCM
                </p>
                <p className="text-sm text-slate-600">
                  Khu vực Tân Phú, gần Aeon Mall · thuận tiện gửi xe.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Giờ hoạt động
                </p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  10:30 - 22:30
                </p>
                <p className="text-sm text-slate-600">
                  Bếp nhận order cuối 21:45 · Mở cửa tất cả ngày lễ.
                </p>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 h-[260px]">
              <iframe
                title="Google Maps"
                src="https://www.google.com/maps?q=140+L%C3%AA+Tr%E1%BB%8Dng+T%E1%BA%A5n,+T%C3%A2n+Ph%C3%BA,+TP.HCM&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Gửi thông tin cho chúng tôi</CardTitle>
            <p className="text-sm text-slate-500">
              Điền form bên dưới, chúng tôi sẽ gọi lại trong vòng 24 giờ.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-slate-800">
                  Họ và tên *
                </label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Nguyễn Anh Tuấn"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-800">
                  Email liên hệ *
                </label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-800">
                  Chủ đề / Dịp đặc biệt
                </label>
                <Input
                  value={contactTopic}
                  onChange={(e) => setContactTopic(e.target.value)}
                  placeholder="Tiệc sinh nhật 10 người, cần không gian riêng..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-800">
                  Nội dung *
                </label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  rows={5}
                  placeholder="Chia sẻ mong muốn của bạn..."
                />
              </div>
              <Button type="submit" className="w-full">
                Gửi yêu cầu hỗ trợ
              </Button>
              <p className="text-xs text-slate-500 text-center">
                *Thông tin của bạn được bảo mật theo chính sách quyền riêng tư
                của Viet Restaurant.
              </p>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default ContactTab;

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AboutTabProps = {
  onNavigate: (tab: "booking" | "menu") => void;
};

const highlightStats = [
  { label: "Năm thành lập", value: "2015" },
  { label: "Sự kiện riêng mỗi năm", value: "120+" },
  { label: "Đầu bếp đạt giải", value: "07" },
  { label: "Khách hàng thân thiết", value: "12.000+" },
];

const milestoneTimeline = [
  {
    year: "2015",
    title: "Mở cửa cơ sở đầu tiên",
    desc: "Khởi đầu với mong muốn tôn vinh ẩm thực Việt hiện đại.",
  },
  {
    year: "2018",
    title: "Ra mắt thực đơn degustation",
    desc: "Kết hợp nguyên liệu bản địa với kỹ thuật fine-dining.",
  },
  {
    year: "2021",
    title: "Không gian rượu vang & lounge",
    desc: "Tạo trải nghiệm trọn vẹn từ món ăn đến thức uống.",
  },
  {
    year: "2024",
    title: "Chuỗi sự kiện chef table",
    desc: "Giới thiệu bộ sưu tập món mới theo mùa",
  },
];

const experiencePackages = [
  {
    title: "Private Dining",
    desc: "Không gian riêng cho nhóm 8-20 khách với menu thiết kế riêng.",
    detail: "Bao gồm hoa trang trí, quầy rượu và quản gia riêng.",
  },
  {
    title: "Chef Table",
    desc: "Thực đơn 8 món theo mùa cùng tương tác trực tiếp từ bếp trưởng.",
    detail: "Phù hợp kỷ niệm, cầu hôn hoặc tiếp khách cao cấp.",
  },
  {
    title: "Corporate Tasting",
    desc: "Tiệc standing hoặc sit-down cho doanh nghiệp, tối đa 120 khách.",
    detail: "Có gói âm thanh, ánh sáng, MC song ngữ.",
  },
];

const AboutTab: React.FC<AboutTabProps> = ({ onNavigate }) => (
  <div className="space-y-6">
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-white to-amber-50 p-6 lg:p-10">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold">
          Về Viet Restaurant
        </p>
        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
          Nâng tầm ẩm thực Việt bằng trải nghiệm tinh tế và đong đầy cảm xúc.
        </h2>
        <p className="text-base text-slate-700">
          Chúng tôi kết hợp nguyên liệu bản địa với kỹ thuật hiện đại để tạo nên
          hành trình vị giác mới mẻ. Mỗi mùa, đội ngũ đầu bếp lại kể một câu
          chuyện khác về văn hóa Việt Nam qua từng món ăn.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => onNavigate("booking")}>Đặt bàn ngay</Button>
          <Button variant="outline" onClick={() => onNavigate("menu")}>
            Khám phá thực đơn
          </Button>
        </div>
      </div>
      <div
        className="relative rounded-3xl overflow-hidden bg-cover bg-center min-h-[260px]"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80")',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-end p-6 text-white space-y-2">
          <p className="text-lg font-semibold">Chef Lâm Minh</p>
          <p className="text-sm text-white/80">
            “Ẩm thực đẹp nhất khi chạm đến ký ức của thực khách.”
          </p>
        </div>
      </div>
    </section>

    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {highlightStats.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-sm"
        >
          <p className="text-2xl font-bold text-primary">{item.value}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500 mt-1">
            {item.label}
          </p>
        </div>
      ))}
    </section>

    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Hành trình phát triển</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestoneTimeline.map((mile) => (
              <div key={mile.year} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold text-primary">
                    {mile.year}
                  </span>
                  <span className="w-px flex-1 bg-slate-200" />
                </div>
                <div className="pb-4 border-b border-dashed border-slate-200 flex-1">
                  <p className="font-semibold text-slate-900">{mile.title}</p>
                  <p className="text-sm text-slate-600">{mile.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Giá trị chúng tôi hướng đến</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
            <h4 className="font-semibold text-slate-900">Tinh tế</h4>
            <p className="text-sm text-slate-600">
              Từng chi tiết được chăm chút: từ nhiệt độ món ăn đến âm nhạc, ánh
              sáng.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
            <h4 className="font-semibold text-slate-900">Địa phương</h4>
            <p className="text-sm text-slate-600">
              Ưu tiên nguyên liệu từ nông trại hữu cơ và làng nghề truyền thống.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
            <h4 className="font-semibold text-slate-900">Khách trung tâm</h4>
            <p className="text-sm text-slate-600">
              Trải nghiệm được cá nhân hóa theo dịp đặc biệt của từng vị khách.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>

    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {experiencePackages.map((pkg) => (
        <Card key={pkg.title} className="border border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle>{pkg.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p className="font-medium text-slate-900">{pkg.desc}</p>
            <p>{pkg.detail}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => onNavigate("booking")}
            >
              Đặt lịch tư vấn
            </Button>
          </CardContent>
        </Card>
      ))}
    </section>

    <section className="rounded-3xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">
            Tin về chúng tôi
          </p>
          <h3 className="text-2xl font-bold text-slate-900">
            Hợp tác cùng 40+ đối tác chiến lược trong lĩnh vực du lịch và khách
            sạn.
          </h3>
          <p className="text-sm text-slate-600">
            Từ hạng mục tiệc cưới boutique đến roadshow sản phẩm, đội ngũ sự kiện
            của chúng tôi luôn sẵn sàng đồng hành để mang lại trải nghiệm đồng
            nhất và sang trọng.
          </p>
          <div className="flex gap-3 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              MICE
            </span>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              Wedding Boutique
            </span>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              Luxury Travel
            </span>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-900 text-white p-6 space-y-4">
          <p className="text-base leading-relaxed">
            “Mỗi thực khách đến Viet Restaurant đều là một câu chuyện. Chúng tôi
            muốn bạn cảm nhận được hơi thở của Việt Nam, dù bạn là người bản xứ
            hay đến từ phương xa.”
          </p>
          <div className="text-sm">
            <p className="font-semibold">Founder Nguyễn Thảo Vy</p>
            <p className="text-white/70">Cố vấn trải nghiệm khách hàng</p>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default AboutTab;


import React from "react";
import { Button } from "@/components/ui/button";

type HomeTabProps = {
  onNavigate: (tab: "booking" | "menu") => void;
};

const combos = [
  {
    title: "Combo Sum Vầy",
    desc: "Bữa ăn thịnh soạn cho gia đình",
    image:
      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDbOinRNLxEOEtRG5ml6_E0UQg3hSzoBCXOdvDyLmOyH_DNmlu8D3nZ1BWZeul2QkYWL5SH2yQwiQQ-k-_1uQa1JPO_kwrr7U7D8rLCSxArEZGiIkIZhYIdZMugniMzwPN78NkvUTNjjjAaW5dqCPZnJp0Eg9HjdcPtsicEjDlRsAMs6ltUIE7IKWrHJ6OqbdQ5AO5eR_uHCHftduFyd17Q-nN5zfC2Yp_lVS9WpNH-QeJ56qJSp8O-No9ZnDMkM7YkV_iM1K2vTt6d")',
  },
  {
    title: "Combo Tình Yêu",
    desc: "Lựa chọn hoàn hảo cho cặp đôi",
    image:
      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDJLaFiCvAJAsGTxHyAJ82t4pP6t2OoeK76Ix7gyCYt2ahA5qm4BP8owas9_0G057HTn543Y69sHZGdnxE5ADKtGmyw2mBWa-BWa4ZJJaV3NBw6bhJ-xQXEmjXY7V9NlgpC6sTTj9EkzQy7WqOKin6_OIZiVb4N-MPewKLo8VDG7uA6LslGd3qjsn9HvtsJbYLKO9zBi91ggQdSymiuOfdLSYjgQoPCs3tQaC_3MD29Qr9Prdx_0HnKhq1CaKU-9OV2t0Ge77VlnYye")',
  },
  {
    title: "Combo Bạn Bè",
    desc: "Chia sẻ khoảnh khắc vui vẻ",
    image:
      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBbFhV5Ktx_QnnIpUckagpOofBcSMTR_cdhB1scgAMbGM_GlxyywQT7cP_978xfVrmsZqBNh8mPXl5-Oj7OZ04u-s2Py4xO_wBh1ntBQVjSDnlpeLRY8D5KtgSQEHJs4FTXdcVWkUyfn3qDjMZss_yqJ3IJLvIRzM-KOgt3YosURqzvy71aLxSmBTG12FkkOqp3eyvaFYjpRIVgH_YNLEIrZho5Ikd7OSvYnpWgNbuTYXc18fcQ_-Rlur4W5kxsXXcTqiOk8gxX_Grv")',
  },
];

const HomeTab: React.FC<HomeTabProps> = ({ onNavigate }) => (
  <div className="space-y-10">
    <section className="relative rounded-xl overflow-hidden min-h-[320px] md:min-h-[420px] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.65)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAg9QSgrxyT28Ng0YKudOW7aGTwdpENZtEv9esqaGnbSCGQIt7Cc8Zw_qbtKsq2Sfzs9iqol6yE12VajK07FgRRyMUd12SKRC3vEv12P_jv3-YOis9c4FAlLamdhJUARgsq9vCkk4GX-ijZ1pWcnvkj0xnrLQ6K_fPtXq_PSIFr80e1hKRzIbbkJBgneE9P4d4sVntNc8-ZCR1ngeRB3e8M5hK94TvJkc5RNC4JpJ0A4ERxCUxVALaoDDd1GkdQXmKUZ2fsvK1c1ukd")',
        }}
      />
      <div className="relative z-10 px-4 sm:px-8 py-10 text-center max-w-3xl">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
          Trải Nghiệm Tinh Hoa Ẩm Thực Việt
        </h2>
        <p className="mt-4 text-base sm:text-lg text-white/90">
          Khám phá hương vị truyền thống trong một không gian sang trọng và ấm
          cúng.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            className="h-12 px-6 text-base font-semibold"
            onClick={() => onNavigate("booking")}
          >
            Đặt bàn ngay
          </Button>
          <Button
            variant="outline"
            className="h-12 px-6 text-base font-semibold bg-white/10 border-white/60 text-white hover:bg-white/20"
            onClick={() => onNavigate("menu")}
          >
            Xem thực đơn
          </Button>
        </div>
      </div>
    </section>

    <section className="py-4 md:py-6">
      <h3 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-6">
        Combo Đặc Biệt Hôm Nay
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {combos.map((combo) => (
          <article key={combo.title} className="flex flex-col gap-3 pb-3 group">
            <div
              className="w-full bg-center bg-no-repeat aspect-[3/4] bg-cover rounded-xl overflow-hidden transform group-hover:scale-105 transition-transform duration-300 ease-in-out"
              style={{ backgroundImage: combo.image }}
            />
            <div className="text-center mt-1">
              <p className="text-xl font-bold text-gray-900">{combo.title}</p>
              <p className="text-sm text-gray-600">{combo.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  </div>
);

export default HomeTab;


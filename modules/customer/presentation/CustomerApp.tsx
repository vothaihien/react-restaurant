import React, { useState } from "react";
import CustomerPortalView, {
  CustomerTab,
} from "../../../src/views/CustomerPortalView";

const SiteHeader: React.FC<{
  onBook?: () => void;
  onNavigate?: (tab: CustomerTab) => void;
}> = ({ onBook, onNavigate }) => (
  <header className="sticky top-0 z-50 border-b border-primary/20 bg-white/80 backdrop-blur-sm">
    <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-10 lg:px-20 py-3">
      <div className="flex items-center gap-3 text-slate-900">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary">
          <svg
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
          >
            <path
              d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight">
          Viet Restaurant
        </h2>
      </div>
      <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
        <nav className="flex items-center gap-8 text-sm font-medium text-slate-700">
          <button
            onClick={() => onNavigate?.("home")}
            className="hover:text-primary transition-colors"
          >
            Trang Chủ
          </button>
          <button
            onClick={() => onNavigate?.("menu")}
            className="hover:text-primary transition-colors"
          >
            Thực Đơn
          </button>
          <button
            onClick={() => onNavigate?.("loyalty")}
            className="hover:text-primary transition-colors"
          >
            Giới Thiệu
          </button>
          <button
            onClick={() => onNavigate?.("feedback")}
            className="hover:text-primary transition-colors"
          >
            Liên Hệ
          </button>
        </nav>
        <button
          onClick={onBook}
          className="ml-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Đặt Bàn
        </button>
      </div>
    </div>
  </header>
);

const SiteFooter: React.FC = () => (
  <footer className="mt-10 border-t border-primary/20 bg-white">
    <div className="max-w-7xl mx-auto flex flex-col gap-6 px-5 py-8 text-center">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-slate-600">
        <a href="#" className="hover:text-primary transition-colors">
          Trang Chủ
        </a>
        <a href="#menu" className="hover:text-primary transition-colors">
          Thực Đơn
        </a>
        <a href="#about" className="hover:text-primary transition-colors">
          Giới Thiệu
        </a>
        <a href="#contact" className="hover:text-primary transition-colors">
          Liên Hệ
        </a>
        <a href="#privacy" className="hover:text-primary transition-colors">
          Chính sách bảo mật
        </a>
      </div>
      <div className="flex flex-wrap justify-center gap-6 text-slate-500">
        <a
          href="#"
          className="hover:text-primary transition-colors"
          aria-label="Facebook"
        >
          <svg
            fill="currentColor"
            height="24"
            width="24"
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"></path>
          </svg>
        </a>
        <a
          href="#"
          className="hover:text-primary transition-colors"
          aria-label="Instagram"
        >
          <svg
            fill="currentColor"
            height="24"
            width="24"
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.703.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372.527-.205.973-.478 1.417-.923.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.942a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 8 0m0 1.442c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.598-.919c-.11-.281-.24-.705-.276-1.485C1.44 10.389 1.442 10.137 1.442 8s.002-2.389.047-3.232c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.843-.038 1.096-.047 3.232-.047M8 3.882a4.108 4.108 0 1 0 0 8.216 4.108 4.108 0 0 0 0-8.216m0 6.769a2.661 2.661 0 1 1 0-5.322 2.661 2.661 0 0 1 0 5.322m4.558-5.859a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92"></path>
          </svg>
        </a>
        <a
          href="#"
          className="hover:text-primary transition-colors"
          aria-label="YouTube"
        >
          <svg
            fill="currentColor"
            height="24"
            width="24"
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.022.26-.01.104c-.048.519-.119 1.023-.22 1.402a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.078-.003c-1.116-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.538-.21 2.654-.26l.078-.003.171-.007.087-.004.17-.006.17-.005.094-.001h.089M11.59 7.417a.5.5 0 0 0-.525-.445L7.06 7.545a.5.5 0 0 0-.445.525v.973c0 .253.18.47.412.51l3.525.666a.5.5 0 0 0 .588-.356l.5-2.5a.5.5 0 0 0-.104-.492"></path>
          </svg>
        </a>
      </div>
      <p className="text-xs sm:text-sm text-slate-500">
        © {new Date().getFullYear()} Viet Restaurant. All Rights Reserved.
      </p>
    </div>
  </footer>
);

const CustomerApp: React.FC = () => {
  const [tab, setTab] = useState<CustomerTab>("home");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <SiteHeader onBook={() => setTab("booking")} onNavigate={setTab} />
      <main className="flex-1 max-w-6xl lg:max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-6">
        <CustomerPortalView tab={tab} onTabChange={setTab} />
      </main>
      <SiteFooter />
    </div>
  );
};

export default CustomerApp;

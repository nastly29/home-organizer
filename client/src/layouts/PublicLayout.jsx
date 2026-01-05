import { Outlet } from "react-router-dom";
import { useState } from "react";

import PublicHeader from "../components/PublicHeader";
import PublicFooter from "../components/PublicFooter";
import AuthModals from "../modals/auth/AuthModals";

export default function PublicLayout() {
  const [open, setOpen] = useState(null); 

  return (
    <>
      <PublicHeader
        onLoginClick={() => setOpen("login")}
        onRegisterClick={() => setOpen("register")}
      />

      <main className="public-home">
        <Outlet />
      </main>

      <PublicFooter />

      <AuthModals
        open={open}
        onClose={() => setOpen(null)}
        onOpenLogin={() => setOpen("login")}
        onOpenRegister={() => setOpen("register")}
        onOpenForgot={() => setOpen("forgot")}
      />
    </>
  );
}

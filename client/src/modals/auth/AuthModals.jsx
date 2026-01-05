import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import ForgotPasswordModal from "./ForgotPasswordModal";

export default function AuthModals({
  open,
  onClose,
  onOpenLogin,
  onOpenRegister,
  onOpenForgot,
}) {
  return (
    <>
      <LoginModal
        open={open === "login"}
        onClose={onClose}
        onOpenRegister={onOpenRegister}
        onOpenForgot={onOpenForgot}
      />

      <RegisterModal
        open={open === "register"}
        onClose={onClose}
        onOpenLogin={onOpenLogin}
      />

      <ForgotPasswordModal
        open={open === "forgot"}
        onClose={onClose}
        onOpenLogin={onOpenLogin}
      />
    </>
  );
}

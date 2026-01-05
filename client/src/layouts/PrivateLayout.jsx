import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PrivateHeader from "../components/PrivateHeader";
import PublicFooter from "../components/PublicFooter";

export default function PrivateLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;

  return (
    <>
      <PrivateHeader />

      <main className="private-area">
        <Outlet />
      </main>

      <PublicFooter />
    </>
  );
}

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";
import { fetchCityHallSession, getCityHallHomePath } from "@/lib/cityHallAuth";

const CityHallProtectedRoute = ({ allowedRoles = [] }) => {
  const [status, setStatus] = useState("loading");
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    let active = true;
    fetchCityHallSession()
      .then((auth) => {
        if (active) {
          setAuth(auth);
          setStatus(auth ? "authenticated" : "anonymous");
        }
      })
      .catch(() => {
        if (active) setStatus("anonymous");
      });
    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-[#f6f9fe] text-[#2f66d0]">
        <LoaderCircle className="h-8 w-8 animate-spin" aria-label="Validando sessão" />
      </div>
    );
  }
  if (status === "anonymous") return <Navigate to="/prefeitura" replace />;
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(auth?.usuario?.usuario_funcao)
  ) {
    return <Navigate to={getCityHallHomePath(auth?.usuario)} replace />;
  }
  return <Outlet />;
};

export default CityHallProtectedRoute;

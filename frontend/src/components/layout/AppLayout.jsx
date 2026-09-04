import { Outlet } from "react-router-dom";
import MainNavbar from "./MainNavbar";
import LogoFooter from "./LogoFooter";

const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <MainNavbar />
      <main className="flex-1"><Outlet /></main>
      <LogoFooter />
    </div>
  );
};
export default AppLayout;

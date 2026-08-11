import { Outlet } from "react-router-dom";
import Sidebar from "../../Sidebar/Sidebar";
import Footer from "../../Footer/Footer";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

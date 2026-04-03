"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4">
        <h2 className="text-xl font-bold mb-6">FITSTOP</h2>
        <nav className="space-y-2">
          <a href="/dashboard" className="block px-3 py-2 rounded hover:bg-gray-200">
            Home
          </a>
          <a href="/dashboard/members" className="block px-3 py-2 rounded hover:bg-gray-200">
            Members
          </a>
          <a href="/dashboard/products" className="block px-3 py-2 rounded hover:bg-gray-200">
            Products
          </a>
          <a href="/dashboard/transactions" className="block px-3 py-2 rounded hover:bg-gray-200">
            Transactions
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top nav */}
        <header className="flex justify-between items-center bg-white shadow px-6 py-4">
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </header>

        {/* Page content */}
        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  );
}
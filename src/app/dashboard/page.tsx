"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabaseClient";

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-semibold">Logged in</h1>
      <button
        onClick={handleLogout}
        className="bg-gray-800 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}

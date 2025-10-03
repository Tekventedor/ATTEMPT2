"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const e = localStorage.getItem("userEmail");
      setEmail(e);
    } catch {}
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("userEmail");
    } catch {}
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-semibold">Logged in</h1>
      {email && <p className="text-sm text-gray-600">{email}</p>}
      <button
        onClick={handleLogout}
        className="bg-gray-800 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}

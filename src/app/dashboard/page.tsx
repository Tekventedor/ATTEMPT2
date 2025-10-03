"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../utils/supabaseClient";

type Course = {
  id: string;
  title: string;
  description: string | null;
  image_name: string | null;
  tags: string[];
  table: "course1" | "course2";
};

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        router.replace("/");
        return;
      }
      setEmail(session.user.email ?? null);

      const [c1, c2] = await Promise.all([
        supabase.from("course1").select("id, title, description, image_name, tags"),
        supabase.from("course2").select("id, title, description, image_name, tags"),
      ]);

      const list: Course[] = [];
      if (c1.data) list.push(...c1.data.map(r => ({ ...r, table: "course1" as const })));
      if (c2.data) list.push(...c2.data.map(r => ({ ...r, table: "course2" as const })));

      setCourses(list);
    };
    void init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen" style={{ backgroundImage: "url('/images/background.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="backdrop-brightness-95 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-white">Courses</h1>
              {email && <p className="text-sm text-gray-200">{email}</p>}
            </div>
            <button onClick={handleLogout} className="bg-gray-900 text-white px-4 py-2 rounded">Logout</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {courses.map((c) => {
              const src = c.image_name ? `/images/${c.image_name}` : "/vercel.svg";
              return (
                <Link key={`${c.table}-${c.id}`} href={`/course/${c.table}/${c.id}`} className="group rounded-lg overflow-hidden shadow border border-white/10 bg-white/5 hover:bg-white/10 transition">
                  <div className="relative w-full aspect-[16/9]">
                    <Image src={src} alt={c.title} fill className="object-cover" />
                  </div>
                  <div className="p-4">
                    <h2 className="text-white font-medium mb-1">{c.title}</h2>
                    {c.tags?.length ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {c.tags.map((t, i) => (
                          <span key={i} className="text-xs bg-white/10 text-white px-2 py-1 rounded">{t}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Link>
              );
            })}

            {courses.length === 0 && (
              <div className="col-span-full text-white/80">
                No courses yet. Add rows to `course1` and `course2` in Supabase. Place images under `public/images/` and set `image_name` to the filename.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

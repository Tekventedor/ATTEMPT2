"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "../../../../utils/supabaseClient";

type Course = {
  id: string;
  title: string;
  description: string | null;
  image_name: string | null;
  tags: string[];
};

export default function CourseDetail() {
  const params = useParams<{ table: string; id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    const run = async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) {
        router.replace("/");
        return;
      }
      const table = params.table as "course1" | "course2";
      const id = params.id;
      const { data } = await supabase.from(table).select("id, title, description, image_name, tags").eq("id", id).maybeSingle();
      setCourse(data as Course | null);
    };
    void run();
  }, [params, router]);

  if (!course) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  const src = course.image_name ? `/images/${course.image_name}` : "/vercel.svg";

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: "url('/images/background.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur rounded-lg p-4 text-white">
        <div className="relative w-full aspect-[16/9] rounded overflow-hidden">
          <Image src={src} alt={course.title} fill className="object-cover" />
        </div>
        <h1 className="text-2xl font-semibold mt-4">{course.title}</h1>
        {course.description && <p className="mt-2 text-white/90">{course.description}</p>}
        {course.tags?.length ? (
          <div className="flex flex-wrap gap-2 mt-4">
            {course.tags.map((t, i) => (
              <span key={i} className="text-xs bg-white/10 text-white px-2 py-1 rounded">{t}</span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

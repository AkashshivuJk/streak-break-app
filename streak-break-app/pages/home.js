import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import BentoCard from "../components/BentoCard";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState({});
  const [value, setValue] = useState(new Date());
  const [counts, setCounts] = useState({ streak_count: 0, break_count: 0 });

  // Fetch current user session
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      if (!sessionUser) {
        router.push("/"); // redirect to login
        return;
      }
      setUser(sessionUser);
    };
    fetchUser();
  }, [router]);

  // Fetch activities and counts
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Activities
      const { data: activityData } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", user.id);

      const map = {};
      activityData?.forEach((a) => (map[a.date] = a.action));
      setActivities(map);

      // Counts
      const { data: userData } = await supabase
        .from("users")
        .select("streak_count, break_count")
        .eq("id", user.id)
        .single();

      if (userData) setCounts(userData);
    };
    fetchData();
  }, [user]);

  const handleDayClick = async (action) => {
    const today = new Date().toISOString().split("T")[0];
    if (activities[today]) return alert("Already selected today!");

    const res = await fetch("/api/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, action, date: today }),
    });

    const data = await res.json();
    if (res.ok) {
      setActivities({ ...activities, [today]: action });
      setCounts((prev) => ({
        ...prev,
        [action === "streak" ? "streak_count" : "break_count"]:
          prev[action === "streak" ? "streak_count" : "break_count"] + 1,
      }));
    } else alert(data.error);
  };

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const d = date.toISOString().split("T")[0];
    if (activities[d] === "streak") return <span>🔥</span>;
    if (activities[d] === "break") return <span>🛑</span>;
    return null;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!user) return null; // prevent flashing page

  return (
    <Layout>
      <div className="max-w-3xl mx-auto mt-10 p-4">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold">Hello, {user.email}</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>

        <Calendar value={value} onChange={setValue} tileContent={tileContent} />

        <div className="flex justify-center gap-4 mt-4">
          <button
            className="bg-orange-500 text-white px-6 py-2 rounded"
            onClick={() => handleDayClick("streak")}
          >
            🔥 Streak
          </button>
          <button
            className="bg-gray-500 text-white px-6 py-2 rounded"
            onClick={() => handleDayClick("break")}
          >
            🛑 Break
          </button>
        </div>

        <div className="flex justify-center gap-6 mt-6">
          <BentoCard title="Total Streaks" value={counts.streak_count} emoji="🔥" />
          <BentoCard title="Total Breaks" value={counts.break_count} emoji="🛑" />
        </div>
      </div>
    </Layout>
  );
}

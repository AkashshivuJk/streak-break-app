// pages/home.js
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState({});
  const [value, setValue] = useState(new Date());
  const [counts, setCounts] = useState({ streak_count: 0, break_count: 0 });

  // Get user from router query (passed from login)
  useEffect(() => {
    if (!router.query.user) return;
    setUser(JSON.parse(router.query.user));
  }, [router.query.user]);

  // Fetch activities and counts
  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;

      const { data: acts } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", user.id);

      const map = {};
      acts.forEach((a) => (map[a.date] = a.action));
      setActivities(map);

      // Calculate counts
      const streaks = acts.filter((a) => a.action === "streak").length;
      const breaks = acts.filter((a) => a.action === "break").length;
      setCounts({ streak_count: streaks, break_count: breaks });
    };

    fetchActivities();
  }, [user]);

  // Only today is clickable
  const tileDisabled = ({ date, view }) => {
    if (view !== "month") return false;
    const today = new Date().toISOString().split("T")[0];
    const d = date.toISOString().split("T")[0];
    return d !== today;
  };

  // Emoji for calendar tiles
  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const d = date.toISOString().split("T")[0];
    if (activities[d] === "streak") return <span>🔥</span>;
    if (activities[d] === "break") return <span>🛑</span>;
    return null;
  };

  // Handle streak/break action
  const handleAction = async (action) => {
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

  const handleLogout = () => router.push("/");

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto mt-10 p-4">
        {/* Header */}
        <div className="flex justify-between mb-6 items-center">
          <h1 className="text-2xl font-bold">Hello, {user.username}</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {/* Calendar */}
        <div className="bg-white shadow rounded p-4 mb-6">
          <p className="mb-2">
            Select your action for today only (🔥 Streak / 🛑 Break)
          </p>
          <Calendar
            value={value}
            onChange={setValue}
            tileContent={tileContent}
            tileDisabled={tileDisabled}
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
            onClick={() => handleAction("streak")}
          >
            🔥 Streak
          </button>
          <button
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            onClick={() => handleAction("break")}
          >
            🛑 Break
          </button>
        </div>

        {/* Bento-style summary cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-yellow-100 p-4 rounded shadow flex flex-col items-center">
            <span className="text-xl font-bold">{counts.streak_count}</span>
            <span>🔥 Total Streaks</span>
          </div>
          <div className="bg-blue-100 p-4 rounded shadow flex flex-col items-center">
            <span className="text-xl font-bold">{counts.break_count}</span>
            <span>🛑 Total Breaks</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}

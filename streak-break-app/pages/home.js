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

  // Set user from query
  useEffect(() => {
    if (!router.query.user) return;
    setUser(JSON.parse(router.query.user));
  }, [router.query.user]);

  // Fetch user activity
  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", user.id);
      const map = {};
      data.forEach((a) => (map[a.date] = a.action));
      setActivities(map);
    };
    fetchActivities();
  }, [user]);

  // Handle streak/break click
  const handleActionClick = async (action) => {
    const today = new Date();
    const d = today.toLocaleDateString("en-CA"); // YYYY-MM-DD local

    if (activities[d]) return alert("You already selected today!");

    try {
      const res = await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, action, date: d }),
      });

      const data = await res.json();
      if (res.ok) setActivities({ ...activities, [d]: action });
      else alert(data.error);
    } catch (err) {
      console.error(err);
      alert("Error saving action");
    }
  };

  // Show fire/break emoji in calendar
  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const d = date.toLocaleDateString("en-CA");
    if (activities[d] === "streak") return <span>🔥</span>;
    if (activities[d] === "break") return <span>🛑</span>;
    return null;
  };

  // Disable past/future days except today
  const tileDisabled = ({ date, view }) => {
    if (view !== "month") return false;
    const today = new Date().toLocaleDateString("en-CA");
    const d = date.toLocaleDateString("en-CA");
    return d !== today;
  };

  // Logout
  const handleLogout = () => router.push("/");

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto mt-10 p-4">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold">Hello, {user.username}</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        <Calendar
          value={value}
          onChange={setValue}
          tileContent={tileContent}
          tileDisabled={tileDisabled}
        />

        <div className="flex justify-center gap-4 mt-4">
          <button
            className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
            onClick={() => handleActionClick("streak")}
          >
            🔥 Streak
          </button>
          <button
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            onClick={() => handleActionClick("break")}
          >
            🛑 Break
          </button>
        </div>
      </div>
    </Layout>
  );
}

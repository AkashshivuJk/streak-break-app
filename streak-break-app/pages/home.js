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
  const [counts, setCounts] = useState({ streak: 0, break: 0 });

  // Get current logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/");
      } else {
        setUser(data.user);
      }
    };
    getUser();
  }, [router]);

  // Fetch user activities
  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        return;
      }

      const map = {};
      let streakCount = 0;
      let breakCount = 0;

      data.forEach((a) => {
        map[a.date] = a.action;
        if (a.action === "streak") streakCount++;
        else if (a.action === "break") breakCount++;
      });

      setActivities(map);
      setCounts({ streak: streakCount, break: breakCount });
    };
    fetchActivities();
  }, [user]);

  // Handle streak/break click (only today)
  const handleAction = async (action) => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    if (activities[today]) return alert("You already selected today!");

    const { error } = await supabase.from("user_activity").insert([
      {
        user_id: user.id,
        date: today,
        action,
      },
    ]);

    if (error) return alert(error.message);

    setActivities({ ...activities, [today]: action });
    setCounts({
      streak: counts.streak + (action === "streak" ? 1 : 0),
      break: counts.break + (action === "break" ? 1 : 0),
    });
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

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto mt-10 p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Hello, {user.email}
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        {/* Calendar Card */}
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 shadow-lg rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Your Activity Calendar
          </h2>
          <Calendar
            value={value}
            onChange={setValue}
            tileContent={tileContent}
            className="rounded-lg overflow-hidden"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6 mb-6">
          <button
            onClick={() => handleAction("streak")}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold transition"
          >
            🔥 Streak
          </button>
          <button
            onClick={() => handleAction("break")}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold transition"
          >
            🛑 Break
          </button>
        </div>

        {/* Bento-style summary */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-yellow-100 rounded-xl p-6 flex flex-col items-center shadow-md">
            <span className="text-4xl mb-2">🔥</span>
            <span className="text-lg font-semibold">Total Streaks</span>
            <span className="text-2xl font-bold">{counts.streak}</span>
          </div>
          <div className="bg-blue-100 rounded-xl p-6 flex flex-col items-center shadow-md">
            <span className="text-4xl mb-2">🛑</span>
            <span className="text-lg font-semibold">Total Breaks</span>
            <span className="text-2xl font-bold">{counts.break}</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}

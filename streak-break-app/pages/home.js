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
  const [totals, setTotals] = useState({ streak_count: 0, break_count: 0 });

  // Fetch current user session from Supabase
  useEffect(() => {
    const sessionUser = supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/"); // redirect to login if not logged in
      } else {
        setUser(data.session.user);
      }
    });
  }, [router]);

  // Fetch user activity and totals
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: acts } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", user.id);

      const map = {};
      acts.forEach((a) => (map[a.date] = a.action));
      setActivities(map);

      const streaks = acts.filter((a) => a.action === "streak").length;
      const breaks = acts.filter((a) => a.action === "break").length;
      setTotals({ streak_count: streaks, break_count: breaks });
    };

    fetchData();
  }, [user]);

  // Only allow today to be clicked
  const handleDayClick = async (action) => {
    if (!user) return;
    const today = new Date();
    const d = today.toISOString().split("T")[0];

    if (activities[d]) return alert("Already selected today!");

    const { error } = await supabase.from("user_activity").insert([
      {
        user_id: user.id,
        date: d,
        action,
      },
    ]);

    if (error) return alert("Error saving activity");

    setActivities({ ...activities, [d]: action });
    setTotals({
      streak_count: totals.streak_count + (action === "streak" ? 1 : 0),
      break_count: totals.break_count + (action === "break" ? 1 : 0),
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Hello, {user.email || "User"}
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        <div className="bg-white shadow rounded p-6 mb-6">
          <Calendar
            value={value}
            onChange={setValue}
            tileContent={tileContent}
          />
        </div>

        <div className="flex justify-center gap-4 mb-6">
          <button
            className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
            onClick={() => handleDayClick("streak")}
          >
            🔥 Streak
          </button>
          <button
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            onClick={() => handleDayClick("break")}
          >
            🛑 Break
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-yellow-100 p-6 rounded shadow text-center">
            <h2 className="text-xl font-semibold mb-2">Total Streaks</h2>
            <p className="text-3xl font-bold text-yellow-600">{totals.streak_count}</p>
          </div>
          <div className="bg-blue-100 p-6 rounded shadow text-center">
            <h2 className="text-xl font-semibold mb-2">Total Breaks</h2>
            <p className="text-3xl font-bold text-blue-600">{totals.break_count}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

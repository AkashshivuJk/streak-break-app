import { supabaseAdmin } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, action, date } = req.body;
  if (!userId || !action || !date) return res.status(400).json({ error: "Missing params" });

  try {
    const supabaseS = supabaseAdmin();

    // Check if user already has an action for this date
    const { data: existing, error: existingError } = await supabaseS
      .from("user_activity")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .single();

    if (existing) return res.status(400).json({ error: "Already selected today" });
    if (existingError && existingError.code !== "PGRST116") throw existingError;

    // Insert new action
    const { data, error } = await supabaseS
      .from("user_activity")
      .insert([{ user_id: userId, action, date }])
      .select()
      .single();

    if (error) throw error;

    // Optionally, increment streak_count or break_count in users table
    const field = action === "streak" ? "streak_count" : "break_count";
    const { data: updatedUser, error: updateError } = await supabaseS
      .from("users")
      .update({ [field]: (existing?.[field] || 0) + 1 })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({ message: "Action saved", activity: data, user: updatedUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

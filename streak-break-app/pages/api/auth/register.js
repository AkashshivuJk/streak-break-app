import { supabaseAdmin } from "../../../lib/supabaseClient";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });

  try {
    const hashed = bcrypt.hashSync(password, 10);
    const supabaseS = supabaseAdmin();
    const { data, error } = await supabaseS.from("users").insert([{ username, password_hash: hashed, streak_count: 0, break_count: 0 }]).select().single();
    if (error) throw error;
    res.status(200).json({ user: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

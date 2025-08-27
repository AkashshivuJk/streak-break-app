import { supabaseAdmin } from "../../../lib/supabaseClient";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });

  try {
    const supabaseS = supabaseAdmin();
    const { data: user, error } = await supabaseS.from("users").select("*").eq("username", username).single();
    if (error || !user) throw new Error("Invalid credentials");

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) throw new Error("Invalid credentials");

    res.status(200).json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

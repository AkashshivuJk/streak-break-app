import React, { useState } from "react";
import AuthForm from "../components/AuthForm";

export default function Index() {
  const [mode, setMode] = useState("login"); // login or register

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow p-8 rounded w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {mode === "login" ? "Login" : "Register"}
        </h1>
        <AuthForm mode={mode} />
        <p className="mt-4 text-center text-sm text-gray-500">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}
          <button
            className="ml-2 text-blue-500 underline"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

"use client"; // required in Next.js App Router for interactive components,because nextjs works on server by default and react needs client side

import { useState } from "react";

export default function LoginPage() {
  // state variables for email & password
  const [email, setEmail] = useState("");  //gives us state variables so React can remember the email & password while you type.
  const [password, setPassword] = useState("");

  // function when form is submitted
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // stops page reload
    console.log("Email:", email);
    console.log("Password:", password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

        {/* form starts */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email} // value comes from state
              onChange={(e) => setEmail(e.target.value)} // update state on typing
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-400"
              placeholder="Enter your email"
            />
          </div>

          {/* Password input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-400"
              placeholder="Enter your password"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

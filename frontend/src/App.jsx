import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

  return loggedIn
    ? <Dashboard />
    : <Login onSuccess={() => setLoggedIn(true)} />;
}

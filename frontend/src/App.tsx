import { useState } from "react";
import { supabase } from "./lib/supabase";
import { useAuth } from "./auth/AuthContext";

import ElementSelector from "./features/practice/ElementSelector";

function App() {
  const { user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
      <div>
        <h1>Breather</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button onClick={handleLogin}>Log in</button>

        {error && <p>Error: {error}</p>}
      </div>
    );
  }

  return (
    <div>
      <h1>Breather</h1>

      <p>Logged in as user #{user.id}</p>

      <ElementSelector />

      <button onClick={handleLogout}>Log out</button>
    </div>
  );
}

export default App;
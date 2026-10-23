import { useCallback, useState } from "react";
import { clearSession, getToken } from "./api";
import Login from "./pages/Login";
import Office from "./pages/Office";

export default function App() {
  const [token, setToken] = useState(() => getToken());
  const [notice, setNotice] = useState("");

  const logout = useCallback((message = "") => {
    clearSession();
    setToken("");
    setNotice(message);
  }, []);

  if (!token) {
    return (
      <Login
        notice={notice}
        onSuccess={(next) => {
          setNotice("");
          setToken(next);
        }}
      />
    );
  }

  return <Office onLogout={logout} />;
}

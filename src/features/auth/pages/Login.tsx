import React from "react";

const Login: React.FC = () => {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Login Page</h2>
      <div style={{ marginTop: "2rem" }}>
        <input
          type="text"
          placeholder="Username"
          style={{ padding: "0.5rem", margin: "0.5rem" }}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          style={{ padding: "0.5rem", margin: "0.5rem" }}
        />
        <br />
        <button style={{ padding: "0.5rem 1rem", margin: "0.5rem" }}>
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;

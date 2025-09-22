import React from "react";

const Dashboard: React.FC = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h2>Dashboard</h2>
      <div style={{ marginTop: "2rem" }}>
        <p>Welcome to dyour Admin dashboard!</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginTop: "2rem",
          }}
        >
          <div
            style={{
              padding: "1rem",
              background: "#e3f2fd",
              borderRadius: "8px",
            }}
          >
            <h3>Stats</h3>
            <p>Some statistics here</p>
          </div>
          <div
            style={{
              padding: "1rem",
              background: "#e8f5e9",
              borderRadius: "8px",
            }}
          >
            <h3>Activities</h3>
            <p>Recent activities</p>
          </div>
          <div
            style={{
              padding: "1rem",
              background: "#fff3e0",
              borderRadius: "8px",
            }}
          >
            <h3>Notifications</h3>
            <p>Your notifications</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

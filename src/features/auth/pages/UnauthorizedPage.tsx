import React from "react";
import { FaLock, FaHome, FaSignInAlt, FaArrowLeft } from "react-icons/fa";

const UnauthorizedPage: React.FC = () => {
  return (
    <div style={{ 
      padding: "2rem", 
      textAlign: "center",
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "Arial, sans-serif"
    }}>
      <FaLock size={64} color="#d32f2f" style={{ marginBottom: "1rem" }} />
      <h2 style={{ color: "#d32f2f", marginBottom: "1rem" }}>Access Denied</h2>
      <p style={{ marginBottom: "2rem", color: "#666", fontSize: "1.1rem" }}>
        You don't have permission to access this page.
      </p>
      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <button 
          style={{ 
            padding: "0.75rem 1.5rem", 
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
          onClick={() => window.history.back()}
        >
          <FaArrowLeft /> Go Back
        </button>
        <button 
          style={{ 
            padding: "0.75rem 1.5rem", 
            backgroundColor: "#388e3c",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
          onClick={() => window.location.href = "/"}
        >
          <FaHome /> Go to Home
        </button>
        <button 
          style={{ 
            padding: "0.75rem 1.5rem", 
            backgroundColor: "#f57c00",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
          onClick={() => window.location.href = "/login"}
        >
          <FaSignInAlt /> Login
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
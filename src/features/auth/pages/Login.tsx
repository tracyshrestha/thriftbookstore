import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/contexts/UserContext";
import { DEMO_CREDENTIALS } from "@/constants";
import type { LoginPageProps } from "@/types/components";
import type { LoginFormData } from "@/features/auth/types/auth.types";

function LoginPage({ className }: LoginPageProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login, user } = useUser();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setIsLoading(true);

  try {
    const loggedInUser = await login(formData.email); // return the found user from login
    if (loggedInUser) {
      // navigate based on role immediately
      if (loggedInUser.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (loggedInUser.role === "user") {
        navigate("/user", { replace: true });
      } else {
        setError("Unknown role, cannot navigate.");
      }
    } else {
      setError("Invalid email. Please try again.");
    }
  } catch {
    setError("Login failed. Please try again.");
  } finally {
    setIsLoading(false);
  }
};


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 ${
        className || ""
      }`}
    >
      <Card className="w-full max-w-sm bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-indigo-800 flex items-center justify-center gap-2">
            📚 Library System
          </CardTitle>
          <p className="text-indigo-600">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
                className="border-gray-300 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter your password"
                className="border-gray-300 focus:border-indigo-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800 font-medium">
              Demo Credentials:
            </p>
            <p className="text-xs text-blue-600 mt-1">
              <strong>Regular User:</strong>
              <br />
              Email:{" "}
              {DEMO_CREDENTIALS.REGULAR_USERS.map((u) => u.email).join(" or ")}
              <br />
              <strong>Admin User:</strong>
              <br />
              Email: {DEMO_CREDENTIALS.ADMIN_USER.email}
              <br />
              Password: (any password works)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;

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
import LoginHero from "@/assets/book.png";
import { Eye, EyeOff, User, UserCheck, Shield } from "lucide-react";
import { GiBookCover } from "react-icons/gi";

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

  const fillDemoCredentials = (email: string) => {
    setError("");
    setFormData({
      email,
      // Login only checks email; any password works for demos
      password: "password",
    });
  };

  return (
    <div className={`w-full h-screen min-h-screen flex  ${className || ""}`}>
      <div className="hidden lg:flex w-1/2 h-full relative overflow-hidden bg-purple-900">
        <img
          className="absolute inset-0 h-[80%]  object-cover justify-center m-auto "
          src={LoginHero}
          alt="Login Hero"
        />
      </div>
      <div className="w-1/2  h-full bg-gray-100 justify-center items-center flex ">
        <Card className="w-full max-w-md bg-white backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center">
           
            <CardTitle className="text-2xl font-bold text-black flex items-center justify-center gap-2"> <GiBookCover className="mt-1" />
              Thrift Bookstore
            </CardTitle>
            <p className="text-gray-500 ">
              Gateway to a world of well-loved books.
            </p>
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
                  className="border-gray-300 focus:border-gray-500"
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
                  className="border-gray-300 focus:border-gray-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 hover:from-blue-700 hover:via-purple-700 hover:to-blue-900 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            {/* <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800 font-medium">
                  Demo Credentials:
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  <strong>Regular User:</strong>
                  <br />
                  Email:{" "}
                  {DEMO_CREDENTIALS.REGULAR_USERS.map((u) => u.email).join(
                    " or "
                  )}
                  <br />
                  <strong>Admin User:</strong>
                  <br />
                  Email: {DEMO_CREDENTIALS.ADMIN_USER.email}
                  <br />
                  Password: (any password works)
                </p>
              </div> */}
            <div className="mt-3 space-y-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center mb-4">
                Quick Login
              </p>

              {/* First row - 2 buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 bg-blue-100/80 hover:bg-blue-200/90  border-blue-300/70  text-blue-800 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md rounded-lg"
                  onClick={() =>
                    fillDemoCredentials(DEMO_CREDENTIALS.REGULAR_USERS[0].email)
                  }
                >
                  <User className="w-4 h-4 mr-2" />
                  <span className="font-medium">User 1</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 bg-pink-100/80 hover:bg-pink-200/90  border-pink-300/70  text-emerald-800 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md rounded-lg"
                  onClick={() =>
                    fillDemoCredentials(DEMO_CREDENTIALS.REGULAR_USERS[1].email)
                  }
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  <span className="font-medium">User 2</span>
                </Button>
              </div>

              {/* Second row - 1 button centered */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-64 h-11 bg-violet-100/80 hover:bg-violet-200/90   border-violet-300/70  text-violet-800 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md rounded-lg"
                  onClick={() =>
                    fillDemoCredentials(DEMO_CREDENTIALS.ADMIN_USER.email)
                  }
                >
                  <Shield className="w-4 h-4 mr-2" />
                  <span className="font-medium">Admin</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;

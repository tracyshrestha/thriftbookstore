import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/contexts/UserContext";
import type { LoginPageProps } from "@/types/components";
import type { LoginFormData } from "@/features/auth/types/auth.types";
import LoginHero from "@/assets/book.png";
import { User, UserCheck, Shield, Crown } from "lucide-react";
import { GiBookCover } from "react-icons/gi";
import {
  fetchCredentials,
  type CredentialAccount,
} from "@/api/auth.api";
import { isAdminRole } from "@/constants";

function LoginPage({ className }: LoginPageProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<CredentialAccount[]>([]);

  const navigate = useNavigate();
  const { login } = useUser();

  useEffect(() => {
    let cancelled = false;
    fetchCredentials()
      .then((list) => {
        if (!cancelled) setAccounts(list);
      })
      .catch(() => {
        /* quick-login buttons stay empty if credentials fail to load */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const loggedInUser = await login(formData.email, formData.password);
      if (loggedInUser) {
        if (
          loggedInUser.role === "user" ||
          isAdminRole(loggedInUser.role)
        ) {
          navigate("/dashboard", { replace: true });
        } else {
          setError("Unknown role, cannot navigate.");
        }
      } else {
        setError("Invalid email or password. Please try again.");
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

  const fillDemoCredentials = (account: CredentialAccount) => {
    setError("");
    setFormData({
      email: account.email,
      password: account.password,
    });
  };

  const byRole = (role: string) => accounts.filter((a) => a.role === role);
  const users = byRole("user");
  const admin = byRole("admin")[0];
  const superAdmin = byRole("superadmin")[0];

  return (
    <div className={`w-full h-screen min-h-screen flex  ${className || ""}`}>
      <div className="hidden lg:flex w-1/2 h-full relative overflow-hidden bg-gradient-to-br from-ink-900 via-ink-800 to-ink-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(61,90,124,0.35),transparent_55%)]" />
        <img
          className="absolute inset-0 h-[80%] object-cover justify-center m-auto drop-shadow-2xl"
          src={LoginHero}
          alt="Login Hero"
        />
      </div>
      <div className="w-full lg:w-1/2 h-full bg-ink-50 justify-center items-center flex ">
        <Card className="w-full max-w-md bg-white backdrop-blur-sm border border-ink-100 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-ink-950 flex items-center justify-center gap-2">
              <GiBookCover className="mt-1 text-ink-600" />
              Thrift Bookstore
            </CardTitle>
            <p className="text-ink-600/70 ">
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
                <Label htmlFor="email" className="text-ink-900 font-medium">
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
                  className="border-ink-200 focus:border-ink-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-ink-900 font-medium">
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
                  className="border-ink-200 focus:border-ink-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-ink-600 via-ink-600 to-ink-800 hover:from-ink-700 hover:via-ink-700 hover:to-ink-900 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-3 space-y-3">
              <p className="text-sm font-medium text-ink-500 text-center mb-4">
                Quick Login
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {users[0] && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 bg-ink-50 hover:bg-ink-100 border-ink-200 text-ink-800 transition-all duration-200 hover:scale-[1.02] hover:shadow-md rounded-lg"
                    onClick={() => fillDemoCredentials(users[0])}
                  >
                    <User className="w-4 h-4 mr-2" />
                    <span className="font-medium">{users[0].label}</span>
                  </Button>
                )}
                {users[1] && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 bg-ink-100/80 hover:bg-ink-200 border-ink-300 text-ink-800 transition-all duration-200 hover:scale-[1.02] hover:shadow-md rounded-lg"
                    onClick={() => fillDemoCredentials(users[1])}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    <span className="font-medium">{users[1].label}</span>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {admin && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 bg-ink-200/50 hover:bg-ink-200 border-ink-300 text-ink-900 transition-all duration-200 hover:scale-[1.02] hover:shadow-md rounded-lg"
                    onClick={() => fillDemoCredentials(admin)}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    <span className="font-medium">{admin.label}</span>
                  </Button>
                )}
                {superAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 bg-ink-100 hover:bg-ink-200 border-ink-300 text-ink-900 transition-all duration-200 hover:scale-[1.02] hover:shadow-md rounded-lg"
                    onClick={() => fillDemoCredentials(superAdmin)}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    <span className="font-medium">{superAdmin.label}</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;

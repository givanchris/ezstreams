import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tv, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/search");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8 || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      toast({
        title: "Weak password",
        description: "Password must be at least 8 characters and include a special character (!@#$%^&* etc.).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error, needsConfirmation } = await signUp(email, password);
    setLoading(false);

    if (error) {
      let message = "An error occurred during signup.";
      
      if (error.message.includes("User already registered")) {
        message = "An account with this email already exists. Try logging in instead.";
      } else if (error.message.includes("Invalid email")) {
        message = "Please enter a valid email address.";
      } else if (error.message.includes("Password")) {
        message = error.message;
      } else {
        message = error.message;
      }

      toast({
        title: "Signup failed",
        description: message,
        variant: "destructive",
      });
      return;
    }

    if (needsConfirmation) {
      setSignupSuccess(true);
    } else {
      // Email confirmation disabled - redirect immediately
      navigate("/search");
    }
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="hero-glow top-0 left-1/4 animate-pulse-glow" />
        <div className="hero-glow bottom-0 right-1/4 animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

        <div className="w-full max-w-md relative z-10">
          <div className="glass-card rounded-2xl p-8 animate-fade-up text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">
              Check Your Email
            </h1>
            <p className="text-muted-foreground mb-6">
              We've sent a confirmation link to <strong className="text-foreground">{email}</strong>. 
              Please check your inbox and click the link to activate your account.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="hero-glow top-0 left-1/4 animate-pulse-glow" />
      <div className="hero-glow bottom-0 right-1/4 animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="w-full max-w-md relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="glass-card rounded-2xl p-8 animate-fade-up">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
              <Tv className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              EZ<span className="text-gradient">stream</span>
            </span>
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Create an Account
          </h1>
          <p className="text-muted-foreground mb-8">
            Start streamlining your entertainment today
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-border focus:border-primary"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-border focus:border-primary"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Min 8 characters with 1 special character (!@#$%&* etc.)
              </p>
            </div>

            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

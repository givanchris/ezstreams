import { useState } from "react";
import { Link } from "react-router-dom";
import { Tv, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Signup submitted:", { email, password });
  };

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
              />
            </div>

            <Button type="submit" variant="hero" className="w-full">
              Sign Up
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

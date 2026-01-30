import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, Home, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const createdAt = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="hero-glow top-0 left-1/4 animate-pulse-glow" />
      <div className="hero-glow bottom-0 right-1/4 animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-12 animate-fade-up">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center mx-auto mb-6">
            <User className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            <span className="text-gradient">Profile</span>
          </h1>
        </div>

        {/* Profile info card */}
        <div className="glass-card rounded-2xl p-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-display text-xl font-semibold text-foreground mb-6">
            Account Information
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{user?.email || "Not available"}</p>
              </div>
            </div>

            {createdAt && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member since</p>
                  <p className="font-medium text-foreground">{createdAt}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <Button variant="outline" size="lg" className="flex-1" asChild>
            <Link to="/">
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
          </Button>
          <Button 
            variant="destructive" 
            size="lg" 
            className="flex-1"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

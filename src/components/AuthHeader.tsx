import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function AuthHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {user ? (
        <div className="glass-card rounded-full px-4 py-2 flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span className="max-w-[150px] truncate">{user.email}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>
        </div>
      ) : (
        <Link to="/login">
          <Button variant="outline" size="sm" className="glass-card">
            Log In
          </Button>
        </Link>
      )}
    </div>
  );
}

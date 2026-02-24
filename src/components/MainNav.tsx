import { Link, useLocation, useNavigate } from "react-router-dom";
import { Tv, Home, Search, Film, Tv2, Heart, User, Menu, X } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/movies", label: "Movies", icon: Film },
  { to: "/series", label: "Series", icon: Tv2 },
  { to: "/lists", label: "My Lists", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
];

const MainNav = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleHomeClick = useCallback((e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 px-6 py-4 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card rounded-2xl px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" onClick={handleHomeClick} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
              <Tv className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              EZ<span className="text-gradient">stream</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={item.to === "/" ? handleHomeClick : undefined}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground max-w-[150px] truncate">
                  {user.email}
                </span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button variant="glass" size="sm" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 glass-card rounded-2xl p-4 animate-scale-in">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                  return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={(e) => {
                      if (item.to === "/") handleHomeClick(e);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="border-t border-border mt-3 pt-3">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground px-4 truncate">
                      {user.email}
                    </span>
                    <Button variant="outline" size="sm" onClick={signOut}>
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button variant="glass" size="sm" className="flex-1" asChild>
                      <Link to="/login">Sign In</Link>
                    </Button>
                    <Button variant="hero" size="sm" className="flex-1" asChild>
                      <Link to="/signup">Get Started</Link>
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default MainNav;

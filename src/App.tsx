import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import MainNav from "@/components/MainNav";
import Upgrade from "./pages/Upgrade";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Search from "./pages/Search";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import Lists from "./pages/Lists";
import Subscriptions from "./pages/Subscriptions";
import Profile from "./pages/Profile";
import MovieDetails from "./pages/MovieDetails";
import SeriesDetails from "./pages/SeriesDetails";
import TvDetails from "./pages/TvDetails";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import PublicProfile from "./pages/PublicProfile";
import ListDetail from "./pages/ListDetail";
import CreateList from "./pages/CreateList";
import GenrePage from "./pages/GenrePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
          <MainNav />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <Search />
                </ProtectedRoute>
              }
            />
            <Route
              path="/movies"
              element={
                <ProtectedRoute>
                  <Movies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/series"
              element={
                <ProtectedRoute>
                  <Series />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lists"
              element={
                <ProtectedRoute>
                  <Lists />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscriptions"
              element={
                <ProtectedRoute>
                  <Subscriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/movie/:id"
              element={
                <ProtectedRoute>
                  <MovieDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/series/:id"
              element={
                <ProtectedRoute>
                  <SeriesDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tv/:id"
              element={
                <ProtectedRoute>
                  <TvDetails />
                </ProtectedRoute>
              }
            />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/user/:username" element={<PublicProfile />} />
            <Route path="/list/:slug" element={<ListDetail />} />
            <Route
              path="/create-list"
              element={
                <ProtectedRoute>
                  <CreateList />
                </ProtectedRoute>
              }
            />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/genre/:slug" element={
              <ProtectedRoute>
                <GenrePage />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

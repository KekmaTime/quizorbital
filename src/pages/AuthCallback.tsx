import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Exchange the auth code for a session
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(
          window.location.hash
        );
        
        if (error) {
          console.error("Error during auth callback:", error);
          navigate("/signin?error=Authentication%20failed");
          return;
        }

        if (session) {
          // Successfully authenticated
          navigate("/");
        }
      } catch (error) {
        console.error("Error in auth callback:", error);
        navigate("/signin?error=Authentication%20failed");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Completing Authentication</h2>
        <p className="text-gray-400">Please wait while we log you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 
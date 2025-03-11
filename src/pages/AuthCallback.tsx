import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the URL hash and handle the OAuth callback
      const { error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error during auth callback:", error);
        navigate("/signin?error=Authentication%20failed");
      } else {
        // Redirect to the home page or dashboard after successful authentication
        navigate("/");
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
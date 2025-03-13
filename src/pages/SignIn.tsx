import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionBadge } from "@/components/ui/section-badge";
import { Footer } from "@/components/landing/Footer";
import { Lock, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

const SignIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Note: Navigation happens automatically after OAuth redirect
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-900 to-cyan-900 py-16">
        <div className="container px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <SectionBadge className="mb-4">
              <Lock className="w-4 h-4 mr-2 text-cyan-400" />
              <span className="text-sm font-medium">Secure Access</span>
            </SectionBadge>
            <h1 className="text-4xl font-bold mb-6">Sign In to QUIZORBIS</h1>
            <p className="text-xl text-white/80">
              Welcome back! Sign in to continue your learning journey.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Sign In Form */}
      <div className="container px-4 mx-auto py-16">
        <div className="max-w-md mx-auto">
          <Card className="border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription className="text-gray-400">
                Access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center mb-4">
                <p className="text-gray-400">
                  Sign in with your Google account for the fastest and most secure experience.
                </p>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700 py-6"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <FcGoogle className="mr-2 h-5 w-5" />
                )}
                Continue with Google
              </Button>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-gray-400">
                Don't have an account?{" "}
                <Link to="/signup" className="text-purple-400 hover:text-purple-300 font-medium">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SignIn; 
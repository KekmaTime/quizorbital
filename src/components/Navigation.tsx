import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User, LogOut, Settings, Home, BookOpen, BarChart2, PlusCircle } from "lucide-react";

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">
                QUIZORBIS
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-purple-600 ${
                isActive("/") ? "text-purple-600" : "text-gray-600"
              }`}
            >
              Home
            </Link>
            <Link
              to="/pricing"
              className={`text-sm font-medium transition-colors hover:text-purple-600 ${
                isActive("/pricing") ? "text-purple-600" : "text-gray-600"
              }`}
            >
              Pricing
            </Link>
            <Link
              to="/faq"
              className={`text-sm font-medium transition-colors hover:text-purple-600 ${
                isActive("/faq") ? "text-purple-600" : "text-gray-600"
              }`}
            >
              FAQ
            </Link>
            
            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors hover:text-purple-600 ${
                    isActive("/dashboard") ? "text-purple-600" : "text-gray-600"
                  }`}
                >
                  Dashboard
                </Link>
                
                <Link
                  to="/quiz/create"
                  className={`text-sm font-medium transition-colors hover:text-purple-600 ${
                    isActive("/quiz/create") ? "text-purple-600" : "text-gray-600"
                  }`}
                >
                  Create Quiz
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-white">
                        {currentUser.name.charAt(0)}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMenu}>
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Link
              to="/"
              className="block py-2 text-base font-medium text-gray-600 hover:text-purple-600"
              onClick={closeMenu}
            >
              <div className="flex items-center">
                <Home className="mr-2 h-5 w-5" />
                Home
              </div>
            </Link>
            <Link
              to="/pricing"
              className="block py-2 text-base font-medium text-gray-600 hover:text-purple-600"
              onClick={closeMenu}
            >
              <div className="flex items-center">
                <BarChart2 className="mr-2 h-5 w-5" />
                Pricing
              </div>
            </Link>
            <Link
              to="/faq"
              className="block py-2 text-base font-medium text-gray-600 hover:text-purple-600"
              onClick={closeMenu}
            >
              <div className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                FAQ
              </div>
            </Link>
            
            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  className="block py-2 text-base font-medium text-gray-600 hover:text-purple-600"
                  onClick={closeMenu}
                >
                  <div className="flex items-center">
                    <Home className="mr-2 h-5 w-5" />
                    Dashboard
                  </div>
                </Link>
                <Link
                  to="/quiz/create"
                  className="block py-2 text-base font-medium text-gray-600 hover:text-purple-600"
                  onClick={closeMenu}
                >
                  <div className="flex items-center">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Quiz
                  </div>
                </Link>
                <Link
                  to="/profile"
                  className="block py-2 text-base font-medium text-gray-600 hover:text-purple-600"
                  onClick={closeMenu}
                >
                  <div className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Profile
                  </div>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="block w-full text-left py-2 text-base font-medium text-gray-600 hover:text-purple-600"
                >
                  <div className="flex items-center">
                    <LogOut className="mr-2 h-5 w-5" />
                    Log out
                  </div>
                </button>
              </>
            ) : (
              <div className="pt-4 flex flex-col space-y-4">
                <Link to="/login" onClick={closeMenu}>
                  <Button variant="outline" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link to="/register" onClick={closeMenu}>
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}; 
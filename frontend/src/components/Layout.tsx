import React, { useEffect, useState } from "react";
import useTheme from "../hooks/useTheme";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Sun,
  Moon,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
} from "lucide-react";

import NextButton from "./NextButton";

interface LayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  backTo?: string | number;
  showNextButton?: boolean;
  nextTo?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  showBackButton = false,
  backTo,
  showNextButton = false,
  nextTo,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const location = useLocation();
  const navigate = useNavigate();
  const isSignupPage = location.pathname === "/signup";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/#programs", label: "Programs" },
    { href: "/#features", label: "Features" },
    { href: "/#testimonials", label: "Testimonials" },
  ];

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? "dark bg-slate-950" : "bg-white"}`}
    >
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || isSignupPage
            ? "bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform">
                M
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-xl text-slate-900 dark:text-white">
                  Muwatta
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400 block -mt-1">
                  Academy
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-6">
              {/* Inline page navigation (Back / Next) */}
              <div className="hidden md:flex items-center gap-2 mr-4">
                {showBackButton && (
                  <button
                    onClick={() => {
                      if (backTo !== undefined) navigate(backTo as any);
                      else navigate(-1);
                    }}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <ArrowLeft size={16} />
                    <span className="ml-2">Back</span>
                  </button>
                )}
                {showNextButton && (
                  <NextButton to={nextTo} label="Next" className="ml-1" />
                )}
              </div>
              {!isSignupPage &&
                navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  >
                    {link.label}
                  </a>
                ))}

              {isSignupPage && (
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  Create Account
                </span>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {!isSignupPage ? (
                <>
                  <Link
                    to="/login"
                    className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:-translate-y-0.5"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (backTo !== undefined) navigate(backTo as any);
                      else navigate(-1);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  >
                    <ArrowLeft size={20} />
                    Back
                  </button>
                  {showNextButton && (
                    <NextButton to={nextTo} className="ml-2" />
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-slate-600 dark:text-slate-300"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white dark:bg-slate-950 border-t dark:border-slate-800"
            >
              <div className="px-4 py-4 space-y-3">
                {!isSignupPage ? (
                  <>
                    {navLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="block py-2 text-slate-600 dark:text-slate-300 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.label}
                      </a>
                    ))}
                    <hr className="dark:border-slate-800" />
                    <Link
                      to="/login"
                      className="block py-2 text-slate-600 dark:text-slate-300 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="block py-2 px-4 bg-blue-600 text-white rounded-lg font-medium text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        if (backTo !== undefined) navigate(backTo as any);
                        else navigate(-1);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full py-2 text-slate-600 dark:text-slate-300 font-medium"
                    >
                      <ArrowLeft size={20} />
                      Back to Home
                    </button>
                    {showNextButton && (
                      <button
                        onClick={() => {
                          if (nextTo) navigate(nextTo);
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-2 w-full py-2 text-slate-600 dark:text-slate-300 font-medium"
                      >
                        Next
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Mobile back/next footer */}
      {(showBackButton || showNextButton) && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 p-3 bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.2)]">
          <div className="flex items-center justify-between gap-2">
            {showBackButton ? (
              <button
                onClick={() => {
                  if (backTo !== undefined) navigate(backTo as any);
                  else navigate(-1);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-color"
              >
                <ArrowLeft size={18} />
                Back
              </button>
            ) : (
              <div className="flex-1" />
            )}
            {showNextButton && (
              <NextButton to={nextTo} label="Next" className="flex-1" />
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={isSignupPage ? "pt-20 pb-24" : "pb-0"}>{children}</main>
    </div>
  );
};

export default Layout;

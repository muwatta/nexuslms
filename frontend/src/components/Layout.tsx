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
  hideHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  showBackButton = false,
  backTo,
  showNextButton = false,
  nextTo,
  hideHeader = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const location = useLocation();
  const navigate = useNavigate();
  const isSignupPage = location.pathname === "/signup";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const navLinks = [
    { href: "/#programs", label: "Programs" },
    { href: "/#features", label: "Features" },
    { href: "/#testimonials", label: "Testimonials" },
  ];

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "dark bg-slate-950" : "bg-white"
      }`}
    >
      {!hideHeader && (
        <>
          <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
              scrolled || isSignupPage
                ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-lg shadow-slate-200/50 dark:shadow-slate-800/20"
                : "bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm"
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 lg:h-20">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -3 }}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20"
                  >
                    M
                  </motion.div>
                  <div className="hidden sm:block">
                    <span className="font-bold text-xl text-slate-900 dark:text-white">
                      Muwatta
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block -mt-0.5">
                      Academy
                    </span>
                  </div>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-6">
                  <div className="hidden md:flex items-center gap-2 mr-4">
                    {showBackButton && (
                      <button
                        onClick={() => {
                          if (backTo !== undefined) navigate(backTo as any);
                          else navigate(-1);
                        }}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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
                        className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors relative after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-blue-600 after:transition-all after:duration-300"
                      >
                        {link.label}
                      </a>
                    ))}

                  {isSignupPage && (
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Create Account
                    </span>
                  )}

                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-blue-500"
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
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-full shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5 focus:ring-2 focus:ring-blue-500"
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

                {/* Mobile controls */}
                <div className="flex items-center gap-2 lg:hidden">
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Toggle theme"
                  >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
                    aria-label="Toggle menu"
                  >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.nav>

          {/* Mobile Menu Overlay & Panel */}
          <AnimatePresence>
            {isMenuOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                  onClick={() => setIsMenuOpen(false)}
                />

                {/* Slide-in Panel */}
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white dark:bg-slate-950 shadow-2xl lg:hidden overflow-y-auto p-6"
                >
                  <div className="flex justify-between items-center mb-8">
                    <span className="font-bold text-lg text-slate-900 dark:text-white">
                      Menu
                    </span>
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      aria-label="Close menu"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {!isSignupPage ? (
                      <>
                        {navLinks.map((link) => (
                          <a
                            key={link.href}
                            href={link.href}
                            className="block py-3 px-4 text-lg font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {link.label}
                          </a>
                        ))}
                        <hr className="border-slate-200 dark:border-slate-800" />
                        <Link
                          to="/login"
                          className="block py-3 px-4 text-lg font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Sign In
                        </Link>
                        <Link
                          to="/signup"
                          className="block py-3 px-4 text-center bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Get Started
                        </Link>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            if (backTo !== undefined) navigate(backTo as any);
                            else navigate(-1);
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center gap-3 w-full py-3 px-4 text-lg font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                          <ArrowLeft size={20} />
                          Back
                        </button>
                        {showNextButton && (
                          <button
                            onClick={() => {
                              if (nextTo) navigate(nextTo);
                              setIsMenuOpen(false);
                            }}
                            className="flex items-center gap-3 w-full py-3 px-4 text-lg font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                          >
                            Next
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Mobile back/next footer (only when header is shown or if we want it always) */}
      {(showBackButton || showNextButton) && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 p-4 bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.2)]">
          <div className="flex items-center justify-between gap-3">
            {showBackButton ? (
              <button
                onClick={() => {
                  if (backTo !== undefined) navigate(backTo as any);
                  else navigate(-1);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
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

      {/* Main content */}
      <main className={isSignupPage ? "pt-20 pb-24" : "pb-0"}>{children}</main>
    </div>
  );
};

export default Layout;

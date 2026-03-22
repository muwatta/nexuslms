import React from "react";
import { motion } from "framer-motion";

const About: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="min-h-screen p-6 bg-white dark:bg-gray-900"
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          About Muwatta Academy
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Muwatta Academy provides high-quality instruction across three
          departments: Western School, Arabic School, and Programming. We
          combine modern pedagogy with an AI tutor to support students at every
          level.
        </p>

        <h2 className="text-2xl font-semibold mb-2">Mission</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          To deliver excellence in education through blended learning and
          personalized support.
        </p>

        <h2 className="text-2xl font-semibold mb-2">Vision</h2>
        <p className="text-gray-700 dark:text-gray-300">
          An inclusive learning community that empowers learners for the digital
          age.
        </p>
      </div>
    </motion.div>
  );
};

export default About;

import React from "react";
import { motion } from "framer-motion";

const FloatingElements = ({ darkMode }) => {
  // Create an array of element configurations
  // We'll create 25 elements with randomized properties
  const elements = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    size: 20 + Math.random() * 60, // Random size between 20-80px
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    // Use your existing color scheme, but with transparency
    color: darkMode
      ? i % 3 === 0
        ? "rgba(139, 92, 246, 0.12)" // Purple for dark mode
        : i % 3 === 1
          ? "rgba(79, 70, 229, 0.12)" // Indigo for dark mode
          : "rgba(59, 130, 246, 0.12)" // Blue for dark mode
      : i % 3 === 0
        ? "rgba(167, 139, 250, 0.12)" // Purple for light mode
        : i % 3 === 1
          ? "rgba(99, 102, 241, 0.12)" // Indigo for light mode
          : "rgba(96, 165, 250, 0.12)", // Blue for light mode
    // Random animation parameters
    duration: 5 + Math.random() * 15, // Animation duration between 5-20s
    delay: Math.random() * 5, // Random delay for each element
    yMovement: 20 + Math.random() * 30, // How much to move in Y direction (20-50px)
    xMovement: Math.random() * 40 - 20, // How much to move in X direction (-20 to +20px)
    scale: 0.95 + Math.random() * 0.3, // Scale factor variation
    borderRadius: Math.random() > 0.5 ? "50%" : `${30 + Math.random() * 40}%`,
  }));

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {elements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute rounded-full"
          style={{
            width: `${element.size}px`,
            height: `${element.size}px`,
            left: element.left,
            top: element.top,
            backgroundColor: element.color,
            borderRadius: element.borderRadius,
            // Add a subtle border if in dark mode for more definition
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.03)" : "none",
          }}
          animate={{
            y: [0, -element.yMovement, 0],
            x: [0, element.xMovement, 0],
            scale: [1, element.scale, 1],
          }}
          transition={{
            duration: element.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: element.delay,
          }}
        />
      ))}
    </div>
  );
};

export default FloatingElements;

import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'motion/react';

const CustomCursor: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isOverDark, setIsOverDark] = useState(false);

  const springConfig = { damping: 25, stiffness: 200 };
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);

  useEffect(() => {
    const moveMouse = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      setMousePosition({ x: clientX, y: clientY });
      cursorX.set(clientX);
      cursorY.set(clientY);
      if (!isVisible) setIsVisible(true);

      // Check if current position is over a dark element
      const element = document.elementFromPoint(clientX, clientY);
      if (element) {
        const darkParent = element.closest('[data-theme="dark"]');
        setIsOverDark(!!darkParent);
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.closest('button') || 
        target.closest('a') ||
        target.classList.contains('cursor-pointer')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', moveMouse);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', moveMouse);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [cursorX, cursorY, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] hidden md:block">
      {/* Follower Ring */}
      <motion.div
        className={`fixed top-0 left-0 w-10 h-10 border rounded-full -ml-5 -mt-5 transition-colors duration-300 ${
          isOverDark ? 'border-white' : 'border-brand-primary'
        }`}
        style={{
          x: cursorX,
          y: cursorY,
          scale: isHovering ? 2 : 1,
          opacity: isHovering ? 0.3 : 0.6,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
      />
      {/* Outer Glow */}
      <motion.div
        className={`fixed top-0 left-0 w-24 h-24 rounded-full -ml-12 -mt-12 blur-2xl transition-colors duration-300 ${
          isOverDark ? 'bg-white/10' : 'bg-brand-primary/5'
        }`}
        style={{
          x: cursorX,
          y: cursorY,
          scale: isHovering ? 1.5 : 1,
        }}
      />
      {/* Core Dot */}
      <motion.div
        className={`fixed top-0 left-0 w-1.5 h-1.5 rounded-full -ml-[3px] -mt-[3px] transition-colors duration-300 ${
          isOverDark ? 'bg-white' : 'bg-brand-secondary'
        }`}
        style={{
          x: mousePosition.x,
          y: mousePosition.y,
        }}
      />
    </div>
  );
};

export default CustomCursor;

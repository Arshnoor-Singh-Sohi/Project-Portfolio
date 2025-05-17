"use client";
import React, { createContext, useContext, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

const MouseEnterContext = createContext({
    mouseX: null,
    mouseY: null,
});

export const CardContainer = ({ children, className, containerClassName }) => {
    const containerRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [mouseEnterCount, setMouseEnterCount] = useState(0);

    const handleMouseMove = (e) => {
        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - left) / width - 0.5;
        const y = (e.clientY - top) / height - 0.5;
        setMousePosition({ x, y });
    };

    const handleMouseEnter = () => {
        setMouseEnterCount(mouseEnterCount + 1);
    };

    const handleMouseLeave = () => {
        setMousePosition({ x: 0, y: 0 });
    };

    const context = {
        mouseX: useSpring(0, {
            stiffness: 100,
            damping: 30,
            mass: 0.5,
        }),
        mouseY: useSpring(0, {
            stiffness: 100,
            damping: 30,
            mass: 0.5,
        }),
    };

    context.mouseX.set(mousePosition.x);
    context.mouseY.set(mousePosition.y);

    return (
        <MouseEnterContext.Provider value={context}>
            <div
                onMouseEnter={handleMouseEnter}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                ref={containerRef}
                className={containerClassName}
            >
                <div className={className}>{children}</div>
            </div>
        </MouseEnterContext.Provider>
    );
};

export const CardBody = ({ children, className }) => {
    const { mouseX, mouseY } = useContext(MouseEnterContext);

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

    return (
        <motion.div
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export const CardItem = ({
    children,
    className,
    translateX = 0,
    translateY = 0,
    translateZ = 0,
    rotateX = 0,
    rotateY = 0,
    rotateZ = 0,
    as: Component = "div",
    ...rest
}) => {
    const { mouseX, mouseY } = useContext(MouseEnterContext);

    const x = useTransform(
        mouseX,
        [-0.5, 0.5],
        [translateX * -1, translateX]
    );
    const y = useTransform(
        mouseY,
        [-0.5, 0.5],
        [translateY, translateY * -1]
    );

    const style = {
        transform: `perspective(1000px) translateX(${x}px) translateY(${y}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
    };

    return (
        <Component className={className} style={style} {...rest}>
            {children}
        </Component>
    );
};
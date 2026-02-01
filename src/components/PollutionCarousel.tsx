import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wind, Droplets, Sprout, Car, Volume2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
    {
        id: 1,
        title: "Air Quality",
        description: "PM2.5, PM10, AQI monitoring with real-time health advisories",
        icon: Wind,
        color: "primary",
        bgColor: "from-background to-primary/10",
        shadowColor: "rgba(var(--primary), 0.3)",
        borderColor: "border-primary/20",
        hoverBorder: "hover:border-primary/60",
        iconColor: "text-primary",
    },
    {
        id: 2,
        title: "Water Quality",
        description: "Groundwater, drainage, and drinking water quality assessment",
        icon: Droplets,
        color: "info",
        bgColor: "from-background to-info/10",
        shadowColor: "rgba(56, 189, 248, 0.3)",
        borderColor: "border-info/20",
        hoverBorder: "hover:border-info/60",
        iconColor: "text-info",
    },
    {
        id: 3,
        title: "Soil Health",
        description: "Soil contamination levels, green cover, and fertility metrics",
        icon: Sprout,
        color: "amber-500",
        bgColor: "from-background to-amber-500/10",
        shadowColor: "rgba(245, 158, 11, 0.3)",
        borderColor: "border-amber-500/20",
        hoverBorder: "hover:border-amber-500/60",
        iconColor: "text-amber-600",
    },
    {
        id: 4,
        title: "Transport Impact",
        description: "Traffic congestion data and vehicular emission tracking",
        icon: Car,
        color: "slate-500",
        bgColor: "from-background to-slate-500/10",
        shadowColor: "rgba(71, 85, 105, 0.3)",
        borderColor: "border-slate-500/20",
        hoverBorder: "hover:border-slate-500/60",
        iconColor: "text-slate-600",
    },
    {
        id: 5,
        title: "Noise Levels",
        description: "Decibel monitoring across residential and commercial areas",
        icon: Volume2,
        color: "destructive",
        bgColor: "from-background to-destructive/10",
        shadowColor: "rgba(239, 68, 68, 0.3)",
        borderColor: "border-destructive/20",
        hoverBorder: "hover:border-destructive/60",
        iconColor: "text-destructive",
    },
];

export const PollutionCarousel = () => {
    const [index, setIndex] = useState(0);

    const next = () => setIndex((prev) => (prev + 1) % items.length);
    const prev = () => setIndex((prev) => (prev - 1 + items.length) % items.length);

    useEffect(() => {
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full max-w-5xl mx-auto h-[500px] flex items-center justify-center overflow-visible perspective-[1200px]">
            <div className="relative w-full h-full flex items-center justify-center preserve-3d">
                <AnimatePresence mode="popLayout">
                    {items.map((item, i) => {
                        // Calculate position relative to the active index
                        const offset = (i - index + items.length) % items.length;

                        // Map offset to positions: 0 is center, 1 is right, 2 is far right, 3 is far left, 4 is left
                        let position = offset;
                        if (position > items.length / 2) position -= items.length;

                        const isActive = position === 0;
                        const isVisible = Math.abs(position) <= 2;

                        if (!isVisible) return null;

                        return (
                            <motion.div
                                key={item.id}
                                initial={false}
                                animate={{
                                    x: position * 280,
                                    z: isActive ? 100 : Math.abs(position) * -150,
                                    rotateY: position * -35,
                                    rotateZ: position * -5, // The "lil twist in Z axis"
                                    scale: isActive ? 1 : 0.85,
                                    opacity: 1 - Math.abs(position) * 0.3,
                                    zIndex: 10 - Math.abs(position),
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 25,
                                }}
                                className="absolute w-[300px] md:w-[350px] cursor-pointer"
                                onClick={() => setIndex(i)}
                            >
                                <Card
                                    className={cn(
                                        "group relative overflow-hidden text-center transition-shadow duration-500",
                                        item.borderColor,
                                        item.hoverBorder,
                                        `bg-gradient-to-br ${item.bgColor}`,
                                        isActive && "shadow-[0_0_50px_-12px] shadow-primary/40"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl",
                                        isActive ? "bg-primary/5" : "bg-transparent"
                                    )} />
                                    <CardHeader className="relative z-10 pt-10 pb-10">
                                        <div className={cn(
                                            "mx-auto h-24 w-24 rounded-3xl bg-gradient-to-tr from-white/10 to-white/5 border flex items-center justify-center mb-6 transition-all duration-500 shadow-lg",
                                            item.borderColor,
                                            isActive ? "scale-110 rotate-3 bg-white/20" : "scale-100"
                                        )}>
                                            <item.icon className={cn("h-12 w-12 transition-transform duration-500", item.iconColor, isActive && "rotate-[-5deg]")} />
                                        </div>
                                        <CardTitle className="text-2xl font-bold tracking-tight mb-3">{item.title}</CardTitle>
                                        <CardDescription className="text-lg leading-relaxed px-4">
                                            {item.description}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="absolute -bottom-16 flex items-center gap-6 z-20">
                <button
                    onClick={prev}
                    className="p-3 rounded-full bg-background/80 border border-border hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-lg group"
                >
                    <ChevronLeft className="h-6 w-6 group-hover:scale-110 transition-transform" />
                </button>
                <div className="flex gap-2">
                    {items.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-2 rounded-full transition-all duration-500",
                                i === index ? "w-8 bg-primary" : "w-2 bg-primary/20"
                            )}
                        />
                    ))}
                </div>
                <button
                    onClick={next}
                    className="p-3 rounded-full bg-background/80 border border-border hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-lg group"
                >
                    <ChevronRight className="h-6 w-6 group-hover:scale-110 transition-transform" />
                </button>
            </div>
        </div>
    );
};

import { ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Type Definitions ---
export interface CarouselItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  gradient?: string;
  meta?: string;
}

interface ThreeDImageCarouselProps {
    /** The array of space data for the slider. */
    items: CarouselItem[];
    /** Selected item index controlled by parent. */
    activeIndex: number;
    /** Change callback controlled by parent. */
    onChangeActiveIndex: (index: number) => void;
    /** Number of visible items in the slider (3 or 5). Default is 5. */
    itemCount?: 3 | 5;
    /** Enables/Disables automatic sliding. Default is false. */
    autoplay?: boolean;
    /** Delay in seconds for autoplay. Default is 5. */
    delay?: number;
    /** Pauses autoplay when the mouse hovers over the slider. Default is true. */
    pauseOnHover?: boolean;
    /** Tailwind class for the main container (e.g., margins, padding). */
    className?: string;
}

// --- MINIMIZED CSS Styles (Core 3D positioning and responsiveness) ---
const EMBEDDED_CSS = `
/* --- Cascade Slider Styles --- */

.cascade-slider_container {
    position: relative;
    max-width: 850px;
    margin: 0 auto;
    z-index: 20; 
    user-select: none;
    -webkit-user-select: none; 
    touch-action: pan-y;
    height: 340px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cascade-slider_slides {
    position: relative;
    width: 100%;
    height: 300px; 
}

.cascade-slider_item {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%) scale(0.3); 
    transition: transform 0.8s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), filter 0.8s ease; 
    opacity: 0;
    z-index: 1; 
    filter: grayscale(0.8) blur(0.5px);
}

/* Slide Positioning Classes (Core 3D Logic - Cascade overlap) */
.cascade-slider_item.now {
    transform: translateY(-50%) translateX(-50%) scale(1);
    opacity: 1;
    z-index: 10; 
    filter: none;
}

.cascade-slider_item.next {
    transform: translateY(-50%) translateX(-110%) scale(0.75);
    opacity: 0.65;
    z-index: 5; 
}

.cascade-slider_item.prev {
    transform: translateY(-50%) translateX(10%) scale(0.75);
    opacity: 0.65;
    z-index: 5; 
}

.cascade-slider_item.next2 {
    transform: translateY(-50%) translateX(-140%) scale(0.5);
    opacity: 0.25;
    z-index: 2; 
}

.cascade-slider_item.prev2 {
    transform: translateY(-50%) translateX(40%) scale(0.5);
    opacity: 0.25;
    z-index: 2; 
}

/* Arrows - Structural CSS remains for positioning/size */
.cascade-slider_arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 50%;
    cursor: pointer;
    z-index: 25; 
    transform: translate(0, -50%);
    width: 44px; 
    height: 44px; 
    transition: all 0.3s ease;
}

/* Arrow Positioning Fix */
.cascade-slider_arrow-left { left: 15px; }
.cascade-slider_arrow-right { right: 15px; }
`;

// --- Helper Function: Get Slide Classes ---
const getSlideClasses = (index: number, activeIndex: number, total: number, visibleCount: 3 | 5): string => {
    const diff = index - activeIndex;
    if (diff === 0) return 'now';
    if (diff === 1 || diff === -total + 1) return 'next';
    if (visibleCount === 5 && (diff === 2 || diff === -total + 2)) return 'next2';
    if (diff === -1 || diff === total - 1) return 'prev';
    if (visibleCount === 5 && (diff === -2 || diff === total - 2)) return 'prev2';
    return '';
};

// --- ThreeDImageCarousel Component Logic ---
export const ThreeDImageCarousel: React.FC<ThreeDImageCarouselProps> = ({
    items,
    activeIndex,
    onChangeActiveIndex,
    itemCount = 5,
    autoplay = false,
    delay = 5,
    pauseOnHover = true,
    className = '',
}) => {
    const autoplayIntervalRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastScrollTimeRef = useRef(0);
    const scrollCooldown = 400; // ms
    const total = items.length;

    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const swipeThreshold = 40;

    const currentNormalized = ((activeIndex % total) + total) % total;

    const navigate = useCallback((direction: 'next' | 'prev') => {
        const nextIdx = direction === 'next' ? activeIndex + 1 : activeIndex - 1;
        onChangeActiveIndex(nextIdx);
    }, [activeIndex, onChangeActiveIndex]);

    const goToItem = (index: number) => {
        if (total === 0) return;
        const currentNormalized = ((activeIndex % total) + total) % total;
        let diff = index - currentNormalized;
        if (diff > total / 2) diff -= total;
        if (diff < -total / 2) diff += total;
        onChangeActiveIndex(activeIndex + diff);
    };

    const startAutoplay = useCallback(() => {
        if (autoplay && total > 1) {
            if (autoplayIntervalRef.current) {
                clearInterval(autoplayIntervalRef.current);
            }
            autoplayIntervalRef.current = window.setInterval(() => {
                navigate('next');
            }, delay * 1000);
        }
    }, [autoplay, delay, navigate, total]);

    const stopAutoplay = useCallback(() => {
        if (autoplayIntervalRef.current) {
            clearInterval(autoplayIntervalRef.current);
            autoplayIntervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        startAutoplay();
        return () => { stopAutoplay(); };
    }, [startAutoplay, stopAutoplay]);

    // Native Wheel Scroll Event Listener (non-passive to allow preventDefault)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleNativeWheel = (e: WheelEvent) => {
            // Prevent main page scrolling when hovering/wheeling inside the carousel bounds
            e.preventDefault();

            const now = Date.now();
            if (now - lastScrollTimeRef.current < scrollCooldown) return;

            if (e.deltaY > 0 || e.deltaX > 0) {
                navigate('next');
                lastScrollTimeRef.current = now;
            } else if (e.deltaY < 0 || e.deltaX < 0) {
                navigate('prev');
                lastScrollTimeRef.current = now;
            }
        };

        container.addEventListener('wheel', handleNativeWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleNativeWheel);
        };
    }, [navigate]);

    const handleMouseEnter = () => {
        if (autoplay && pauseOnHover) {
            stopAutoplay();
        }
    };

    const handleExit = (e: React.MouseEvent) => {
        if (autoplay && pauseOnHover) {
            startAutoplay();
        }
        if (isDragging) {
            handleEnd(e.clientX);
        }
    };

    const handleStart = (clientX: number) => {
        setIsDragging(true);
        setStartX(clientX);
        stopAutoplay();
    };

    const handleEnd = (clientX: number) => {
        if (!isDragging) return;

        const distance = clientX - startX;

        if (Math.abs(distance) > swipeThreshold) {
            if (distance < 0) {
                navigate('next');
            } else {
                navigate('prev');
            }
        }

        setIsDragging(false);
        setStartX(0);
    };

    const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
    const onMouseUp = (e: React.MouseEvent) => {
        handleEnd(e.clientX);
        startAutoplay();
    };

    const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
    const onTouchEnd = (e: React.TouchEvent) => {
        handleEnd(e.changedTouches[0].clientX);
        startAutoplay();
    };

    return (
        <>
            {/* 1. EMBEDDED CSS for 3D layout cascade */}
            <style dangerouslySetInnerHTML={{ __html: EMBEDDED_CSS }} />

            {/* 2. SLIDER HTML STRUCTURE */}
            <div
                ref={containerRef}
                className={`cascade-slider_container ${className} bg-transparent w-full`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleExit}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                <div className="cascade-slider_slides">
                    {items.map((item, index) => {
                        const slideClass = getSlideClasses(index, currentNormalized, total, itemCount);
                        if (!slideClass) return null;
                        const isActive = slideClass === 'now';

                        return (
                            <div
                                key={item.id}
                                className={`cascade-slider_item ${slideClass}`}
                                style={{
                                    width: isActive ? '450px' : '340px',
                                    height: '280px',
                                }}
                                onClick={() => {
                                    if (isActive) {
                                        // Trigger action if clicked active card
                                    } else {
                                        goToItem(index);
                                    }
                                }}
                            >
                                <div
                                    className={`w-full h-full bg-card rounded-3xl border overflow-hidden flex flex-col justify-end p-5 transition-all duration-300 relative ${
                                        isActive 
                                            ? 'border-brand/75 shadow-[0_12px_32px_rgba(0,0,0,0.12)] scale-102' 
                                            : 'border-border-main/20 shadow-[0_4px_12px_rgba(0,0,0,0.03)] opacity-80'
                                    }`}
                                >
                                    {/* Background Image / Gradient Fallback */}
                                    {item.imageUrl ? (
                                        <>
                                            <div 
                                                className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                                                style={{ backgroundImage: `url(${item.imageUrl})` }}
                                            />
                                            <div className="absolute inset-0 z-10 bg-gradient-to-t from-stone-900/90 via-stone-900/40 to-transparent" />
                                        </>
                                    ) : (
                                        <>
                                            <div className={`absolute inset-0 z-0 bg-gradient-to-br ${item.gradient || 'from-brand/10 to-brand/5'} opacity-85`} />
                                            <div className="absolute inset-0 z-10 bg-gradient-to-t from-stone-900/30 via-transparent to-transparent" />
                                        </>
                                    )}

                                    {/* Content Overlay */}
                                    <div className={`relative z-20 w-full ${item.imageUrl ? 'text-white' : 'text-primary'}`}>
                                        <h3 className="font-extrabold tracking-tight text-sm mb-0.5 leading-tight font-sans">
                                            {item.title}
                                        </h3>
                                        {item.subtitle && (
                                            <p className={`text-[10px] line-clamp-1 ${item.imageUrl ? 'text-stone-200' : 'text-secondary'}`}>
                                                {item.subtitle}
                                            </p>
                                        )}
                                        {item.meta && isActive && (
                                            <div className="mt-2.5">
                                                <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-brand/20 text-brand border border-brand/25 px-2.5 py-0.5 rounded-full">
                                                    {item.meta}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Navigation Arrows (Fully Tailwind-styled) */}
                {total > 1 && (
                    <>
                        <button
                            type="button"
                            className="cascade-slider_arrow cascade-slider_arrow-left rounded-full bg-card border border-border-main/30 text-primary p-2 hover:bg-canvas transition-colors shadow-sm"
                            onClick={(e) => { e.stopPropagation(); navigate('prev'); }}
                            data-action="prev"
                        >
                            <ArrowLeftCircle size={24} />
                        </button>
                        <button
                            type="button"
                            className="cascade-slider_arrow cascade-slider_arrow-right rounded-full bg-card border border-border-main/30 text-primary p-2 hover:bg-canvas transition-colors shadow-sm"
                            onClick={(e) => { e.stopPropagation(); navigate('next'); }}
                            data-action="next"
                        >
                            <ArrowRightCircle size={24} />
                        </button>
                    </>
                )}
            </div>
        </>
    );
};

export default ThreeDImageCarousel;
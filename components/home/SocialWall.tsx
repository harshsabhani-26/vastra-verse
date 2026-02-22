"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Instagram, ShoppingBag, Forward, Volume2, VolumeX, X, Copy, ChevronLeft, ChevronRight, Video } from "lucide-react";
import type { SocialImage, SocialVideo } from "@/app/admin/socials/actions";

interface SocialWallProps {
    images: SocialImage[];
    videos: SocialVideo[];
}

const getEmbedUrl = (url: string, isMute: boolean) => {
    const muteParam = isMute ? "1" : "0";
    if (url.includes("youtube.com/watch")) {
        const v = new URL(url).searchParams.get("v");
        return `https://www.youtube.com/embed/${v}?autoplay=1&mute=${muteParam}&controls=0&loop=1&playlist=${v}`;
    }
    if (url.includes("youtu.be/")) {
        const v = url.split("youtu.be/")[1]?.split("?")[0];
        return `https://www.youtube.com/embed/${v}?autoplay=1&mute=${muteParam}&controls=0&loop=1&playlist=${v}`;
    }
    if (url.includes("vimeo.com/")) {
        const v = url.split("vimeo.com/")[1]?.split("?")[0];
        return `https://player.vimeo.com/video/${v}?autoplay=1&muted=${muteParam}&background=1&loop=1`;
    }
    return url;
};

// ── Extracted VideoCard to handle Intersection Observer (Lazy & Auto-play) ──
function VideoCard({ vid, onExpand }: { vid: SocialVideo; onExpand: () => void }) {
    const [isMuted, setIsMuted] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const [hasBeenVisible, setHasBeenVisible] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const hasVideo = Boolean(vid.videoFile || vid.videoUrl);
    const isEmbed = vid.videoUrl && (vid.videoUrl.includes("youtube") || vid.videoUrl.includes("vimeo"));

    // Intersection Observer for visibility
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                const visible = entry.isIntersecting;
                setIsVisible(visible);
                if (visible && !hasBeenVisible) {
                    setHasBeenVisible(true);
                }
            },
            { threshold: 0.3 } // Play when at least 30% is visible
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [hasBeenVisible]);

    // Handle play/pause based on visibility
    useEffect(() => {
        if (!videoRef.current) return;

        if (isVisible) {
            videoRef.current.play().catch(() => { });
        } else {
            videoRef.current.pause();
        }
    }, [isVisible, isMuted]); // re-run if mute state changes so play() isn't blocked by browsers if they unmute

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsShareOpen(true);
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsMuted(prev => !prev);
    };

    const itemUrl = vid.redirectUrl || "";
    const shareUrl = typeof window !== 'undefined' ? (itemUrl || window.location.href) : '';

    return (
        <div className="group relative" ref={containerRef}>
            {/* Card (Video/Thumbnail container) */}
            <div
                className="relative w-full rounded-[20px] lg:rounded-[24px] overflow-hidden bg-stone-200 shadow-sm hover:shadow-lg transition-shadow duration-500 cursor-pointer"
                style={{ aspectRatio: "9 / 16" }}
                onClick={onExpand}
            >
                {/* 1. Render Video/Iframe ONLY if it has been visible (Lazy Loading) */}
                {hasBeenVisible && hasVideo ? (
                    <>
                        {isEmbed && vid.videoUrl ? (
                            // Note: iframes can't easily be paused via DOM without API, 
                            // but we can mount/unmount or just let autoplay handle it when it enters view (if possible).
                            // A simple approach is: only render iframe if currently visible.
                            isVisible && (
                                <iframe
                                    src={getEmbedUrl(vid.videoUrl, isMuted)}
                                    className="absolute inset-0 w-full h-full"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                />
                            )
                        ) : (
                            <video
                                ref={videoRef}
                                src={vid.videoFile || vid.videoUrl || ""}
                                className="absolute inset-0 w-full h-full object-cover"
                                loop
                                muted={isMuted}
                                playsInline
                                preload="none"
                            />
                        )}
                        <div className="absolute inset-0 z-10 bg-transparent pointer-events-none" />
                    </>
                ) : null}

                {/* 2. Thumbnail (Always shows before loading or below transparent videos) */}
                {(!hasBeenVisible || (!hasVideo)) && (
                    vid.thumbnail ? (
                        <Image
                            src={vid.thumbnail}
                            alt={vid.overlayText || "Social video thumbnail"}
                            fill
                            sizes="(max-width: 640px) 50vw, 14vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            loading="lazy"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-stone-800 flex items-center justify-center">
                            <Video className="w-12 h-12 text-stone-500" />
                        </div>
                    )
                )}

                {/* ── Always Visible Overlays ── */}

                {/* Bottom dark fade so overlay text is readable */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none z-10" />

                {/* Top-right: Share + Sound (Large + transparent background) */}
                <div className="absolute top-4 right-3.5 flex flex-col items-center gap-4 z-20">
                    <button
                        className="flex items-center justify-center transition-transform hover:scale-110 drop-shadow-lg"
                        onClick={handleShare}
                        aria-label="Share"
                    >
                        <Forward className="w-8 h-8 text-white drop-shadow-md" strokeWidth={1.5} />
                    </button>
                    {hasVideo && (
                        <button
                            className="flex items-center justify-center transition-transform hover:scale-110 drop-shadow-lg"
                            onClick={toggleMute}
                            aria-label="Toggle Sound"
                        >
                            {isMuted ? (
                                <VolumeX className="w-8 h-8 text-white drop-shadow-md" strokeWidth={1.5} />
                            ) : (
                                <Volume2 className="w-8 h-8 text-white drop-shadow-md" strokeWidth={1.5} />
                            )}
                        </button>
                    )}
                </div>

                {/* Overlay text (Perfectly positioned at bottom-left inside video) */}
                {vid.overlayText && (
                    <div className="absolute bottom-5 left-4 right-4 pointer-events-none z-20">
                        <p className="text-white text-[13px] md:text-[14px] font-semibold tracking-wide leading-snug drop-shadow-md line-clamp-3">
                            {vid.overlayText}
                        </p>
                    </div>
                )}

                {/* Custom Share Modal Overlay */}
                {isShareOpen && (
                    <div
                        className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-6 backdrop-blur-[2px]"
                        onClick={(e) => { e.stopPropagation(); setIsShareOpen(false); }}
                    >
                        <div
                            className="relative w-full max-w-[200px] bg-[#f8f9fa] rounded-[12px] py-6 px-4 flex flex-col items-center shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsShareOpen(false)}
                                className="absolute -top-2.5 -right-2.5 w-[26px] h-[26px] bg-black text-white rounded-full flex items-center justify-center border-2 border-[#f8f9fa] shadow-md hover:scale-110 transition-transform"
                                aria-label="Close Share"
                            >
                                <X className="w-3.5 h-3.5" strokeWidth={3.5} />
                            </button>

                            <h4 className="text-[#0B3D51] font-semibold text-[15px] mb-5">Share via</h4>

                            <div className="flex gap-4">
                                <a
                                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-[42px] h-[42px] rounded-[6px] bg-[#00A859] flex items-center justify-center hover:scale-105 transition-transform shadow-sm"
                                    aria-label="Share on WhatsApp"
                                >
                                    <svg viewBox="0 0 24 24" fill="white" className="w-[22px] h-[22px]">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                                    </svg>
                                </a>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(shareUrl);
                                        alert("Link copied!");
                                        setIsShareOpen(false);
                                    }}
                                    className="w-[42px] h-[42px] rounded-[6px] bg-black flex items-center justify-center hover:scale-105 transition-transform shadow-sm"
                                    aria-label="Copy Link"
                                >
                                    <Copy className="w-[20px] h-[20px] text-white" strokeWidth={2} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom: Black "Shop Now" (OUTSIDE the video, cleanly spaced) */}
            {itemUrl && (
                <Link
                    href={itemUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 bg-black text-white py-3 rounded-md text-[14px] md:text-[15px] font-semibold tracking-wide transition-colors hover:bg-stone-800 shadow-md w-full"
                >
                    <ShoppingBag className="w-[18px] h-[18px]" />
                    Shop Now
                </Link>
            )}
        </div>
    );
}


export function SocialWall({ images, videos }: SocialWallProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    if ((!images || images.length === 0) && (!videos || videos.length === 0)) {
        return null;
    }

    const displayImages = images.slice(0, 4);
    const displayVideos = videos.slice(0, 7);

    // Close fullscreen on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setExpandedIndex(null);
            if (e.key === "ArrowLeft") setExpandedIndex(prev => (prev !== null && prev > 0 ? prev - 1 : displayVideos.length - 1));
            if (e.key === "ArrowRight") setExpandedIndex(prev => (prev !== null && prev < displayVideos.length - 1 ? prev + 1 : 0));
        };
        if (expandedIndex !== null) {
            document.body.style.overflow = "hidden"; // Prevent background scroll
            window.addEventListener("keydown", handleKeyDown);
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [expandedIndex, displayVideos.length]);

    return (
        <section className="w-full py-16 md:py-24 bg-[#FAFAF9]" aria-label="Social Wall">

            {/* ── Section Header + Top Images ── */}
            <div className="w-full max-w-[2000px] mx-auto px-4 md:px-8">

                {/* Header */}
                <div className="flex flex-col items-center text-center mb-12 md:mb-16">
                    <div className="flex items-center gap-3 mb-4 opacity-60">
                        <span className="block h-px w-16 bg-[#7C5C3E]" />
                        <Instagram size={18} className="text-[#7C5C3E]" />
                        <span className="block h-px w-16 bg-[#7C5C3E]" />
                    </div>
                    <h2
                        className="font-serif text-[26px] sm:text-[36px] md:text-[44px] text-[#1A1510] tracking-[0.12em] uppercase font-normal leading-tight"
                        style={{ fontFamily: "var(--font-cormorant-infant, serif)" }}
                    >
                        Trending on Our Social Wall
                    </h2>
                    <p className="text-[#7C5C3E] text-sm md:text-base tracking-[0.08em] uppercase mt-3 font-light">
                        Discover · Explore · Shop
                    </p>
                </div>

                {/* ── ROW 1 — 4 Image Cards ──── */}
                {displayImages.length > 0 && (
                    <div className="w-full max-w-[1200px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 lg:gap-10 mb-16 md:mb-24 px-4 md:px-8">
                        {displayImages.map((img) => {
                            const itemUrl = img.redirectUrl || "";
                            const Wrapper = itemUrl ? Link : "div";
                            const wrapperProps = itemUrl
                                ? { href: itemUrl, target: "_blank" as const, rel: "noreferrer" }
                                : {};

                            return (
                                <Wrapper
                                    key={img.id}
                                    {...(wrapperProps as any)}
                                    className="group relative block overflow-hidden bg-stone-200 cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-500"
                                    style={{ aspectRatio: "1 / 1" }}
                                >
                                    <Image
                                        src={img.imageFile}
                                        alt={img.title || "Social image"}
                                        fill
                                        sizes="(max-width: 640px) 50vw, 25vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300 pointer-events-none" />
                                    {/* Instagram badge — always visible */}
                                    <div className="absolute top-4 right-4 w-11 h-11 md:w-12 md:h-12 rounded-full bg-black flex items-center justify-center shadow-lg">
                                        <Instagram className="w-[20px] h-[20px] md:w-[22px] md:h-[22px] text-white" />
                                    </div>
                                </Wrapper>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── ROW 2 — 7 Video Cards ──── */}
            {displayVideos.length > 0 && (
                <div className="w-full max-w-[1850px] mx-auto px-4 md:px-12 lg:px-20">
                    <div
                        className="grid gap-4 md:gap-5 lg:gap-6"
                        style={{
                            gridTemplateColumns: `repeat(${Math.min(displayVideos.length, 7)}, 1fr)`,
                        }}
                    >
                        {displayVideos.map((vid, index) => (
                            <VideoCard key={vid.id} vid={vid} onExpand={() => setExpandedIndex(index)} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Fullscreen Carousel Modal ──── */}
            {expandedIndex !== null && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center overflow-hidden backdrop-blur-md cursor-auto"
                    onClick={(e) => {
                        // Close if clicked outside video
                        if (e.target === e.currentTarget) setExpandedIndex(null);
                    }}
                >
                    {/* Top Close Button */}
                    <button
                        onClick={() => setExpandedIndex(null)}
                        className="absolute top-4 right-4 md:top-6 md:right-8 z-[110] p-2 text-white/50 hover:text-white transition-colors hover:scale-110"
                        aria-label="Close fullscreen"
                    >
                        <X className="w-8 h-8 md:w-10 md:h-10" />
                    </button>

                    {/* Navigation Arrows */}
                    {expandedIndex > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpandedIndex((prev) => prev! - 1);
                            }}
                            className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-[110] p-2 md:p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors drop-shadow-xl backdrop-blur-md"
                            aria-label="Previous video"
                        >
                            <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" strokeWidth={2} />
                        </button>
                    )}

                    {expandedIndex < displayVideos.length - 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpandedIndex((prev) => prev! + 1);
                            }}
                            className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-[110] p-2 md:p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors drop-shadow-xl backdrop-blur-md"
                            aria-label="Next video"
                        >
                            <ChevronRight className="w-8 h-8 md:w-10 md:h-10" strokeWidth={2} />
                        </button>
                    )}

                    {/* Carousel Track */}
                    <div
                        className="relative w-full h-full flex items-center justify-center"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setExpandedIndex(null);
                        }}
                    >
                        {displayVideos.map((vid, i) => {
                            const diff = i - expandedIndex;
                            const absDiff = Math.abs(diff);

                            // Perf optimization: Don't render cards that are too far away
                            if (absDiff > 2) return null;

                            const isCenter = diff === 0;

                            // Calculate transforms
                            // Horizontal offset: spacing elements out by 130% of their width
                            const translateX = diff * 125;
                            const scale = 1 - (absDiff * 0.15); // Center: 1, Side: 0.85
                            const opacity = isCenter ? 1 : (absDiff === 1 ? 0.35 : 0);
                            const zIndex = 100 - absDiff;

                            const isEmbedUrl = vid.videoUrl && (vid.videoUrl.includes("youtube") || vid.videoUrl.includes("vimeo"));

                            return (
                                <div
                                    key={vid.id}
                                    className="absolute left-1/2 top-1/2 rounded-[20px] overflow-hidden shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isCenter) {
                                            setExpandedIndex(i); // Click side videos to go to them
                                        }
                                    }}
                                    style={{
                                        width: "calc(88vh * 9 / 16)",
                                        maxWidth: "460px",
                                        height: "88vh",
                                        transform: `translate(calc(-50% + ${translateX}%), -50%) scale(${scale})`,
                                        zIndex,
                                        opacity,
                                        pointerEvents: isCenter || absDiff === 1 ? "auto" : "none",
                                        cursor: isCenter ? "auto" : "pointer",
                                    }}
                                >
                                    {isCenter ? (
                                        // Render fully active video player in center
                                        Boolean(vid.videoFile || vid.videoUrl) ? (
                                            isEmbedUrl && vid.videoUrl ? (
                                                <iframe
                                                    src={getEmbedUrl(vid.videoUrl, false)} // Auto-play unmuted in fullscreen
                                                    className="w-full h-full object-contain bg-black"
                                                    allow="autoplay; fullscreen; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            ) : (
                                                <video
                                                    src={vid.videoFile || vid.videoUrl || ""}
                                                    className="w-full h-full object-contain bg-black"
                                                    autoPlay
                                                    controls
                                                    loop
                                                    playsInline
                                                    poster={vid.thumbnail}
                                                />
                                            )
                                        ) : (
                                            <div className="w-full h-full relative bg-black flex items-center justify-center">
                                                {vid.thumbnail ? (
                                                    <Image src={vid.thumbnail} alt={vid.overlayText || "Social Image"} fill className="object-contain" />
                                                ) : <Video className="w-16 h-16 text-stone-500" />}
                                            </div>
                                        )
                                    ) : (
                                        // Render only dim thumbnail for adjacent cards (saves massive resources)
                                        <div className="w-full h-full relative bg-black flex items-center justify-center">
                                            {vid.thumbnail ? (
                                                <Image
                                                    src={vid.thumbnail}
                                                    alt="Social video thumbnail"
                                                    fill
                                                    className="object-cover transition-opacity duration-700 opacity-80"
                                                    loading="lazy"
                                                    sizes="(max-width: 640px) 50vw, 25vw"
                                                />
                                            ) : <Video className="w-16 h-16 text-stone-500" />}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}

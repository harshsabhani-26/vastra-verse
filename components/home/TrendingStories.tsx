"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import type { StoryWithProduct } from "@/app/admin/stories/actions";

interface TrendingStoriesProps {
    stories: StoryWithProduct[];
}

export function TrendingStories({ stories }: TrendingStoriesProps) {
    const [playingStoryId, setPlayingStoryId] = useState<string | null>(null);
    const router = useRouter();

    // Only render if we have active stories
    if (!stories || stories.length === 0) return null;

    // The stories passed here are already limited to 6 from the server
    const displayStories = stories.slice(0, 6);

    const handleMediaClick = (story: StoryWithProduct) => {
        if (playingStoryId === story.id) {
            setPlayingStoryId(null);
        } else if (story.videoFile || story.videoUrl) {
            setPlayingStoryId(story.id);
        } else if (story.product) {
            router.push(`/shop/${story.product.id}`);
        }
    };

    const getStoryVideoUrl = (story: StoryWithProduct) => {
        let url = story.videoUrl || "";
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            let modifiedUrl = url;
            if (!modifiedUrl.includes("autoplay=1")) {
                modifiedUrl += modifiedUrl.includes("?") ? "&autoplay=1" : "?autoplay=1";
            }
            if (!modifiedUrl.includes("controls=0")) {
                modifiedUrl += "&controls=0&mute=1";
            }
            return modifiedUrl;
        }
        if (url.includes("vimeo.com")) {
            let modifiedUrl = url;
            if (!modifiedUrl.includes("autoplay=1")) {
                modifiedUrl += modifiedUrl.includes("?") ? "&autoplay=1" : "?autoplay=1";
            }
            if (!modifiedUrl.includes("background=1")) {
                modifiedUrl += "&background=1";
            }
            return modifiedUrl;
        }
        return url;
    };

    return (
        <section className="w-full py-[40px] md:py-[60px] bg-white">
            <div className="container mx-auto px-4 md:px-[24px]">
                {/* Section Header */}
                <div className="flex flex-col items-center text-center mb-[32px] md:mb-[48px]">
                    <h2 className="w-full font-serif text-[26px] md:text-[36px] text-[#172026] uppercase leading-[1.3] text-center tracking-[0.05em] font-normal">
                        TRENDING STORIES
                    </h2>
                </div>

                {/* Grid / Horizontal Scroll Layout */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[16px] md:gap-[20px] lg:gap-[24px]">
                    {displayStories.map((story) => {
                        // Product URL fallback (if no linked product, no link or default to shop)
                        const href = story.product ? `/shop/${story.product.id}` : "#";
                        const isPlaying = playingStoryId === story.id;
                        const hasVideo = Boolean(story.videoFile || story.videoUrl);

                        return (
                            <div key={story.id} className="group flex flex-col">
                                {/* Media Card (Portrait Rectangle ~ 9:16) */}
                                <div
                                    className="relative w-full overflow-hidden bg-[#f4f2ef] block rounded-t-sm shadow-sm transition-shadow hover:shadow-md cursor-pointer"
                                    style={{ aspectRatio: '9 / 16' }}
                                    onClick={() => handleMediaClick(story)}
                                >
                                    {isPlaying && hasVideo ? (
                                        <>
                                            {story.videoUrl && (story.videoUrl.includes("youtube") || story.videoUrl.includes("vimeo")) ? (
                                                <iframe
                                                    src={getStoryVideoUrl(story)}
                                                    className="w-full h-full absolute inset-0 object-cover pointer-events-none"
                                                    allow="autoplay; fullscreen; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            ) : (
                                                <video
                                                    src={story.videoFile || story.videoUrl || ""}
                                                    className="w-full h-full object-cover absolute inset-0 z-10 pointer-events-none"
                                                    autoPlay
                                                    playsInline
                                                    loop
                                                    muted
                                                    poster={story.thumbnailImage}
                                                />
                                            )}
                                            {/* Invisible overlay so click events hit the parent div instead of the video/iframe */}
                                            <div className="absolute inset-0 z-20 bg-transparent" />
                                        </>
                                    ) : (
                                        <>
                                            <Image
                                                src={story.thumbnailImage}
                                                alt={story.title}
                                                fill
                                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                                loading="lazy"
                                            />

                                            {/* Dark overlay on hover */}
                                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                            {/* Play Icon Centered */}
                                            {hasVideo && (
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="w-[48px] h-[48px] md:w-[56px] md:h-[56px] rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg">
                                                        <Play className="w-5 h-5 md:w-6 md:h-6 text-white ml-[3px]" fill="white" />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Text Info Below */}
                                <Link
                                    href={href}
                                    className="flex flex-col items-center justify-center text-center no-underline cursor-pointer group/link bg-[#F4F5F5] w-full px-[12px] py-4 h-[80px] md:h-[95px] rounded-b-sm shadow-sm"
                                >
                                    <h3 className="font-sans text-[13px] md:text-[14px] text-[#172026] text-opacity-90 leading-[1.4] mb-[4px] line-clamp-2 transition-colors group-hover/link:text-primary">
                                        {story.title}
                                    </h3>
                                    {story.price && (
                                        <span className="font-sans text-[14px] md:text-[15px] font-semibold text-[#172026]">
                                            ₹{story.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

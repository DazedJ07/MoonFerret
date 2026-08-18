import { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles, Gift, Camera, Calendar, ArrowRight } from 'lucide-react';
import AccordionGallery from '@/components/ui/AccordionGallery';

export default function SurpriseView() {
  const [isOpen, setIsOpen] = useState(false);

  const galleryItems = [
    { image: 'https://picsum.photos/id/1015/900/1200', label: 'Golden Canyon Trails', link: '#' },
    { image: 'https://picsum.photos/id/1018/900/1200', label: 'Infinite Horizon Ridgeline', link: '#' },
    { image: 'https://picsum.photos/id/1039/900/1200', label: 'Whispering Waterfalls', link: '#' },
    { image: 'https://picsum.photos/id/1043/900/1200', label: 'Serene Harbour Sunset', link: '#' },
    { image: 'https://picsum.photos/id/1044/900/1200', label: 'Dreamy Skyline Evenings', link: '#' }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Surprise Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-400 via-rose-400 to-indigo-400 p-8 text-white shadow-md">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-yellow-200 animate-spin-slow" />
              Special Celebration
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight font-sans">
              Happy Monthsary, My Love! 💖
            </h2>
            <p className="text-white/90 text-sm max-w-md font-medium">
              Every single day with you is a gift. Here is a little corner of our workspace dedicated to celebrating us.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-sm shadow-inner">
              <Gift className="h-7 w-7 text-white animate-bounce-slow" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-1 gap-8">
        {/* Monthsary Letter Card with Unfolding Animation */}
        <div className="bg-card border border-border-main/20 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-border-main/10">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-500" />
              Our Monthsary Letter
            </h3>
            <span className="text-[10px] bg-rose-50 text-rose-500 border border-rose-200 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
              For You 💌
            </span>
          </div>

          {!isOpen ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
              <motion.div 
                className="w-20 h-20 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-inner cursor-pointer"
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsOpen(true)}
              >
                <Heart className="w-10 h-10 fill-current animate-pulse-slow" />
              </motion.div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-primary">You have received a special letter!</p>
                <p className="text-xs text-secondary">Click the heart to open and read.</p>
              </div>
              <button
                onClick={() => setIsOpen(true)}
                className="mt-2 h-9 px-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                Open Letter <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 font-sans relative"
            >
              <div className="absolute right-0 top-0 text-rose-100 -z-0 select-none">
                <Heart className="w-32 h-32 fill-current opacity-20" />
              </div>

              <div className="space-y-4 text-secondary text-sm leading-relaxed max-w-2xl relative z-10">
                <p className="font-extrabold text-primary text-base">Dearest Jian,</p>
                <p>
                  Happy monthsary! Writing this to you feels incredibly special. As we continue building our dreams side by side, I wanted to take a moment to step away from the code, the spaces, and the tracking, just to tell you how much you mean to me.
                </p>
                <p>
                  Every month that passes is another chapter in our beautiful story. Thank you for your warmth, your constant support, your laughter, and the way you make even the simplest days feel like a grand adventure. With you, I've found a partner, a best friend, and a home.
                </p>
                <p>
                  I'm so incredibly proud of everything we are creating together—both in this app and, more importantly, in our lives. Here's to many more months of growing, dreaming, loving, and sharing this journey.
                </p>
                <p className="pt-2 font-bold text-primary">Always and forever Yours, 💖</p>
              </div>

              <div className="flex justify-end border-t border-border-main/10 pt-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-8 px-4 bg-canvas border border-border-main/20 hover:bg-canvas/80 text-secondary rounded-full text-[10px] font-bold transition-all cursor-pointer"
                >
                  Close Letter
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Photo Gallery Section */}
        <div className="bg-card border border-border-main/20 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border-main/10">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-500" />
              Moments Gallery
            </h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-500 border border-indigo-200 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
              Accordion View 📸
            </span>
          </div>

          <div className="w-full overflow-hidden rounded-2xl border border-border-main/10 bg-canvas/30 p-2">
            <AccordionGallery
              items={galleryItems}
              defaultIndex={2}
              expandRatio={0.52}
              trigger="hover"
              accentColor="#f43f5e"
              overlayColor="#0f091c"
              textColor="#ffffff"
              grayscale={false}
              showLabels={true}
              duration={0.6}
              ease="power3.out"
              parallax={0.5}
              tilt={8}
              stagger={0.06}
              height={400}
              gap={10}
              radius={16}
              orientation="horizontal"
            />
          </div>
          
          <div className="text-center">
            <p className="text-[10px] text-secondary font-medium tracking-wide">
              Hover over each panel to expand the memory image and reveal its caption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

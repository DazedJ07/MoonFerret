import { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles, Gift, Camera, Calendar, Music, ArrowRight } from 'lucide-react';
import AccordionGallery from '@/components/ui/AccordionGallery';

// Import assets from src/Motmot using Vite URL loader
import blehImage from '@/Motmot/Bleh.jpg';
import cornImage from '@/Motmot/Corn.jpg';
import hairstylistVideo from '@/Motmot/Hairstylist.mp4';
import silidImage from '@/Motmot/Silid.jpg';
import compImage from '@/Motmot/comp.jpg';

export default function SurpriseView() {
  const [isOpen, setIsOpen] = useState(false);

  const galleryItems = [
    { image: compImage, label: 'Compiling Memories', link: '#' },
    { image: blehImage, label: 'Playful Moments 😜', link: '#' },
    { image: hairstylistVideo, label: 'Hairstylist Session 💇‍♂️', link: '#' },
    { image: cornImage, label: 'Corn Fields & Laughter 🌽', link: '#' },
    { image: silidImage, label: 'Our Quiet Space 🏠', link: '#' }
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

      <div className="space-y-8">
        {/* Monthsary Letter Card with Unfolding Animation */}
        <div className="bg-card border border-border-main/20 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-border-main/10">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-500" />
              <span className="italic font-serif text-rose-600 font-bold">To my Dearest Khayzilene</span>
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
                <p className="font-extrabold text-primary text-base">
                  My Dearest Khayzilene, Boss, Bebi, Spongebob, My Squishy,
                </p>
                
                <p>
                  Happy Ninth Monthsary Bebi! I miss youuuu so muchhhh naaa and I can't wait to see youuu soon, kay bilis ng orasss BEBIII parang kaka eight langg natinnn kahapon ngayon we are 9 months TOGETHER and I pray that we will be FOREVERRR AND DEVERRR!!!
                </p>
                
                <p>
                  We are 3 months away in reaching a year of being together, we've already made plenty of memories this year. Looking back at our days I can see it has passed by so fast, counting our time together it has been more than a year, but counting the days and months since you have answered me it has been 9 months, I look forward to spending the rest of our lives together.
                </p>
                
                <p>
                  We may have been through a lot of ups and downs, arguements, but at the end of the day we always come front to each other and talk through it, I pray that we get stronger together, I pray that we can fight obstacles in each way the comes across.
                </p>
                
                <p>
                  I just want you to know that every single day I am happy and grateful to hear your voice, your good mornings, your I love yous, your "OKII BEBIII", "EATWELL BEBIII", "INGATTT BEBIII", and every time hearing you say "HIIII BABYYY", makes my heart full, its something I always look forward to at the end of the day, I am always excited to go home immediately. Yung pagod ko sa school and training nawawala whenever I hear your voice.
                </p>
                
                <p>
                  I wanna say something that I don't mention much in my previous codes, letters, or messages, I wish you good health and happiness, I always pray for you my baby, I pray that you fight off the struggles and stresses you face alone, and just a reminder you will never be alone even if I'm not physically there with you, I submit to you and I am always at your corner.
                </p>
                
                <p className="font-black text-red-600 text-base py-1">
                  I LOVEEEE YOUUU VERYYY VERYY VERYY MUCHH MY BABYYY ALWAYS IN ALWAYS AND FOREVER!!
                </p>
                
                <p>
                  See youuuu sooon my bebiiii eatwell tayo sa davilan this friday &lt;3.
                </p>
                
                <p className="pt-2 font-bold text-primary">Always and forever yours,</p>
                <p className="font-black text-rose-500">Bebi Jc</p>
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
              July and August
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
              Hover over each panel to expand the memory image or video.
            </p>
          </div>
        </div>

        {/* Song of the Month Section */}
        <div className="bg-card border border-border-main/20 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border-main/10">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Music className="w-4 h-4 text-sky-500" />
              Song of the month
            </h3>
            <span className="text-[10px] bg-sky-50 text-sky-500 border border-sky-200 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
              Music Box 🎵
            </span>
          </div>

          <div className="flex flex-col xl:flex-row items-center gap-6">
            {/* YouTube Embed Container */}
            <div className="w-full xl:w-3/5 aspect-video overflow-hidden rounded-2xl border border-border-main/20 shadow-md">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/RvPqpSk4X6M?si=FvHvXZNSm-HdfITs" 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen
              />
            </div>

            {/* Description Text Panel */}
            <div className="w-full xl:w-2/5 space-y-3.5 bg-canvas/30 border border-border-main/20 p-5 rounded-2xl flex flex-col justify-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                A Note for You
              </h4>
              <p className="text-secondary text-sm leading-relaxed font-sans italic">
                "HIIII BEBIII I want you to hear this song. I chose this as the song of the month! I love oasis because their songs remind me of you and us HEHEHEH"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

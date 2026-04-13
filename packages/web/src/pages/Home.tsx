import { useMemo, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Sparkles,
  ArrowRight,
  Wrench,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import UnitCard from "@/components/UnitCard";
import { useDealerPath } from "@/DealerContext";
import { getBrandLogoUrl } from "@/data/brand-logos";
import { getDealerVibe } from "@/lib/dealer-vibe";
import { fetchTestimonials } from "@/lib/api";
import type { DealerInfo, Unit, UnitType, Testimonial } from "@/types";

interface HomeProps {
  dealer: DealerInfo;
  units: Unit[];
}

const TYPE_LABELS: Record<UnitType, string> = {
  boat: "Boats",
  motorcycle: "Motorcycles",
  atv: "ATVs",
  utv: "Side x Sides",
  snowmobile: "Snowmobiles",
  pwc: "Personal Watercraft",
  trailer: "Trailers",
  other: "Other",
};

const TYPE_FLICKR_KEYWORDS: Record<UnitType, string> = {
  boat: "motorboat",
  motorcycle: "motorcycle",
  atv: "atv,quad",
  utv: "utv,side+by+side",
  snowmobile: "snowmobile",
  pwc: "jet+ski",
  trailer: "boat+trailer",
  other: "vehicle",
};

const vibeContent = {
  marine: {
    heroSub: (name: string, city?: string) =>
      `${name} is ${city ? `${city}'s` : "your"} premier marine dealer. Explore our curated selection of boats, personal watercraft, and accessories.`,
    ctaTitle: "Ready to Find Your Perfect Boat?",
  },
  powersports: {
    heroSub: (name: string, city?: string) =>
      `${name} is ${city ? `${city}'s` : "your"} destination for powersports. Browse our lineup of UTVs, ATVs, motorcycles, and more.`,
    ctaTitle: "Ready to Find Your Next Ride?",
  },
  mixed: {
    heroSub: (name: string, city?: string) =>
      `${name} is ${city ? `${city}'s` : "your"} one-stop shop for marine and powersports.`,
    ctaTitle: "Ready to Find Your Next Machine?",
  },
};

export default function Home({ dealer, units }: HomeProps) {
  const dp = useDealerPath();
  const featuredUnits = units.slice(0, 4);
  const vibe = useMemo(() => getDealerVibe(units), [units]);
  const content = vibeContent[vibe];

  // Hero background: use dealer heroImage, or first unit photo
  const heroImage = dealer.heroImage || 'hero.jpg';

  // Categories: group by type, get count + image for each
  const categories = useMemo(() => {
    const map = new Map<UnitType, { count: number; image: string }>();
    for (const u of units) {
      if (!map.has(u.type)) {
        // Use dealer category image, or first unit photo of this type, or loremflickr
        const dealerImg = dealer.categoryImages?.[u.type];
        const unitImg = u.photos[0];
        const fallback = `https://loremflickr.com/600/400/${TYPE_FLICKR_KEYWORDS[u.type]}?lock=${u.type.length * 7}`;
        map.set(u.type, {
          count: 0,
          image: dealerImg || unitImg || fallback,
        });
      }
      map.get(u.type)!.count++;
    }
    return [...map.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([type, data]) => ({ type, label: TYPE_LABELS[type], ...data }));
  }, [units, dealer.categoryImages]);

  // Top makes
  const topMakes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of units) counts.set(u.make, (counts.get(u.make) || 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([make]) => make);
  }, [units]);

  // All unique makes (deduplicated by normalized key)
  const allMakes = useMemo(() => {
    const seen = new Set<string>();
    const makes: string[] = [];
    for (const u of units) {
      const key = u.make.toLowerCase().replace(/®/g, "");
      if (!seen.has(key)) {
        seen.add(key);
        makes.push(u.make);
      }
    }
    return makes;
  }, [units]);

  // Testimonials
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  useEffect(() => {
    fetchTestimonials(dealer.slug).then(setTestimonials).catch(() => {});
  }, [dealer.slug]);

  // Hero carousel
  const slides = dealer.heroSlides;
  const slideCount = slides?.length ?? 0;
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const goToSlide = useCallback(
    (index: number) => setActiveSlide(((index % slideCount) + slideCount) % slideCount),
    [slideCount],
  );

  useEffect(() => {
    if (slideCount <= 1 || paused) return;
    const timer = setInterval(
      () => setActiveSlide((prev) => (prev + 1) % slideCount),
      5500,
    );
    return () => clearInterval(timer);
  }, [slideCount, paused]);

  return (
    <div>
      {/* Hero Section — always the same */}
      <section className="relative min-h-120 sm:min-h-135 lg:min-h-150 flex items-center overflow-hidden">
        {heroImage && (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/60 to-black/30" />
        {!heroImage && <div className="absolute inset-0 bg-primary" />}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 w-full">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-accent font-medium text-sm uppercase tracking-wider">
              {dealer.city && dealer.state
                ? `${dealer.city}, ${dealer.state}`
                : dealer.name}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight drop-shadow-lg">
            {dealer.heroTitle || (
              <>
                Your Adventure Starts Here
              </>
            )}
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-white/80 max-w-xl leading-relaxed">
            {dealer.heroSubtitle ||
              content.heroSub(dealer.name, dealer.city)}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              to={dp("/inventory")}
              className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-light text-primary font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg"
            >
              Browse Inventory
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to={dp("/contact")}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors backdrop-blur-sm border border-white/20"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Promotional Carousel — full-bleed images, no overlay */}
      {slides && slideCount > 0 && (
        <section
          className="relative overflow-hidden bg-black"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative aspect-2000/530">
            {slides.map((slide, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  i === activeSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                {slide.ctaLink ? (
                  <Link to={slide.ctaLink} className="block w-full h-full">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                ) : (
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}

            {slideCount > 1 && (
              <>
                <button
                  onClick={() => goToSlide(activeSlide - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => goToSlide(activeSlide + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {slideCount > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i === activeSlide
                        ? "bg-white"
                        : "bg-white/40 hover:bg-white/60"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Shop by Category */}
      {categories.length > 1 && (
        <section className="py-14 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-10">
              Shop by Category
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map(({ type, label, count, image }) => (
                <Link
                  key={type}
                  to={dp(`/inventory?type=${type}`)}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden"
                >
                  <img
                    src={image}
                    alt={label}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                    <h3 className="text-white font-bold text-lg sm:text-xl uppercase tracking-wide">
                      {label}
                    </h3>
                    <p className="text-white/60 text-sm mt-1">
                      {count} {count === 1 ? "unit" : "units"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Units */}
      <section className="py-14 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Featured Inventory
              </h2>
              <p className="mt-2 text-gray-500 text-lg">
                Top picks from our showroom
              </p>
            </div>
            <Link
              to={dp("/inventory")}
              className="hidden sm:flex items-center gap-1 text-accent hover:text-amber-600 font-semibold transition-colors"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredUnits.map((unit) => (
              <UnitCard key={unit.id} unit={unit} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              to={dp("/inventory")}
              className="inline-flex items-center gap-1 text-accent hover:text-amber-600 font-semibold"
            >
              View all inventory
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Brands We Carry */}
      {allMakes.length > 1 && (
        <section className="py-14 sm:py-20 bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-10 text-center">
              Brands We Carry
            </h2>
            <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12">
              {allMakes.map((make) => {
                const logoUrl = getBrandLogoUrl(make);
                return logoUrl ? (
                  <img
                    key={make}
                    src={logoUrl}
                    alt={make}
                    className="h-8 sm:h-10 w-auto object-contain grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
                  />
                ) : (
                  <span
                    key={make}
                    className="text-sm sm:text-base font-bold text-gray-400 hover:text-gray-700 uppercase tracking-wider transition-colors duration-300"
                  >
                    {make.replace(/®/g, "")}
                  </span>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Why Choose {dealer.name}?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-5">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Trusted Dealer
              </h3>
              <p className="text-gray-500 leading-relaxed">
                {dealer.name} delivers honest pricing, expert service, and a
                commitment to getting you out there with confidence.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent/10 mb-5">
                <Sparkles className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Premium Selection
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Every unit is inspected and tested before it reaches you.
                {topMakes.length > 0 && (
                  <> Featuring {topMakes.join(", ")}, and more.</>
                )}
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/10 mb-5">
                <Wrench className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Full-Service Center
              </h3>
              <p className="text-gray-500 leading-relaxed">
                From routine maintenance to major service, our certified
                technicians keep your investment performing like new.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-14 sm:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-10 text-center">
              What Our Customers Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
                >
                  <svg
                    className="h-8 w-8 text-accent/20 mb-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391C0 7.905 3.748 4.039 9 3l.996 2.151C7.563 6.068 6 8.789 6 11h4v10H0z" />
                  </svg>
                  <div className="flex items-center gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= t.rating
                            ? "text-accent fill-accent"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {t.text}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 text-sm">
                      {t.reviewerName}
                    </p>
                    {t.source && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        {t.source}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {content.ctaTitle}
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            Browse our full inventory online or{" "}
            {dealer.address
              ? `stop by at ${dealer.address}`
              : "visit our showroom"}
            . Our team is ready to help you find the right fit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={dp("/inventory")}
              className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-light text-primary font-bold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Browse Inventory
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to={dp("/contact")}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors border border-white/20"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

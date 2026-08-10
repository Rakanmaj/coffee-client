import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import api from "../../api/api";
import { getCustomerMenuCategory } from "../../utils/displayCategory";
import "./MomentLanding.css";

gsap.registerPlugin(ScrollTrigger);

const asset = (name) => `/moment-brand/${name}`;

const campaignImages = [
  {
    src: asset("campaign-ruby.webp"),
    alt: "Moment ruby iced drink with mint",
    words: { en: "RUBY.", ar: "روبي." },
  },
  {
    src: asset("campaign-berry.webp"),
    alt: "Moment berry iced drink with fresh fruit",
    words: { en: "BERRY.", ar: "بيري." },
  },
  {
    src: asset("campaign-latte.webp"),
    alt: "Moment iced latte with coffee beans",
    words: { en: "LATTE.", ar: "لاتيه." },
  },
  {
    src: asset("campaign-iced.webp"),
    alt: "Moment iced coffee with milk and mint",
    words: { en: "ICED.", ar: "آيس." },
  },
];

const locationUrl = "https://maps.app.goo.gl/tB6u6BkJsM7Ei7Ah9?g_st=ic";
const languageStorageKey = "momentLandingLanguage";

const momentCopy = {
  en: {
    nav: {
      story: "Our Story",
      signature: "Signature",
      order: "Order From Your Car",
      menu: "Menu",
      cta: "View Menu",
      language: "العربية",
    },
    hero: {
      kicker: "Coffee / People / Moments",
      title: "Moment",
      titleParts: ["MO", "MENT"],
      line: "More than coffee. A Moment.",
      scroll: "Scroll",
    },
    statement: {
      fine: "Made for the pause between everything.",
      lines: ["EVERY COFFEE", "BECOMES", "A MOMENT."],
    },
    story: {
      fine: "This is Moment.",
      title: "Not just another coffee stop.",
      paragraphs: [
        "Moment was built around a simple idea: coffee is not only something you drink. It is where conversations start, drives slow down, friends meet, and ordinary days become something worth remembering.",
        "We care about what goes into the cup, and what happens around it.",
      ],
    },
    signature: {
      word: "SIGNATURE",
      fine: "Our signature",
      title: "Peach, the Moment way.",
      text: "Some flavours disappear. This one stays with you.",
    },
    orderVisual: {
      hot: "Hot",
      cold: "Cold",
      signature: "Signature",
    },
    orderScenes: [
      {
        word: "SCAN.",
        text: "Your Moment starts here.",
        detail: "Point your camera at the QR and step into the menu.",
        art: "qr",
      },
      {
        word: "ORDER.",
        text: "Choose what you're craving.",
        detail: "Hot, cold, sweet, simple. Make it yours.",
        art: "menu",
      },
      {
        word: "SIP.",
        text: "We'll take it from here.",
        detail: "No parking. No waiting. Just your Moment.",
        art: "drink",
      },
    ],
    orderFinal: {
      title: "No parking. No waiting. Just your Moment.",
      cta: "Order From Your Car",
    },
    orderIntro: {
      fine: "Order from your car",
      title: "Scan, choose, and enjoy your Moment.",
      text: "A quick scroll story showing how Moment drive-through works before you place your real order.",
    },
    orderStory: {
      eyebrow: "3 STEPS. ONE MOMENT.",
      scanText: "Your Moment starts with one scan.",
      sipText: "Stay where you are. We'll bring it to you.",
      menuTitle: "Moment Menu",
      prepared: "Your Moment is being prepared.",
      ready: "Ready",
      finalWords: ["SCAN.", "ORDER.", "SIP."],
      finalText: "Your Moment. Without leaving your car.",
    },
    campaign: {
      fine: "Four frames. One feeling.",
      title: "A menu that looks like a campaign.",
    },
    menu: {
      fine: "What's your Moment?",
      title: "Explore the full menu.",
      text: "Browse the live Moment menu, organized simply into cold and hot drinks.",
      loading: "Loading the menu...",
      error: "Menu preview is unavailable right now.",
      empty: "No cold or hot drinks are available right now.",
      cold: "Cold",
      hot: "Hot",
      items: "items",
      currency: "OMR",
    },
    business: {
      fine: "Beyond the cup.",
      title: "Events, collaborations, partnerships and new opportunities.",
      text: "Moment is a feeling people remember. When the right idea comes along, we are always open to creating the next one.",
    },
    location: {
      fine: "Find your Moment.",
      title: "Visit Moment or get in touch.",
      text: "For directions, orders, collaborations, or questions, reach us directly.",
      call: "Call",
      email: "Email",
      location: "Location",
      maps: "Open in Google Maps",
      aria: "Moment contact details",
    },
    closing: {
      first: "Come for the coffee.",
      second: "Stay for the Moment.",
    },
  },
  ar: {
    nav: {
      story: "قصتنا",
      signature: "التوقيع",
      order: "اطلب من سيارتك",
      menu: "القائمة",
      cta: "عرض القائمة",
      language: "English",
    },
    hero: {
      kicker: "قهوة / ناس / لحظات",
      title: "مومنت",
      titleParts: ["مومنت"],
      line: "أكثر من قهوة. لحظة مميزة.",
      scroll: "مرّر",
    },
    statement: {
      fine: "مصممة للاستراحة بين كل شيء.",
      lines: ["كل قهوة", "تتحول إلى", "لحظة."],
    },
    story: {
      fine: "هذا هو مومنت.",
      title: "ليست مجرد محطة قهوة.",
      paragraphs: [
        "بُني مومنت على فكرة بسيطة: القهوة ليست مشروباً فقط. هي بداية حديث، ووقفة هادئة في الطريق، ولقاء أصحاب، ولحظة تجعل اليوم العادي أجمل.",
        "نهتم بما يدخل الكوب، وباللحظة التي تحدث حوله.",
      ],
    },
    signature: {
      word: "التوقيع",
      fine: "مشروبنا المميز",
      title: "الخوخ، بطريقة مومنت.",
      text: "بعض النكهات تمر بسرعة. هذه تبقى في الذاكرة.",
    },
    orderVisual: {
      hot: "ساخن",
      cold: "بارد",
      signature: "التوقيع",
    },
    orderScenes: [
      {
        word: "امسح.",
        text: "لحظتك تبدأ من هنا.",
        detail: "وجّه كاميرتك إلى رمز QR وادخل إلى القائمة.",
        art: "qr",
      },
      {
        word: "اختر.",
        text: "اختر ما تشتهيه.",
        detail: "بارد أو ساخن، بسيط أو مميز. اجعله كما تحب.",
        art: "menu",
      },
      {
        word: "استمتع.",
        text: "نحن نتولى الباقي.",
        detail: "بدون مغادرة السيارة وبدون انتظار طويل. فقط لحظتك مع مومنت.",
        art: "drink",
      },
    ],
    orderFinal: {
      title: "بدون مواقف. بدون انتظار. فقط لحظتك مع مومنت.",
      cta: "اطلب من سيارتك",
    },
    orderIntro: {
      fine: "اطلب من سيارتك",
      title: "امسح، اختر، واستمتع بلحظتك.",
      text: "قصة قصيرة توضّح لك كيف يعمل طلب مومنت من السيارة قبل أن تبدأ طلبك الحقيقي.",
    },
    orderStory: {
      eyebrow: "٣ خطوات. لحظة واحدة.",
      scanText: "لحظتك تبدأ بمسحة واحدة.",
      sipText: "ابقَ في سيارتك. سنحضره إليك.",
      menuTitle: "قائمة مومنت",
      prepared: "يتم تحضير لحظتك الآن.",
      ready: "تم",
      finalWords: ["امسح.", "اختر.", "استمتع."],
      finalText: "لحظتك. بدون مغادرة السيارة.",
    },
    campaign: {
      fine: "أربع لقطات. إحساس واحد.",
      title: "قائمة بطابع حملة تصوير.",
    },
    menu: {
      fine: "ما هي لحظتك؟",
      title: "استكشف القائمة الكاملة.",
      text: "تصفح قائمة مومنت المباشرة، مرتبة ببساطة بين المشروبات الباردة والساخنة.",
      loading: "جاري تحميل القائمة...",
      error: "القائمة غير متاحة حالياً.",
      empty: "لا توجد مشروبات باردة أو ساخنة متاحة حالياً.",
      cold: "بارد",
      hot: "ساخن",
      items: "أصناف",
      currency: "ر.ع",
    },
    business: {
      fine: "أبعد من الكوب.",
      title: "فعاليات، تعاونات، شراكات وفرص جديدة.",
      text: "مومنت إحساس يتذكره الناس. وعندما تأتي الفكرة المناسبة، نكون دائماً مستعدين لصناعة اللحظة التالية.",
    },
    location: {
      fine: "اعثر على مومنت.",
      title: "زر مومنت أو تواصل معنا.",
      text: "للوصول، الطلبات، التعاونات أو الاستفسارات، تواصل معنا مباشرة.",
      call: "اتصال",
      email: "البريد",
      location: "الموقع",
      maps: "افتح في خرائط Google",
      aria: "بيانات التواصل مع مومنت",
    },
    closing: {
      first: "تعال من أجل القهوة.",
      second: "وابقَ من أجل اللحظة.",
    },
  },
};

const featuredFallback = [
  { product_id: "fallback-1", name: "Peach Signature", category: "cold", price_omr: "1.000" },
  { product_id: "fallback-2", name: "Spanish Latte", category: "cold", price_omr: "1.000" },
  { product_id: "fallback-3", name: "Cappuccino", category: "hot", price_omr: "1.000" },
  { product_id: "fallback-4", name: "Code Red", category: "cold", price_omr: "1.000" },
];

export default function MomentLanding() {
  const rootRef = useRef(null);
  const [language, setLanguage] = useState(readInitialLanguage);
  const [products, setProducts] = useState([]);
  const [menuState, setMenuState] = useState("loading");
  const copy = momentCopy[language];
  const direction = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem(languageStorageKey, language);
  }, [language]);

  useEffect(() => {
    let active = true;

    api
      .get("/api/drive-through/menu")
      .then((res) => {
        if (!active) return;
        setProducts(res.data.products || []);
        setMenuState("ready");
      })
      .catch(() => {
        if (!active) return;
        setMenuState("error");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return undefined;
    const isRtl = root.dir === "rtl";
    const isPhone = window.matchMedia("(max-width: 620px)").matches;

    const context = gsap.context(() => {
      gsap.from(".momentHeroImage", {
        clipPath: "inset(18% 18% 18% 18%)",
        scale: 1.08,
        opacity: 0,
        duration: 1.25,
        ease: "power3.out",
      });

      gsap.from(".momentHeroTitle span", {
        yPercent: 105,
        duration: 1,
        stagger: 0.08,
        ease: "power4.out",
        delay: 0.25,
      });

      gsap.from(".momentHeroLine", {
        y: 18,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        delay: 1.05,
      });

      gsap.utils.toArray(".momentReveal").forEach((item) => {
        gsap.from(item, {
          y: 42,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: item,
            start: "top 82%",
          },
        });
      });

      gsap.utils.toArray(".momentStatementLine").forEach((line, index) => {
        const startX = isRtl ? 0 : index % 2 === 0 ? -18 : 18;

        gsap.fromTo(
          line,
          { xPercent: startX, opacity: 0.18 },
          {
            xPercent: 0,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".momentStatement",
              start: "top bottom",
              end: "bottom center",
              scrub: true,
            },
          }
        );
      });

      if (isPhone) {
        gsap.set(".momentSignatureImage", {
          clipPath: "inset(0% 0% 0% 0%)",
          scale: 1,
        });

        const signaturePhoneTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: ".momentSignatureImageShell",
            start: "top 86%",
            toggleActions: "play none none reverse",
          },
        });

        signaturePhoneTimeline
          .fromTo(
            ".momentSignatureImageShell",
            {
              autoAlpha: 0,
              y: 46,
              scale: 0.93,
              rotateX: 8,
              rotateZ: -2.2,
              filter: "blur(7px)",
              boxShadow: "0 16px 38px rgba(52, 30, 19, 0.08)",
            },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              rotateX: 0,
              rotateZ: 0,
              filter: "blur(0px)",
              boxShadow: "0 28px 70px rgba(52, 30, 19, 0.2)",
              duration: 0.9,
              ease: "expo.out",
            }
          )
          .fromTo(
            ".momentSignatureImage",
            { scale: 1.035, filter: "saturate(0.88) contrast(0.96)" },
            {
              scale: 1,
              filter: "saturate(1) contrast(1)",
              duration: 1.05,
              ease: "power3.out",
            },
            0.05
          )
          .fromTo(
            ".momentSignatureShine",
            { xPercent: -150, autoAlpha: 0 },
            {
              xPercent: 150,
              autoAlpha: 1,
              duration: 0.95,
              ease: "power2.out",
            },
            0.16
          )
          .to(".momentSignatureShine", { autoAlpha: 0, duration: 0.2 }, "-=0.18")
          .fromTo(
            ".momentSignatureCopy",
            { y: 18, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.56,
              ease: "power2.out",
            },
            0.28
          )
          .to(
            ".momentSignatureImageShell",
            {
              y: -4,
              duration: 0.38,
              yoyo: true,
              repeat: 1,
              ease: "sine.inOut",
            },
            0.8
          );

        gsap.to(".momentSignatureImageShell", {
          y: -12,
          ease: "none",
          scrollTrigger: {
            trigger: ".momentSignature",
            start: "top bottom",
            end: "bottom top",
            scrub: 0.45,
          },
        });
      } else {
        gsap.fromTo(
          ".momentSignatureImage",
          { clipPath: "inset(22% 42% 22% 0%)", scale: 1.16 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".momentSignature",
              start: "top 78%",
              end: "bottom 45%",
              scrub: true,
            },
          }
        );
      }

      const orderSection = root.querySelector(".momentOrderPinned");
      if (orderSection) {
        const orderTimeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: orderSection,
            start: "top top",
            end: "+=360%",
            scrub: 0.65,
            pin: ".momentOrderPinned",
            anticipatePin: 1,
          },
        });

        gsap.set(".momentProgressCircle", { strokeDashoffset: 1 });
        gsap.set(".momentProgressCheck, .momentOrderTextPanel:not([data-story-step='scan']), .momentPhoneMenu, .momentOrderTray, .momentPrepared, .momentSipScene, .momentOrderFinalPanel", {
          autoAlpha: 0,
        });
        gsap.set(".momentProgressLineFill", { scaleX: 0, transformOrigin: isRtl ? "right center" : "left center" });
        gsap.set(".momentPhone", { autoAlpha: 0, y: 120, scale: 0.82 });
        gsap.set(".momentQrStand", { autoAlpha: 0, y: 34, scale: 0.92 });
        gsap.set(".momentFocusFrame, .momentSuccessPill", { autoAlpha: 0, scale: 0.9 });
        gsap.set(".momentScanLine", { autoAlpha: 0, yPercent: -130 });
        gsap.set(".momentProductCard.isFeatured", { transformOrigin: "center center" });
        gsap.set(".momentDrinkHero", { autoAlpha: 0, x: isRtl ? -120 : 120, scale: 0.68, rotate: isRtl ? -5 : 5 });
        gsap.set(".momentDeliveryHand", { autoAlpha: 0, x: isRtl ? -70 : 70 });
        gsap.set(".momentDrinkSparkle", { autoAlpha: 0, scale: 0.3 });

        orderTimeline
          .fromTo(".momentOrderEyebrow", { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.18 }, 0)
          .to(".momentProgressCircle[data-step='1']", { strokeDashoffset: 0, duration: 0.72 }, 0)
          .to(".momentQrStand", { autoAlpha: 1, y: 0, scale: 1, duration: 0.24 }, 0.04)
          .to(".momentPhone", { autoAlpha: 1, y: 0, scale: 0.92, duration: 0.34 }, 0.18)
          .to(".momentPhone", { x: isRtl ? -42 : 42, y: -20, scale: 0.96, duration: 0.26 }, 0.46)
          .to(".momentScanLine", { autoAlpha: 1, yPercent: 120, duration: 0.24 }, 0.52)
          .to(".momentFocusFrame", { autoAlpha: 1, scale: 1, duration: 0.18 }, 0.58)
          .to(".momentSuccessPill", { autoAlpha: 1, scale: 1, duration: 0.14 }, 0.73)
          .to(".momentQrStand", { scale: 0.28, x: isRtl ? -135 : 135, y: -54, autoAlpha: 0.35, duration: 0.28 }, 0.82)
          .to(".momentProgressNumber[data-step='1']", { autoAlpha: 0, duration: 0.08 }, 0.94)
          .to(".momentProgressCheck[data-step='1']", { autoAlpha: 1, duration: 0.1 }, 0.94)
          .to(".momentProgressLineFill[data-line='1']", { scaleX: 1, duration: 0.25 }, 0.98)
          .to(".momentProgressCircle[data-step='2']", { strokeDashoffset: 0, duration: 0.74 }, 1.05)
          .to(".momentOrderTextPanel[data-story-step='scan']", { autoAlpha: 0, y: -28, duration: 0.2 }, 1.02)
          .fromTo(".momentOrderTextPanel[data-story-step='order']", { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.22 }, 1.08)
          .to(".momentPhoneScan", { autoAlpha: 0, duration: 0.18 }, 1.08)
          .to(".momentPhoneMenu", { autoAlpha: 1, duration: 0.22 }, 1.12)
          .to(".momentPhone", { x: 0, y: 0, scale: 1.08, duration: 0.3 }, 1.12)
          .to(".momentOrderBackdropWarm", { autoAlpha: 0.34, duration: 0.54 }, 1.14)
          .to(".momentMenuScroller", { y: -74, duration: 0.5 }, 1.28)
          .to(".momentProductCard.isFeatured", { scale: 1.08, y: -6, duration: 0.24 }, 1.47)
          .to(".momentOrderTray", { autoAlpha: 1, y: 0, duration: 0.22 }, 1.62)
          .to(".momentSelectedDrinkMini", { y: 0, scale: 1, autoAlpha: 1, duration: 0.22 }, 1.66)
          .to(".momentPrepared", { autoAlpha: 1, y: 0, duration: 0.18 }, 1.82)
          .to(".momentProgressNumber[data-step='2']", { autoAlpha: 0, duration: 0.08 }, 1.92)
          .to(".momentProgressCheck[data-step='2']", { autoAlpha: 1, duration: 0.1 }, 1.92)
          .to(".momentProgressLineFill[data-line='2']", { scaleX: 1, duration: 0.25 }, 1.98)
          .to(".momentProgressCircle[data-step='3']", { strokeDashoffset: 0, duration: 0.72 }, 2.06)
          .to(".momentOrderTextPanel[data-story-step='order']", { autoAlpha: 0, y: -28, duration: 0.2 }, 2.06)
          .fromTo(".momentOrderTextPanel[data-story-step='sip']", { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.22 }, 2.14)
          .to(".momentPhone", { x: isRtl ? 118 : -118, y: 18, scale: 0.78, autoAlpha: 0.34, duration: 0.36 }, 2.14)
          .to(".momentSipScene", { autoAlpha: 1, duration: 0.28 }, 2.16)
          .to(".momentDrinkHero", { autoAlpha: 1, x: 0, scale: 1, rotate: 0, duration: 0.42 }, 2.24)
          .to(".momentDeliveryHand", { autoAlpha: 1, x: 0, duration: 0.3 }, 2.36)
          .to(".momentDrinkHero", { x: isRtl ? 42 : -42, y: -8, duration: 0.32 }, 2.52)
          .to(".momentDrinkSparkle", { autoAlpha: 1, scale: 1, stagger: 0.04, duration: 0.18 }, 2.65)
          .to(".momentProgressNumber[data-step='3']", { autoAlpha: 0, duration: 0.08 }, 2.82)
          .to(".momentProgressCheck[data-step='3']", { autoAlpha: 1, duration: 0.1 }, 2.82)
          .to(".momentPhone, .momentQrStand, .momentSipScene, .momentOrderTray, .momentOrderTextPanel[data-story-step='sip']", { autoAlpha: 0, scale: 0.92, duration: 0.28 }, 3.02)
          .fromTo(".momentOrderFinalPanel", { autoAlpha: 0, y: 32, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.36 }, 3.12);
      }

      gsap.utils.toArray(".momentCampaignFrame").forEach((frame) => {
        const image = frame.querySelector("img");
        gsap.fromTo(
          image,
          { scale: 1.08 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: frame,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });
    }, root);

    return () => context.revert();
  }, [language]);

  const menuProducts = useMemo(() => {
    return products.length ? products : featuredFallback;
  }, [products]);

  return (
    <main className="momentLanding" ref={rootRef} lang={language} dir={direction} data-language={language}>
      <LandingNav copy={copy} language={language} setLanguage={setLanguage} />
      <HeroSection copy={copy} />
      <BrandStatement copy={copy} />
      <StorySection copy={copy} />
      <SignatureSection copy={copy} />
      <CarOrderExperience copy={copy} products={menuProducts} />
      <ProductShowcase copy={copy} language={language} />
      <MenuPreview products={menuProducts} menuState={menuState} copy={copy} />
      <BusinessSection copy={copy} />
      <LocationSection copy={copy} />
      <ClosingSection copy={copy} />
      <MomentFooter copy={copy} />
    </main>
  );
}

function LandingNav({ copy, language, setLanguage }) {
  const nextLanguage = language === "ar" ? "en" : "ar";

  return (
    <header className="momentNav" aria-label="Moment landing navigation">
      <Link className="momentNavLogo" to="/moment" aria-label="Moment home">
        <img src={asset("brand-round-logo.webp")} alt="" />
        <span>MOMENT</span>
      </Link>
      <nav>
        <a href="#story">{copy.nav.story}</a>
        <a href="#signature">{copy.nav.signature}</a>
        <a href="#order">{copy.nav.order}</a>
        <a href="#menu-preview">{copy.nav.menu}</a>
      </nav>
      <div className="momentNavActions">
        <button
          className="momentLanguageToggle"
          type="button"
          aria-label={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
          onClick={() => setLanguage(nextLanguage)}
        >
          {copy.nav.language}
        </button>
        <a className="momentNavCta" href="#menu-preview">
          {copy.nav.cta}
        </a>
      </div>
    </header>
  );
}

function HeroSection({ copy }) {
  return (
    <section className="momentHero" id="top">
      <div className="momentHeroImageWrap" aria-hidden="true">
        <img
          className="momentHeroImage"
          src={asset("hero-neon.webp")}
          alt=""
          fetchPriority="high"
        />
      </div>
      <div className="momentHeroOverlay" />
      <div className="momentHeroContent">
        <p className="momentKicker">{copy.hero.kicker}</p>
        <h1 className="momentHeroTitle" aria-label={copy.hero.title}>
          {copy.hero.titleParts.map((part) => (
            <span key={part}>{part}</span>
          ))}
        </h1>
        <p className="momentHeroLine">{copy.hero.line}</p>
      </div>
      <a className="momentScrollHint" href="#feeling">
        {copy.hero.scroll}
      </a>
    </section>
  );
}

function BrandStatement({ copy }) {
  return (
    <section className="momentStatement" id="feeling">
      <p className="momentFine momentReveal">{copy.statement.fine}</p>
      <h2>
        {copy.statement.lines.map((line) => (
          <span className="momentStatementLine" key={line}>{line}</span>
        ))}
      </h2>
    </section>
  );
}

function StorySection({ copy }) {
  return (
    <section className="momentStory" id="story">
      <div className="momentStoryMedia momentReveal">
        <img src={asset("story-neon-cup.webp")} alt="Moment drink held in front of the cafe neon sign" loading="lazy" />
      </div>
      <div className="momentStoryCopy momentReveal">
        <p className="momentFine">{copy.story.fine}</p>
        <h2>{copy.story.title}</h2>
        {copy.story.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

function SignatureSection({ copy }) {
  return (
    <section className="momentSignature" id="signature">
      <div className="momentSignatureWord" aria-hidden="true">{copy.signature.word}</div>
      <div className="momentSignatureImageShell">
        <img
          className="momentSignatureImage"
          src={asset("signature-peach.webp")}
          alt="Moment signature peach drink campaign"
          loading="lazy"
        />
        <span className="momentSignatureShine" aria-hidden="true" />
      </div>
      <div className="momentSignatureCopy momentReveal">
        <p className="momentFine peach">{copy.signature.fine}</p>
        <h2>{copy.signature.title}</h2>
        <p>{copy.signature.text}</p>
      </div>
    </section>
  );
}

function CarOrderExperience({ copy, products }) {
  const storyProducts = useMemo(() => getOrderStoryProducts(products), [products]);
  const selectedDrink = storyProducts[1] || storyProducts[0] || featuredFallback[0];
  const scenes = copy.orderScenes;

  return (
    <section className="momentOrderFilm" id="order">
      <div className="momentOrderIntro momentReveal">
        <p className="momentFine">{copy.orderIntro.fine}</p>
        <h2>{copy.orderIntro.title}</h2>
        <p>{copy.orderIntro.text}</p>
      </div>
      <div className="momentOrderPinned">
        <div className="momentOrderBackdropWarm" aria-hidden="true" />
        <div className="momentOrderInner">
          <div className="momentOrderEyebrow">{copy.orderStory.eyebrow}</div>

          <div className="momentOrderProgress" aria-hidden="true">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className="momentProgressStep">
                  <svg viewBox="0 0 44 44">
                    <circle className="momentProgressTrack" cx="22" cy="22" r="18" />
                    <circle className="momentProgressCircle" data-step={step} cx="22" cy="22" r="18" pathLength="1" />
                  </svg>
                  <span className="momentProgressNumber" data-step={step}>{String(step).padStart(2, "0")}</span>
                  <span className="momentProgressCheck" data-step={step}>✓</span>
                </div>
                {step < 3 ? (
                  <span className="momentProgressLine">
                    <span className="momentProgressLineFill" data-line={step} />
                  </span>
                ) : null}
              </React.Fragment>
            ))}
          </div>

          <div className="momentOrderStage">
            <div className="momentCarFrame" aria-hidden="true">
              <span className="momentCarWindow" />
              <span className="momentDashboard" />
            </div>

            <div className="momentOrderTextStack">
              {scenes.map((scene, index) => (
                <div
                  className="momentOrderTextPanel"
                  data-story-step={index === 0 ? "scan" : index === 1 ? "order" : "sip"}
                  key={scene.word}
                >
                  <h2>{scene.word}</h2>
                  <p>{index === 0 ? copy.orderStory.scanText : index === 1 ? scene.text : copy.orderStory.sipText}</p>
                </div>
              ))}
            </div>

            <div className="momentSceneVisual" aria-hidden="true">
              <div className="momentQrStand">
                <div className="momentQrPlate">
                  <span>MOMENT</span>
                  <div className="momentQrCode real">
                    <img className="momentQrImage" src={asset("drive-thru-qr.png")} alt="" />
                  </div>
                  <div className="momentScanLine" />
                  <div className="momentFocusFrame" />
                  <div className="momentSuccessPill">{copy.orderStory.ready}</div>
                </div>
                <span className="momentQrStem" />
              </div>

              <div className="momentPhone">
                <span className="momentPhoneSpeaker" />
                <div className="momentPhoneScreen">
                  <div className="momentPhoneScan">
                    <span className="momentPhoneMiniLogo">Moment</span>
                    <div className="momentPhoneScanner">
                      <img className="momentPhoneQrPreview" src={asset("drive-thru-qr.png")} alt="" />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                  <div className="momentPhoneMenu">
                    <span className="momentPhoneMiniLogo">{copy.orderStory.menuTitle}</span>
                    <div className="momentMenuScroller">
                      {storyProducts.map((product, index) => (
                        <article className={`momentProductCard ${index === 1 ? "isFeatured" : ""}`} key={product.product_id || product.name}>
                          <div className="momentProductCup">
                            <span />
                          </div>
                          <div>
                            <b>{product.name}</b>
                            <small>{formatOman(product.price_omr)} {copy.menu.currency}</small>
                          </div>
                        </article>
                      ))}
                    </div>
                    <div className="momentPrepared">{copy.orderStory.prepared}</div>
                  </div>
                </div>
              </div>

              <div className="momentOrderTray">
                <div className="momentSelectedDrinkMini">
                  <span />
                </div>
                <b>{selectedDrink.name}</b>
              </div>

              <div className="momentSipScene">
                <span className="momentWindowSilhouette" />
                <span className="momentDeliveryHand" />
                <div className="momentDrinkHero">
                  <div className="momentDrinkLid" />
                  <div className="momentDrinkLiquid" />
                  <div className="momentDrinkSleeve">MOMENT</div>
                  <span className="momentDrinkSparkle one" />
                  <span className="momentDrinkSparkle two" />
                  <span className="momentDrinkSparkle three" />
                </div>
              </div>
            </div>

            <div className="momentOrderFinalPanel">
              <h2>
                {copy.orderStory.finalWords.map((word) => (
                  <span key={word}>{word}</span>
                ))}
              </h2>
              <p>{copy.orderStory.finalText}</p>
              <Link className="momentButton dark" to="/drive-thru">
                {copy.orderFinal.cta} →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductShowcase({ copy, language }) {
  return (
    <section className="momentCampaign" aria-label="Moment product campaign">
      <div className="momentCampaignIntro momentReveal">
        <p className="momentFine">{copy.campaign.fine}</p>
        <h2>{copy.campaign.title}</h2>
      </div>
      <div className="momentCampaignGrid">
        {campaignImages.map((image) => (
          <article className="momentCampaignFrame" key={image.words.en}>
            <img src={image.src} alt={image.alt} loading="lazy" />
            <strong>{image.words[language]}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function MenuPreview({ products, menuState, copy }) {
  const groupedProducts = useMemo(() => groupMenuProducts(products), [products]);
  const [activeMenuCategory, setActiveMenuCategory] = useState("cold");
  const sections = [
    { key: "cold", label: copy.menu.cold, items: groupedProducts.cold },
    { key: "hot", label: copy.menu.hot, items: groupedProducts.hot },
  ];
  const hasMenuItems = sections.some((section) => section.items.length > 0);
  const visibleMenuCategory = groupedProducts[activeMenuCategory]?.length
    ? activeMenuCategory
    : groupedProducts.cold.length
      ? "cold"
      : groupedProducts.hot.length
        ? "hot"
        : activeMenuCategory;

  return (
    <section className="momentMenuPreview" id="menu-preview">
      <div className="momentMenuHeader momentReveal">
        <p className="momentFine">{copy.menu.fine}</p>
        <h2>{copy.menu.title}</h2>
        <p>{copy.menu.text}</p>
      </div>
      {menuState === "loading" ? <div className="momentMenuState">{copy.menu.loading}</div> : null}
      {menuState === "error" ? (
        <div className="momentMenuState">{copy.menu.error}</div>
      ) : null}
      <div className="momentMenuTabs" role="tablist" aria-label="Moment menu categories">
        {sections.map((section) => (
          <button
            className={section.key === visibleMenuCategory ? "isActive" : ""}
            type="button"
            role="tab"
            aria-selected={section.key === visibleMenuCategory}
            aria-controls={`moment-${section.key}-menu-panel`}
            key={section.key}
            onClick={() => setActiveMenuCategory(section.key)}
          >
            {section.label}
            <span>{section.items.length}</span>
          </button>
        ))}
      </div>
      <div className="momentMenuGroups" data-active-category={visibleMenuCategory}>
        {sections.map((section) => (
          <section
            className={`momentMenuGroup momentReveal ${section.key === visibleMenuCategory ? "isActive" : ""}`}
            id={`moment-${section.key}-menu-panel`}
            key={section.key}
            aria-labelledby={`moment-${section.key}-menu`}
          >
            <div className="momentMenuGroupHeader">
              <h3 id={`moment-${section.key}-menu`}>{section.label}</h3>
              <span>{section.items.length} {copy.menu.items}</span>
            </div>
            <div className="momentMenuList">
              {section.items.map((product) => (
                <article className="momentMenuItem" key={product.product_id}>
                  <h4>{product.name}</h4>
                  <strong>{formatOman(product.price_omr)} {copy.menu.currency}</strong>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      {!hasMenuItems && menuState !== "loading" ? (
        <div className="momentMenuState">{copy.menu.empty}</div>
      ) : null}
    </section>
  );
}

function BusinessSection({ copy }) {
  return (
    <section className="momentBusiness">
      <div className="momentReveal">
        <p className="momentFine">{copy.business.fine}</p>
        <h2>{copy.business.title}</h2>
      </div>
      <p className="momentReveal">{copy.business.text}</p>
    </section>
  );
}

function LocationSection({ copy }) {
  return (
    <section className="momentLocation" id="location">
      <div className="momentLocationMark" aria-hidden="true">M</div>
      <div className="momentLocationContent momentReveal">
        <p className="momentFine">{copy.location.fine}</p>
        <h2>{copy.location.title}</h2>
        <p>{copy.location.text}</p>
        <div className="momentContactGrid" aria-label={copy.location.aria}>
          <a href="tel:+96894034082">
            <span>{copy.location.call}</span>
            <strong>94034082</strong>
          </a>
          <a href="mailto:jmahmoud463@gmail.com">
            <span>{copy.location.email}</span>
            <strong>jmahmoud463@gmail.com</strong>
          </a>
          <a href={locationUrl} target="_blank" rel="noreferrer">
            <span>{copy.location.location}</span>
            <strong>{copy.location.maps}</strong>
          </a>
        </div>
      </div>
    </section>
  );
}

function ClosingSection({ copy }) {
  return (
    <section className="momentClosing">
      <h2>
        <span>{copy.closing.first}</span>
        <span>{copy.closing.second}</span>
      </h2>
      <img src={asset("brand-round-logo.webp")} alt="Moment" />
    </section>
  );
}

function MomentFooter({ copy }) {
  return (
    <footer className="momentFooter">
      <Link to="/moment">Moment</Link>
      <a href="#menu-preview">{copy.nav.menu}</a>
      <a href="#location">{copy.location.location}</a>
      <Link to="/drive-thru">{copy.nav.order}</Link>
      <a href="tel:+96894034082">94034082</a>
    </footer>
  );
}

function readInitialLanguage() {
  if (typeof window === "undefined") return "en";
  const savedLanguage = localStorage.getItem(languageStorageKey);
  return savedLanguage === "ar" ? "ar" : "en";
}

function getOrderStoryProducts(products) {
  const availableProducts = (products.length ? products : featuredFallback).filter((product) => {
    const category = getCustomerMenuCategory(product);
    const name = product.name?.toLowerCase() || "";
    return (category === "cold" || category === "hot") && !name.includes("mojito") && !name.includes("mojiti");
  });
  const preferredTerms = ["spanish", "peach", "latte"];
  const selected = [];

  preferredTerms.forEach((term) => {
    const match = availableProducts.find((product) => {
      const name = product.name?.toLowerCase() || "";
      return name.includes(term) && !selected.some((item) => item.product_id === product.product_id);
    });

    if (match) {
      selected.push(match);
    }
  });

  availableProducts.forEach((product) => {
    if (selected.length < 3 && !selected.some((item) => item.product_id === product.product_id)) {
      selected.push(product);
    }
  });

  return selected.slice(0, 3);
}

function formatOman(value) {
  return Number(value || 0).toFixed(3);
}

function groupMenuProducts(products) {
  return products.reduce(
    (groups, product) => {
      const category = getCustomerMenuCategory(product);
      if (category === "cold" || category === "hot") {
        groups[category].push(product);
      }
      return groups;
    },
    { cold: [], hot: [] }
  );
}

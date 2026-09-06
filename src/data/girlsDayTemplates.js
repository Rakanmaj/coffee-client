export const STORY = Object.freeze({ width: 1080, height: 1920 });
// A shared aperture preserves the crop when a customer changes styles.
export const PHOTO_FRAME = Object.freeze({ x: 100, y: 410, width: 880, height: 1070, radius: 28 });
export const GIRLS_DAY_LOGO = "/moment-brand/moment-round-logo.webp";
export const GIRLS_DAY_THEME = "/girls-day/campaign.webp";

export const girlsDayTemplates = [
  {
    id: "pink", background: "#F9DAE4", paper: "#FFF9F2", ink: "#26472E",
    accent: "#B53165", line: "#B64F78", pattern: "ribbon", thumbnail: "/girls-day/templates/pink/preview.svg",
    backgroundImage: null, foregroundImage: null,
  },
  {
    id: "strawberry", background: "#FCE8DF", paper: "#FFF9F2", ink: "#692B3A",
    accent: "#AD354C", line: "#C56776", pattern: "gingham", thumbnail: "/girls-day/templates/strawberry/preview.svg",
    backgroundImage: null, foregroundImage: null,
  },
  {
    id: "classic", background: "#DDE6C9", paper: "#FFF9F2", ink: "#29442C",
    accent: "#4E693C", line: "#637E4B", pattern: "botanical", thumbnail: "/girls-day/templates/classic/preview.svg",
    backgroundImage: null, foregroundImage: null,
  },
];

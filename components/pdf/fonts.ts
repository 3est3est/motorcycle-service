import { Font } from "@react-pdf/renderer";

export function registerThaiFonts() {
  // Using direct Google Fonts static TTF links which are optimized for delivery
  Font.register({
    family: "IBM Plex Sans Thai",
    fonts: [
      {
        src: "https://fonts.gstatic.com/s/ibmplexsansthai/v11/m8JPje1VVIzcq1HzJq2AEdo2Tj_qvLq8Dg.ttf",
        fontWeight: "normal",
      },
      {
        src: "https://fonts.gstatic.com/s/ibmplexsansthai/v11/m8JMje1VVIzcq1HzJq2AEdo2Tj_qvLqEsvMFbQ.ttf",
        fontWeight: "bold",
      },
    ],
  });
}

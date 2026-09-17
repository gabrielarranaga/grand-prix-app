import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Tipografia de titulos, subtitulos y cifras: con mas caracter que Inter,
// para que no todo el texto grande se vea con la misma tipografia generica.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Grand Prix - Panel de gestión",
  description: "Reservas de clases, agendas y administración de Escuela de Manejo Grand Prix.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf9f8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-PE"
      className={`${inter.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <div className="ambient-bg" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        {children}
      </body>
    </html>
  );
}

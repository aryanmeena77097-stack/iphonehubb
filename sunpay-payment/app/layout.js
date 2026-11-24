
import "./globals.css";

export const metadata = {
  title: "Secure Payment",
  description: "Secure online payment checkout"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


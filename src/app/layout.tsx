import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhereOnEarth",
  description: "A geography guessing game: find where on Earth you are.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Moderación",
};

export default function ModeracionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

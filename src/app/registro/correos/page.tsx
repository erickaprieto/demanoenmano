import { CorreosShippingScreen } from "@/components/registro/CorreosShippingScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datos de envío",
};

export default function RegistroCorreosPage() {
  return <CorreosShippingScreen />;
}

import { ShoppingCartScreen } from "@/components/carrito/ShoppingCartScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carrito",
};

export default function CarritoPage() {
  return <ShoppingCartScreen />;
}

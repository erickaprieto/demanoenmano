import { TrackingTimelineClient } from "@/components/perfil/TrackingTimelineClient";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function TrackingOrderPage({ params }: PageProps) {
  const { orderId } = await params;
  return <TrackingTimelineClient orderId={orderId} />;
}

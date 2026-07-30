import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/replays")({
  component: ReplaysLayout,
});

function ReplaysLayout() {
  return <Outlet />;
}

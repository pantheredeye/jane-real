"use client";

import type { RouteSummaryCardData } from "./cardTypes";

function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0m";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export interface RouteSummaryCardProps {
  route: RouteSummaryCardData;
}

export function RouteSummaryCard({ route }: RouteSummaryCardProps) {
  const openHref = `/route/?routeId=${encodeURIComponent(route.routeId)}`;
  return (
    <article
      className="agent-card agent-card--route"
      aria-label="Optimized route summary"
    >
      <header className="agent-card__header">
        <span className="agent-card__icon" aria-hidden="true">
          🗺️
        </span>
        <div className="agent-card__heading">
          <h3 className="agent-card__title">Optimized Route</h3>
          <span className="agent-card__pill">
            {route.stops.length} {route.stops.length === 1 ? "stop" : "stops"}
          </span>
        </div>
      </header>

      <div className="agent-card__body">
        <ol className="agent-card__stops">
          {route.stops.map((stop, i) => (
            <li key={stop.eventId} className="agent-card__stop">
              <span className="agent-card__stop-index">{i + 1}</span>
              <div className="agent-card__stop-body">
                <div className="agent-card__stop-title">{stop.title}</div>
                {stop.address && (
                  <div className="agent-card__stop-address">{stop.address}</div>
                )}
                <div className="agent-card__stop-meta">
                  {formatTime(stop.appointmentTime)}
                  {i > 0 && ` · +${formatDuration(stop.travelMinutes)} drive`}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="agent-card__row">
          <span className="agent-card__label">Total</span>
          <span>
            {formatDuration(route.totalMinutes)}
            {" · "}
            {formatDuration(route.totalDrivingMinutes)} driving
          </span>
        </div>
      </div>

      <div className="agent-card__actions">
        <a className="agent-card__action" href={openHref}>
          Open in Route Calculator
        </a>
      </div>
    </article>
  );
}

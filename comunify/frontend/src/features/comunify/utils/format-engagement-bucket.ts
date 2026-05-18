import type { EngagementBucket } from "../types/cohort.types";

const BUCKET_LABELS: Record<EngagementBucket, string> = {
  high: "Alto",
  medium: "Medio",
  low: "Bajo",
};

const BUCKET_COLORS: Record<EngagementBucket, string> = {
  high: "bg-comunify-stable/10 text-comunify-stable",
  medium: "bg-comunify-warning/10 text-comunify-warning",
  low: "bg-comunify-primary/10 text-comunify-blue",
};

export function formatEngagementBucket(bucket: EngagementBucket): string {
  return BUCKET_LABELS[bucket] ?? bucket;
}

export function engagementBucketColor(bucket: EngagementBucket): string {
  return BUCKET_COLORS[bucket] ?? "bg-comunify-bg text-comunify-text";
}

import type { EngagementBucket } from "../types/cohort.types";

const BUCKET_LABELS: Record<EngagementBucket, string> = {
  high: "Alto",
  medium: "Medio",
  low: "Bajo",
};

const BUCKET_COLORS: Record<EngagementBucket, string> = {
  high: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-blue-100 text-blue-700",
};

export function formatEngagementBucket(bucket: EngagementBucket): string {
  return BUCKET_LABELS[bucket] ?? bucket;
}

export function engagementBucketColor(bucket: EngagementBucket): string {
  return BUCKET_COLORS[bucket] ?? "bg-gray-100 text-gray-700";
}

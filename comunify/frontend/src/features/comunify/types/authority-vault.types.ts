export type UrlValidationStatus = "unverified" | "valid" | "invalid";

export interface AuthorityCredential {
  id: string;
  title: string;
  issuer: string;
  issued_year: number | null;
  credential_url: string | null;
  url_status: UrlValidationStatus;
}

export interface AuthorityCaseStudy {
  id: string;
  title: string;
  client_name: string;
  result_summary: string;
  url: string | null;
  url_status: UrlValidationStatus;
}

export interface AuthorityPressMention {
  id: string;
  publication: string;
  headline: string;
  url: string;
  url_status: UrlValidationStatus;
  published_at: string | null;
}

export interface AuthorityVault {
  credentials: AuthorityCredential[];
  case_studies: AuthorityCaseStudy[];
  press_mentions: AuthorityPressMention[];
  total_score: number;
}

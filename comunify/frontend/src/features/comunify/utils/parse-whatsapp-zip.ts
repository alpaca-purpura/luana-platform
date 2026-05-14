/**
 * Parse WhatsApp chat export ZIP to extract contact list for bulk cohort enroll.
 * Stub — full implementation deferred to post-merge polish.
 */
export interface WhatsAppContact {
  phone: string;
  displayName?: string;
}

export async function parseWhatsAppZip(file: File): Promise<WhatsAppContact[]> {
  // Coverage WARN — full ZIP parsing implementation deferred to post-merge polish.
  // Pattern: extract _chat.txt, parse "Messages with <name>:" header + participant lines.
  // Requires jszip (to be added as dependency).
  void file;
  return Promise.resolve([]);
}

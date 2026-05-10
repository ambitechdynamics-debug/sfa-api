// Utilitaire de parsing JSON sécurisé pour les réponses IA

/**
 * Nettoie et parse la réponse JSON d'un LLM.
 * Gère les balises markdown ```json ... ```, les espaces en tête/queue.
 * Ne lève jamais d'exception : retourne { success: false, error } si invalide.
 */
export function safeJsonParseAIResponse<T = unknown>(
  raw: string
): { success: true; data: T } | { success: false; error: string; raw: string } {
  if (!raw || typeof raw !== 'string') {
    return { success: false, error: 'Empty or non-string response from AI', raw: String(raw) };
  }

  // Nettoyage des balises markdown
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  // Extraction du premier bloc JSON valide si entouré de texte
  const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(cleaned) as T;
    return { success: true, data: parsed };
  } catch (err) {
    return {
      success: false,
      error: `JSON parse error: ${err instanceof Error ? err.message : 'Unknown'}`,
      raw: cleaned
    };
  }
}

/**
 * Abstraction du stockage objet — voir ADR-0016. Contrairement à
 * `PaymentProvider`/`SmsSender` (voir payments/auth), ce n'est pas une
 * décision en attente : MinIO est le choix retenu (auto-hébergé), il n'y a
 * qu'une seule implémentation. L'interface existe quand même pour garder
 * le même pattern repository/port-adapter que le reste du dépôt (ADR-0003)
 * — un module métier ne parle jamais au SDK MinIO directement.
 *
 * Aucun consommateur avant qu'un module métier n'ait besoin de fichiers
 * (photos d'immeuble, documents locataire, bail PDF généré — Phase 2/3).
 * Présent dès maintenant pour que ces modules s'appuient dessus sans
 * réinventer le contrat à ce moment-là (même raisonnement que
 * `PaymentProvider`).
 */
export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';

export interface UploadObjectRequest {
  organizationId: string;
  /** Sous-dossier logique, ex. "buildings", "tenants", "leases". */
  category: string;
  fileName: string;
  contentType: string;
  body: Buffer;
}

export interface StoredObject {
  /** Clé complète dans le bucket, ex. "org-1/buildings/plan.pdf". */
  key: string;
}

export interface StorageProvider {
  upload(request: UploadObjectRequest): Promise<StoredObject>;

  /**
   * URL signée à durée limitée — jamais d'objet rendu public par défaut
   * (documents locataire/bail = données personnelles, voir cahier des
   * charges §8 confidentialité).
   */
  getSignedUrl(key: string, expirySeconds: number): Promise<string>;

  delete(key: string): Promise<void>;
}

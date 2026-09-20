/**
 * Nom de room unique pour une organisation — même construction des deux
 * côtés (connexion et diffusion), voir realtime.gateway.ts / realtime.service.ts.
 */
export function organizationRoom(organizationId: string): string {
  return `org:${organizationId}`;
}

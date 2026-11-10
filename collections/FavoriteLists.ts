import type { CollectionConfig, PayloadRequest } from 'payload'

// TYN-13: one client's hearted photos in one gallery. Clients never touch
// this through Payload: they go through /api/favorites/*, which checks the
// gallery's own rules (published, not expired, password) and ties the browser
// to its list with a signed cookie. Tynnell reads lists in the gallery editor.
//
// `photoIds` is plain JSON rather than a relationship: a favorite is only
// ever shown after being checked against the gallery's current photos (see
// visibleFavorites), so a join table would add nothing but a second place to
// go stale.
const signedIn = ({ req }: { req: PayloadRequest }): boolean => Boolean(req.user)

export const FavoriteLists: CollectionConfig = {
  slug: 'favorite-lists',
  labels: { singular: 'Favorites List', plural: 'Favorites Lists' },
  admin: {
    useAsTitle: 'clientEmail',
    hidden: true,
  },
  access: {
    read: signedIn,
    create: signedIn,
    update: signedIn,
    delete: signedIn,
  },
  fields: [
    { name: 'gallery', type: 'relationship', relationTo: 'galleries', required: true, index: true },
    { name: 'clientName', type: 'text' },
    // Stored lower-cased (normalizeEmail), so one person has one list.
    { name: 'clientEmail', type: 'email', required: true, index: true },
    { name: 'photoIds', type: 'json' },
    // Set when the client presses "Send to Tynnell": the time, and a copy of
    // the list as it was, so the next send can say what changed.
    { name: 'sentAt', type: 'date' },
    { name: 'sentPhotoIds', type: 'json' },
  ],
}

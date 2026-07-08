import type { PayloadRequest } from 'payload'

// Shared Payload access-control helper for collections/globals restricted to
// the admin role (Site Config, Booking Settings, Availability, Users
// create/delete). Content collections (Photos, Galleries, Posts,
// Testimonials, Services, Pages) intentionally define no access block - the
// Payload default already requires authentication for every operation, and
// both admin and editor accounts are authenticated, so no change was needed
// there for the editor role to work.
//
// Typed loosely against just `{ req }` (rather than the full `Access` /
// `FieldAccess` types) so the same function satisfies both collection/global
// `access` and field-level `access`, whose `AccessArgs`/`FieldAccessArgs`
// types are otherwise incompatible (differ in the `id` param's type).
export const isAdmin = ({ req }: { req: PayloadRequest }): boolean => req.user?.role === 'admin'

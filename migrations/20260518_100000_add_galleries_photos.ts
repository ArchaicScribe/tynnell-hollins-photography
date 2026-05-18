import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: add_galleries_photos
 *
 * Created for TYN-139: the Gallery.photos field was changed from a hasMany
 * relationship (stored in galleries_rels) to an array field, which Payload's
 * postgres adapter stores in a dedicated galleries_photos junction table.
 * This migration creates that table.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "galleries_photos" (
      "id"         serial  PRIMARY KEY NOT NULL,
      "_order"     integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "photo_id"   integer
    );

    DO $$ BEGIN
      ALTER TABLE "galleries_photos"
        ADD CONSTRAINT "galleries_photos_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "galleries"("id")
        ON DELETE CASCADE
        ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE '%, skipping', SQLERRM USING ERRCODE = SQLSTATE;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "galleries_photos"
        ADD CONSTRAINT "galleries_photos_photo_id_fk"
        FOREIGN KEY ("photo_id")
        REFERENCES "photos"("id")
        ON DELETE SET NULL
        ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE '%, skipping', SQLERRM USING ERRCODE = SQLSTATE;
    END $$;

    CREATE INDEX IF NOT EXISTS "galleries_photos_order_idx"
      ON "galleries_photos" USING btree ("_order");

    CREATE INDEX IF NOT EXISTS "galleries_photos_parent_id_idx"
      ON "galleries_photos" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "galleries_photos_photo_idx"
      ON "galleries_photos" USING btree ("photo_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "galleries_photos";`)
}

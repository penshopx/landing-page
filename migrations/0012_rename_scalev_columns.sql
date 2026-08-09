-- Rename provider-specific column names to provider-agnostic ones in subscriptions_new.
--
-- Two legacy states exist:
--   1. Databases matching the 0011 snapshot: columns are "mayar_order_id" / "mayar_payment_url"
--   2. Databases that had the mayar→scalev rename applied via direct DDL: "scalev_order_id" / "scalev_payment_url"
--   3. Databases that already had this task's DDL applied: "order_id" / "payment_url" (no-op)
--
-- The IF/ELSIF chain handles all three states safely without data loss.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions_new' AND column_name = 'mayar_order_id'
  ) THEN
    ALTER TABLE "subscriptions_new" RENAME COLUMN "mayar_order_id" TO "order_id";
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions_new' AND column_name = 'scalev_order_id'
  ) THEN
    ALTER TABLE "subscriptions_new" RENAME COLUMN "scalev_order_id" TO "order_id";
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions_new' AND column_name = 'mayar_payment_url'
  ) THEN
    ALTER TABLE "subscriptions_new" RENAME COLUMN "mayar_payment_url" TO "payment_url";
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions_new' AND column_name = 'scalev_payment_url'
  ) THEN
    ALTER TABLE "subscriptions_new" RENAME COLUMN "scalev_payment_url" TO "payment_url";
  END IF;
END $$;

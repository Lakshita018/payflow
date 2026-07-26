-- Add type and direction columns to transactions table.
-- type:      ADD_MONEY | TRANSFER  (what kind of operation this record represents)
-- direction: CREDIT | DEBIT        (which side of the ledger this record is from)
-- status stays PENDING | COMPLETED | FAILED (lifecycle of the operation)
--
-- Existing rows produced by the old code stored "ADD_MONEY" in the status column
-- as a de-facto type marker.  We back-fill them correctly here:
--   old status = 'ADD_MONEY'  → type = 'ADD_MONEY',  direction = 'CREDIT',  status = 'COMPLETED'
--   old status = 'COMPLETED'  → type = 'TRANSFER',   direction varies by row (see note below)
--
-- For old COMPLETED rows there is no directional information stored, so we make a
-- conservative choice: mark every COMPLETED row as direction = 'CREDIT'.  These
-- legacy rows were created before proper two-sided ledger entries existed; they
-- will not affect new flows.

ALTER TABLE "transactions"
  ADD COLUMN IF NOT EXISTS "type"      TEXT NOT NULL DEFAULT 'TRANSFER',
  ADD COLUMN IF NOT EXISTS "direction" TEXT NOT NULL DEFAULT 'CREDIT';

-- Back-fill rows that used the old ADD_MONEY status hack
UPDATE "transactions"
SET    "type"      = 'ADD_MONEY',
       "direction" = 'CREDIT',
       "status"    = 'COMPLETED'
WHERE  "status" = 'ADD_MONEY';

-- Any remaining COMPLETED rows are old TRANSFER records – keep defaults (TRANSFER / CREDIT)

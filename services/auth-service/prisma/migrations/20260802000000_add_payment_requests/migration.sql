-- CreateTable: payment_requests
CREATE TABLE "payment_requests" (
    "id"          TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "receiverId"  TEXT NOT NULL,
    "amount"      DECIMAL(18,2) NOT NULL,
    "note"        TEXT,
    "status"      TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt"   TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_requests_receiverId_createdAt_idx" ON "payment_requests"("receiverId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "payment_requests_requesterId_createdAt_idx" ON "payment_requests"("requesterId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_requesterId_fkey"
    FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_receiverId_fkey"
    FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

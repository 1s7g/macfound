-- CreateTable
CREATE TABLE "BannedEmail" (
    "email" TEXT NOT NULL,
    "reason" TEXT,
    "bannedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannedEmail_pkey" PRIMARY KEY ("email")
);

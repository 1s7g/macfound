-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_finderId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_seekerId_fkey";

-- DropIndex
DROP INDEX "Conversation_finderId_idx";

-- DropIndex
DROP INDEX "Conversation_postId_seekerId_key";

-- DropIndex
DROP INDEX "Conversation_seekerId_idx";

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "finderId",
DROP COLUMN "seekerId",
ADD COLUMN     "initiatorId" TEXT NOT NULL,
ADD COLUMN     "postAuthorId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Conversation_postAuthorId_idx" ON "Conversation"("postAuthorId");

-- CreateIndex
CREATE INDEX "Conversation_initiatorId_idx" ON "Conversation"("initiatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_postId_initiatorId_key" ON "Conversation"("postId", "initiatorId");

-- CreateIndex
CREATE INDEX "Message_senderId_readAt_idx" ON "Message"("senderId", "readAt");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_postAuthorId_fkey" FOREIGN KEY ("postAuthorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


/*
  Warnings:

  - You are about to drop the column `contact_id` on the `bills` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `bills` table. All the data in the column will be lost.
  - You are about to drop the `whatsapp_contacts` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `image_path` to the `bills` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "bills" DROP CONSTRAINT "bills_contact_id_fkey";

-- DropForeignKey
ALTER TABLE "whatsapp_contacts" DROP CONSTRAINT "whatsapp_contacts_user_id_fkey";

-- AlterTable
ALTER TABLE "bills" DROP COLUMN "contact_id",
DROP COLUMN "image_url",
ADD COLUMN     "image_path" TEXT NOT NULL;

-- DropTable
DROP TABLE "whatsapp_contacts";

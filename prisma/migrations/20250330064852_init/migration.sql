/*
  Warnings:

  - You are about to drop the column `authorId` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `genreId` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Book` table. All the data in the column will be lost.
  - Added the required column `author_id` to the `Book` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genre_id` to the `Book` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Book` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Book" DROP CONSTRAINT "Book_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Book" DROP CONSTRAINT "Book_genreId_fkey";

-- AlterTable
ALTER TABLE "Book" DROP COLUMN "authorId",
DROP COLUMN "createdAt",
DROP COLUMN "genreId",
DROP COLUMN "updatedAt",
ADD COLUMN     "author_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "genre_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "Genre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

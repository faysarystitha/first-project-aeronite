-- CreateTable
CREATE TABLE "verification" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "otp_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "verification" ADD CONSTRAINT "verification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

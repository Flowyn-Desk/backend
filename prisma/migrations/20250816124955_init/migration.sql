-- CreateEnum
CREATE TYPE "public"."user_role" AS ENUM ('MANAGER', 'ASSOCIATE', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."ticket_severity" AS ENUM ('VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW', 'EASY');

-- CreateEnum
CREATE TYPE "public"."ticket_status" AS ENUM ('DRAFT', 'REVIEW', 'PENDING', 'OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."user_workspace" (
    "userUuid" UUID NOT NULL,
    "workspaceUuid" UUID NOT NULL,

    CONSTRAINT "user_workspace_pkey" PRIMARY KEY ("userUuid","workspaceUuid")
);

-- CreateTable
CREATE TABLE "public"."workspace" (
    "uuid" UUID NOT NULL,
    "workspace_key" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "workspace_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."user" (
    "uuid" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" "public"."user_role" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."ticket" (
    "uuid" UUID NOT NULL,
    "ticket_number" VARCHAR(20) NOT NULL,
    "workspace_uuid" UUID NOT NULL,
    "created_by_uuid" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "public"."ticket_severity" NOT NULL,
    "status" "public"."ticket_status" NOT NULL DEFAULT 'DRAFT',
    "severity_change_reason" TEXT,
    "due_date" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ticket_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."ticket_history" (
    "uuid" UUID NOT NULL,
    "ticket_uuid" UUID NOT NULL,
    "user_uuid" UUID NOT NULL,
    "previous_status" "public"."ticket_status" NOT NULL,
    "new_status" "public"."ticket_status" NOT NULL,
    "previous_severity" "public"."ticket_severity",
    "new_severity" "public"."ticket_severity",
    "change_reason" TEXT,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "previous_title" TEXT,
    "new_title" TEXT,
    "previous_description" TEXT,
    "new_description" TEXT,

    CONSTRAINT "ticket_history_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_workspace_key_key" ON "public"."workspace"("workspace_key");

-- CreateIndex
CREATE INDEX "workspace_workspace_key_idx" ON "public"."workspace"("workspace_key");

-- CreateIndex
CREATE INDEX "workspace_created_by_idx" ON "public"."workspace"("created_by");

-- CreateIndex
CREATE INDEX "workspace_active_idx" ON "public"."workspace"("active");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "public"."user"("email");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "public"."user"("role");

-- CreateIndex
CREATE INDEX "user_active_idx" ON "public"."user"("active");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_ticket_number_key" ON "public"."ticket"("ticket_number");

-- CreateIndex
CREATE INDEX "ticket_ticket_number_idx" ON "public"."ticket"("ticket_number");

-- CreateIndex
CREATE INDEX "ticket_ticket_number_desc_idx" ON "public"."ticket"("ticket_number" DESC);

-- CreateIndex
CREATE INDEX "ticket_workspace_uuid_idx" ON "public"."ticket"("workspace_uuid");

-- CreateIndex
CREATE INDEX "ticket_created_by_uuid_idx" ON "public"."ticket"("created_by_uuid");

-- CreateIndex
CREATE INDEX "ticket_status_idx" ON "public"."ticket"("status");

-- CreateIndex
CREATE INDEX "ticket_severity_idx" ON "public"."ticket"("severity");

-- CreateIndex
CREATE INDEX "ticket_due_date_idx" ON "public"."ticket"("due_date");

-- CreateIndex
CREATE INDEX "ticket_active_idx" ON "public"."ticket"("active");

-- CreateIndex
CREATE INDEX "ticket_created_at_idx" ON "public"."ticket"("created_at");

-- CreateIndex
CREATE INDEX "ticket_history_ticket_uuid_idx" ON "public"."ticket_history"("ticket_uuid");

-- CreateIndex
CREATE INDEX "ticket_history_user_uuid_idx" ON "public"."ticket_history"("user_uuid");

-- CreateIndex
CREATE INDEX "ticket_history_timestamp_idx" ON "public"."ticket_history"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "ticket_history_new_status_idx" ON "public"."ticket_history"("new_status");

-- CreateIndex
CREATE INDEX "ticket_history_active_idx" ON "public"."ticket_history"("active");

-- AddForeignKey
ALTER TABLE "public"."user_workspace" ADD CONSTRAINT "user_workspace_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "public"."user"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_workspace" ADD CONSTRAINT "user_workspace_workspaceUuid_fkey" FOREIGN KEY ("workspaceUuid") REFERENCES "public"."workspace"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace" ADD CONSTRAINT "workspace_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ticket" ADD CONSTRAINT "ticket_workspace_uuid_fkey" FOREIGN KEY ("workspace_uuid") REFERENCES "public"."workspace"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ticket" ADD CONSTRAINT "ticket_created_by_uuid_fkey" FOREIGN KEY ("created_by_uuid") REFERENCES "public"."user"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ticket_history" ADD CONSTRAINT "ticket_history_ticket_uuid_fkey" FOREIGN KEY ("ticket_uuid") REFERENCES "public"."ticket"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ticket_history" ADD CONSTRAINT "ticket_history_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "public"."user"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

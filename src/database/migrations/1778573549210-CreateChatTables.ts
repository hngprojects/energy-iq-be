import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatTables1778573549210 implements MigrationInterface {
  name = 'CreateChatTables1778573549210';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "context_length" integer, "expiration_timeout_seconds" integer, "is_active" boolean NOT NULL DEFAULT true, "is_archived" boolean NOT NULL DEFAULT false, "last_message_timestamp" TIMESTAMP WITH TIME ZONE, "last_message_preview" character varying(200), "room_id" character varying(50), "user_id" uuid NOT NULL, CONSTRAINT "PK_0117647b3c4a4e5ff198aeb6206" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "content" text NOT NULL DEFAULT '', "content_type" character varying(40) NOT NULL, "delivery_status" character varying(40) NOT NULL, "is_transitioning" boolean NOT NULL DEFAULT false, "sender_id" character varying(50) NOT NULL, "chat_id" uuid, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_28ae56bc5bbfbab9a6b3210464"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."inverters_brand_enum" RENAME TO "inverters_brand_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inverters_brand_enum" AS ENUM('VICTRON', 'GROWATT', 'SUNSYNK')`,
    );
    await queryRunner.query(
      `ALTER TABLE "inverters" ALTER COLUMN "brand" TYPE "public"."inverters_brand_enum" USING "brand"::"text"::"public"."inverters_brand_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."inverters_brand_enum_old"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_28ae56bc5bbfbab9a6b3210464" ON "inverters" ("brand", "serial_number") `,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_7540635fef1922f0b156b9ef74f" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_7540635fef1922f0b156b9ef74f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_28ae56bc5bbfbab9a6b3210464"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inverters_brand_enum_old" AS ENUM('VICTRON', 'GROWATT', 'DEYE', 'SUNSYNK')`,
    );
    await queryRunner.query(
      `ALTER TABLE "inverters" ALTER COLUMN "brand" TYPE "public"."inverters_brand_enum_old" USING "brand"::"text"::"public"."inverters_brand_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."inverters_brand_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."inverters_brand_enum_old" RENAME TO "inverters_brand_enum"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_28ae56bc5bbfbab9a6b3210464" ON "inverters" ("brand", "serial_number") `,
    );
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "chats"`);
  }
}

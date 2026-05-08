import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1778239351612 implements MigrationInterface {
  name = 'CreateUserTable1778239351612';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "first_name" character varying(255) NOT NULL, "last_name" character varying(255) NOT NULL, "google_id" character varying(255), "email_verified" boolean DEFAULT false, "inverter_brand" character varying(30), "onboarding_step" smallint, "onboarding_complete" boolean, "is_active" boolean DEFAULT false, "last_login_at" TIMESTAMP WITH TIME ZONE, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "refresh_token_hash" character varying(500), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
  }
}

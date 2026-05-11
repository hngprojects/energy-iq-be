import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInverterAndInverterMetricsTable1778478328943 implements MigrationInterface {
  name = 'CreateInverterAndInverterMetricsTable1778478328943';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."inverters_brand_enum" AS ENUM('VICTRON', 'GROWATT', 'DEYE', 'SUNSYNK')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inverters_api_type_enum" AS ENUM('LIVE_API')`,
    );
    await queryRunner.query(
      `CREATE TABLE "inverters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "brand" "public"."inverters_brand_enum" NOT NULL, "model" character varying(255) NOT NULL, "serial_number" character varying(255) NOT NULL, "installation_id" character varying(255), "api_type" "public"."inverters_api_type_enum" NOT NULL, "encrypted_credentials" text, "is_active" boolean NOT NULL DEFAULT true, "last_synced_at" TIMESTAMP WITH TIME ZONE, "rated_capacity_kwh" numeric(10,2) NOT NULL DEFAULT '0', "panel_capacity_kw" numeric(5,2) NOT NULL DEFAULT '0', CONSTRAINT "UQ_8dc023670abc3138875327fea42" UNIQUE ("serial_number"), CONSTRAINT "PK_256e52026f45115fde7fb14e2fc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_28ae56bc5bbfbab9a6b3210464" ON "inverters" ("brand", "serial_number") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_233e641a7c5306e9aa24a82aa3" ON "inverters" ("user_id", "is_active") `,
    );
    await queryRunner.query(
      `CREATE TABLE "inverter_metrics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "inverter_id" uuid NOT NULL, "solar_gen_kw" numeric(10,2) NOT NULL, "battery_soc_percent" numeric(5,2) NOT NULL, "load_kw" numeric(10,2) NOT NULL, "grid_frequency_hz" numeric(5,2), "battery_voltage_v" numeric(10,2), "battery_current_a" numeric(10,2), "grid_voltage_v" numeric(10,2), "naira_saved_ngn" numeric(15,2) NOT NULL DEFAULT '0', "daily_energy_kwh" numeric(10,2), "raw_data" jsonb, "metric_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_9859fcbfdef784c173ee75a6934" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dd3bcf8fdc5f345eda1e7671d4" ON "inverter_metrics" ("inverter_id", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "inverters" ADD CONSTRAINT "FK_7e7dc9572076d05e7599f5fc4ae" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inverter_metrics" ADD CONSTRAINT "FK_cd66337ed18480287071464ab23" FOREIGN KEY ("inverter_id") REFERENCES "inverters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inverter_metrics" DROP CONSTRAINT "FK_cd66337ed18480287071464ab23"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inverters" DROP CONSTRAINT "FK_7e7dc9572076d05e7599f5fc4ae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dd3bcf8fdc5f345eda1e7671d4"`,
    );
    await queryRunner.query(`DROP TABLE "inverter_metrics"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_233e641a7c5306e9aa24a82aa3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_28ae56bc5bbfbab9a6b3210464"`,
    );
    await queryRunner.query(`DROP TABLE "inverters"`);
    await queryRunner.query(`DROP TYPE "public"."inverters_api_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."inverters_brand_enum"`);
  }
}

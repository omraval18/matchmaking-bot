CREATE TABLE "preferences" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "preferences_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"ageMin" integer,
	"ageMax" integer,
	"heightMin" varchar,
	"heightMax" varchar,
	"education" varchar,
	"occupation" varchar,
	"city" varchar,
	"citizenship" varchar,
	"caste" varchar,
	"diet" varchar,
	"other_preferences" jsonb DEFAULT '{}'::jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "preferences_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "bios" ADD COLUMN "gender" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
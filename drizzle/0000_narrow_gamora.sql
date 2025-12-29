CREATE TABLE "bios" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bios_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"firstName" varchar NOT NULL,
	"lastName" varchar NOT NULL,
	"gender" varchar NOT NULL,
	"age" integer NOT NULL,
	"dateOfBirth" date NOT NULL,
	"city" varchar NOT NULL,
	"caste" varchar NOT NULL,
	"currentCity" varchar,
	"citizenship" varchar NOT NULL,
	"education" varchar NOT NULL,
	"educationLevel" integer NOT NULL,
	"occupation" varchar NOT NULL,
	"company" varchar,
	"height" varchar NOT NULL,
	"heightCm" integer NOT NULL,
	"diet" varchar,
	"extra" jsonb DEFAULT '{}'::jsonb,
	"url" varchar NOT NULL,
	CONSTRAINT "bios_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "conversation_states" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "conversation_states_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"phone" varchar NOT NULL,
	"flow" varchar NOT NULL,
	"step" varchar NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_states_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "last_messages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "last_messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"message" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "last_messages_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "preferences" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "preferences_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"ageMin" integer,
	"ageMax" integer,
	"heightMinCm" integer,
	"heightMaxCm" integer,
	"educationLevel" integer,
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
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"isAdmin" boolean DEFAULT false NOT NULL,
	"phone" varchar NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "bios" ADD CONSTRAINT "bios_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "last_messages" ADD CONSTRAINT "last_messages_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
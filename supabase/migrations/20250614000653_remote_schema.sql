

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."ensure_company_has_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF OLD.role = 'owner' THEN
        -- Check if there's another owner
        IF NOT EXISTS (
            SELECT 1 FROM company_members 
            WHERE company_id = OLD.company_id 
            AND user_id != OLD.user_id 
            AND role = 'owner'
        ) THEN
            RAISE EXCEPTION 'Cannot remove the last owner of a company';
        END IF;
    END IF;
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."ensure_company_has_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_data"("p_user_id" "uuid", "p_company_id" "uuid" DEFAULT NULL::"uuid", "p_workspace_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result jsonb;
    v_companies jsonb;
    v_workspaces jsonb;
    v_environments jsonb;
    v_recent_diagrams jsonb;
    v_active_company_id uuid;
    v_active_workspace_id uuid;
BEGIN
    -- Determine active company and workspace
    v_active_company_id := p_company_id;
    v_active_workspace_id := p_workspace_id;
    
    -- If no workspace provided, get user's active workspace
    IF v_active_workspace_id IS NULL THEN
        SELECT workspace_id INTO v_active_workspace_id
        FROM workspace_members
        WHERE user_id = p_user_id AND is_active = true
        LIMIT 1;
    END IF;
    
    -- If we have a workspace, get its company
    IF v_active_workspace_id IS NOT NULL AND v_active_company_id IS NULL THEN
        SELECT company_id INTO v_active_company_id
        FROM workspaces
        WHERE id = v_active_workspace_id;
    END IF;
    
    -- Get all companies where user is a member, INCLUDING role and memberCount
    SELECT jsonb_agg(company_data ORDER BY company_data->>'created_at')
    INTO v_companies
    FROM (
        SELECT DISTINCT ON (c.id) jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug,
            'description', c.description,
            'logo_url', c.logo_url,
            'owner_id', c.owner_id,
            'settings', c.settings,
            'created_at', c.created_at,
            'updated_at', c.updated_at,
            '_id', c.id,  -- Para compatibilidad con el frontend
            -- Obtener el rol del usuario en esta compañía
            'role', (
                SELECT r.name
                FROM workspace_members wm
                JOIN workspaces w ON wm.workspace_id = w.id
                JOIN roles r ON wm.role_id = r.id
                WHERE wm.user_id = p_user_id 
                AND w.company_id = c.id
                AND wm.is_active = true
                ORDER BY 
                    CASE r.name 
                        WHEN 'owner' THEN 1
                        WHEN 'admin' THEN 2
                        ELSE 3
                    END
                LIMIT 1
            ),
            -- Contar miembros activos en todos los workspaces de la compañía
            'memberCount', (
                SELECT COUNT(DISTINCT wm.user_id)::int
                FROM workspace_members wm
                JOIN workspaces w ON wm.workspace_id = w.id
                WHERE w.company_id = c.id
                AND wm.is_active = true
            )
        ) as company_data
        FROM companies c
        WHERE c.id IN (
            SELECT DISTINCT w.company_id
            FROM workspace_members wm
            JOIN workspaces w ON wm.workspace_id = w.id
            WHERE wm.user_id = p_user_id
        )
    ) companies_subquery;
    
    -- Get workspaces for the active company
    IF v_active_company_id IS NOT NULL THEN
        SELECT jsonb_agg(workspace_data ORDER BY workspace_data->>'created_at' ASC)
        INTO v_workspaces
        FROM (
            SELECT jsonb_build_object(
                'id', w.id,
                'company_id', w.company_id,
                'name', w.name,
                'slug', w.slug,
                'description', w.description,
                'settings', w.settings,
                'is_default', w.is_default,
                'created_at', w.created_at,
                'updated_at', w.updated_at
            ) as workspace_data
            FROM workspaces w
            WHERE w.company_id = v_active_company_id
        ) workspaces_subquery;
    ELSE
        v_workspaces := '[]'::jsonb;
    END IF;
    
    -- Get environments for the active workspace
    IF v_active_workspace_id IS NOT NULL THEN
        SELECT jsonb_agg(env_data ORDER BY (env_data->>'order_index')::int ASC)
        INTO v_environments
        FROM (
            SELECT jsonb_build_object(
                'id', e.id,
                'workspace_id', e.workspace_id,
                'name', e.name,
                'slug', e.slug,
                'description', e.description,
                'color', e.color,
                'icon', e.icon,
                'order_index', e.order_index,
                'created_at', e.created_at,
                'updated_at', e.updated_at
            ) as env_data
            FROM environments e
            WHERE e.workspace_id = v_active_workspace_id
        ) environments_subquery;
        
        -- Get recent diagrams
        SELECT jsonb_agg(diagram_data ORDER BY diagram_data->>'updated_at' DESC)
        INTO v_recent_diagrams
        FROM (
            SELECT jsonb_build_object(
                'id', d.id,
                'workspace_id', d.workspace_id,
                'environment_id', d.environment_id,
                'name', d.name,
                'description', d.description,
                'path', d.path,
                'nodes', d.nodes,
                'edges', d.edges,
                'viewport', d.viewport,
                'groups', d.groups,
                'tags', d.tags,
                'is_template', d.is_template,
                'template_category', d.template_category,
                'version', d.version,
                'parent_version_id', d.parent_version_id,
                'created_by', d.created_by,
                'updated_by', d.updated_by,
                'created_at', d.created_at,
                'updated_at', d.updated_at
            ) as diagram_data
            FROM diagrams d
            WHERE d.workspace_id = v_active_workspace_id
            ORDER BY d.updated_at DESC
            LIMIT 10
        ) diagrams_subquery;
    ELSE
        v_environments := '[]'::jsonb;
        v_recent_diagrams := '[]'::jsonb;
    END IF;
    
    -- Build final result
    v_result := jsonb_build_object(
        'companies', COALESCE(v_companies, '[]'::jsonb),
        'workspaces', COALESCE(v_workspaces, '[]'::jsonb),
        'environments', COALESCE(v_environments, '[]'::jsonb),
        'recent_diagrams', COALESCE(v_recent_diagrams, '[]'::jsonb),
        'active_company_id', v_active_company_id,
        'active_workspace_id', v_active_workspace_id
    );
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_data"("p_user_id" "uuid", "p_company_id" "uuid", "p_workspace_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_dashboard_data"("p_user_id" "uuid", "p_company_id" "uuid", "p_workspace_id" "uuid") IS 'Optimized function to get all dashboard data INCLUDING role and memberCount for each company';



CREATE OR REPLACE FUNCTION "public"."get_user_full_data"("p_user_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Por ahora, devolver un objeto simple con permissions vacías
    -- para evitar el error de validación
    SELECT json_build_object(
        'workspace_id', NULL,
        'company_id', NULL,
        'permissions', ARRAY[]::TEXT[]  -- Array vacío, nunca NULL
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_user_full_data"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Insertar en user_profiles con valores por defecto
    INSERT INTO public.user_profiles (
        id,
        email,
        display_name,
        usage_type,
        onboarding_completed,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'personal',
        false,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Si hay cualquier error, loguear pero NO fallar
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_permission"("p_user_id" "uuid", "p_workspace_id" "uuid", "p_permission" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_has_permission boolean;
BEGIN
    -- Verificar si el usuario tiene el permiso en el workspace
    SELECT EXISTS (
        SELECT 1
        FROM workspace_members wm
        JOIN roles r ON wm.role_id = r.id
        WHERE wm.user_id = p_user_id
        AND wm.workspace_id = p_workspace_id
        AND wm.is_active = true
        AND (
            r.permissions ? p_permission
            OR r.permissions ? '*'  -- Superadmin
        )
    ) INTO v_has_permission;
    
    RETURN COALESCE(v_has_permission, false);
END;
$$;


ALTER FUNCTION "public"."user_has_permission"("p_user_id" "uuid", "p_workspace_id" "uuid", "p_permission" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid",
    "user_id" "uuid",
    "action" character varying(100) NOT NULL,
    "resource_type" character varying(50) NOT NULL,
    "resource_id" character varying(100),
    "resource_name" character varying(255),
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "description" "text",
    "website" character varying(255),
    "logo_url" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "owner_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true,
    "subscription_tier" character varying(50) DEFAULT 'free'::character varying,
    "subscription_expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_invitations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid",
    "email" character varying(255) NOT NULL,
    "role" character varying(50) NOT NULL,
    "invited_by" "uuid",
    "token" character varying(255) DEFAULT ("extensions"."uuid_generate_v4"())::"text",
    "expires_at" timestamp with time zone DEFAULT ("timezone"('utc'::"text", "now"()) + '7 days'::interval),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "company_invitations_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['admin'::character varying, 'member'::character varying])::"text"[])))
);


ALTER TABLE "public"."company_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_members" (
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" character varying(50) NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "company_members_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['owner'::character varying, 'admin'::character varying, 'member'::character varying])::"text"[])))
);


ALTER TABLE "public"."company_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credentials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "provider" character varying(50) NOT NULL,
    "credential_type" character varying(50) NOT NULL,
    "encrypted_data" "text" NOT NULL,
    "encryption_key_id" character varying(100),
    "description" "text",
    "is_active" boolean DEFAULT true,
    "last_used_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."credentials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deployment_apps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "display_name" character varying(255) NOT NULL,
    "description" "text",
    "app_type" character varying(20) NOT NULL,
    "repository" "jsonb" NOT NULL,
    "build_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "runtime_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "deployments" "jsonb" DEFAULT '{}'::"jsonb",
    "env_vars" "jsonb" DEFAULT '[]'::"jsonb",
    "resource_bindings" "jsonb" DEFAULT '[]'::"jsonb",
    "monitoring_config" "jsonb" DEFAULT '{}'::"jsonb",
    "deployment_rules" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "is_active" boolean DEFAULT true,
    "total_deployments" integer DEFAULT 0,
    "successful_deployments" integer DEFAULT 0,
    "last_deployment_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."deployment_apps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deployment_artifacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "run_id" "uuid" NOT NULL,
    "artifact_type" character varying(20) NOT NULL,
    "name" character varying(255) NOT NULL,
    "size_bytes" bigint NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "storage_url" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."deployment_artifacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deployment_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "run_id" "uuid" NOT NULL,
    "step_id" "uuid",
    "timestamp" timestamp with time zone NOT NULL,
    "level" character varying(20) NOT NULL,
    "message" "text" NOT NULL,
    "searchable_text" "text",
    "service" character varying(100),
    "container_id" character varying(100),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."deployment_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deployment_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_id" "uuid" NOT NULL,
    "environment" character varying(50) NOT NULL,
    "trigger_type" character varying(50) NOT NULL,
    "triggered_by" "uuid" NOT NULL,
    "parent_run_id" "uuid",
    "git_info" "jsonb" NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "total_duration_seconds" integer,
    "build_info" "jsonb",
    "build_logs_url" "text",
    "deploy_info" "jsonb",
    "deploy_logs_url" "text",
    "deployment_config" "jsonb" NOT NULL,
    "health_check_status" character varying(50),
    "health_check_details" "jsonb",
    "error_message" "text",
    "error_details" "jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."deployment_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deployment_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "run_id" "uuid" NOT NULL,
    "step_index" integer NOT NULL,
    "step_name" character varying(255) NOT NULL,
    "step_type" character varying(50) NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "duration_seconds" integer,
    "command" "text",
    "exit_code" integer,
    "logs_url" "text",
    "output_summary" "text",
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."deployment_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diagrams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "environment_id" "uuid",
    "name" character varying(255) NOT NULL,
    "description" "text",
    "path" character varying(500),
    "nodes" "jsonb" DEFAULT '[]'::"jsonb",
    "edges" "jsonb" DEFAULT '[]'::"jsonb",
    "viewport" "jsonb" DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::"jsonb",
    "groups" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "is_template" boolean DEFAULT false,
    "template_category" character varying(100),
    "version" integer DEFAULT 1,
    "parent_version_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."diagrams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."environments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "description" "text",
    "color" character varying(7),
    "icon" character varying(50),
    "order_index" integer DEFAULT 0,
    "is_production" boolean DEFAULT false,
    "requires_approval" boolean DEFAULT false,
    "auto_deploy_enabled" boolean DEFAULT false,
    "cloud_accounts" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."environments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" character varying(255),
    "avatar_url" "text",
    "usage_type" character varying(50),
    "infrastructure_experience" character varying(50),
    "company_size" character varying(50),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text",
    "permissions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_system" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "display_name" character varying(255),
    "avatar_url" "text",
    "usage_type" character varying(50),
    "infrastructure_experience" character varying(50),
    "company_size" character varying(50),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "onboarding_completed" boolean DEFAULT false,
    "phone" character varying(50),
    "onboarding_step" integer DEFAULT 0,
    "last_login_at" timestamp with time zone,
    "email" character varying(255) NOT NULL,
    "first_company_created" boolean DEFAULT false
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "custom_permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "invited_by" "uuid",
    "invited_at" timestamp with time zone,
    "joined_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."workspace_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "description" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."workspaces" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."company_invitations"
    ADD CONSTRAINT "company_invitations_company_id_email_key" UNIQUE ("company_id", "email");



ALTER TABLE ONLY "public"."company_invitations"
    ADD CONSTRAINT "company_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_invitations"
    ADD CONSTRAINT "company_invitations_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."company_members"
    ADD CONSTRAINT "company_members_pkey" PRIMARY KEY ("company_id", "user_id");



ALTER TABLE ONLY "public"."credentials"
    ADD CONSTRAINT "credentials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deployment_apps"
    ADD CONSTRAINT "deployment_apps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deployment_artifacts"
    ADD CONSTRAINT "deployment_artifacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deployment_logs"
    ADD CONSTRAINT "deployment_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deployment_runs"
    ADD CONSTRAINT "deployment_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deployment_steps"
    ADD CONSTRAINT "deployment_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diagrams"
    ADD CONSTRAINT "diagrams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."environments"
    ADD CONSTRAINT "environments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deployment_apps"
    ADD CONSTRAINT "unique_app_name" UNIQUE ("workspace_id", "name");



ALTER TABLE ONLY "public"."credentials"
    ADD CONSTRAINT "unique_credential_name" UNIQUE ("workspace_id", "name");



ALTER TABLE ONLY "public"."environments"
    ADD CONSTRAINT "unique_environment_slug" UNIQUE ("workspace_id", "slug");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "unique_workspace_member" UNIQUE ("workspace_id", "user_id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "unique_workspace_slug" UNIQUE ("company_id", "slug");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activity_logs_created_at" ON "public"."activity_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_activity_logs_user" ON "public"."activity_logs" USING "btree" ("user_id");



CREATE INDEX "idx_activity_logs_workspace" ON "public"."activity_logs" USING "btree" ("workspace_id");



CREATE INDEX "idx_auth_lookup" ON "public"."workspace_members" USING "btree" ("user_id", "workspace_id", "role_id") INCLUDE ("is_active");



CREATE INDEX "idx_companies_id" ON "public"."companies" USING "btree" ("id");



CREATE INDEX "idx_companies_owner" ON "public"."companies" USING "btree" ("owner_id");



CREATE INDEX "idx_companies_slug" ON "public"."companies" USING "btree" ("slug");



CREATE INDEX "idx_company_invitations_email" ON "public"."company_invitations" USING "btree" ("email");



CREATE INDEX "idx_company_invitations_token" ON "public"."company_invitations" USING "btree" ("token");



CREATE INDEX "idx_company_members_company_id" ON "public"."company_members" USING "btree" ("company_id");



CREATE INDEX "idx_company_members_user_id" ON "public"."company_members" USING "btree" ("user_id");



CREATE INDEX "idx_credentials_provider" ON "public"."credentials" USING "btree" ("provider");



CREATE INDEX "idx_credentials_workspace" ON "public"."credentials" USING "btree" ("workspace_id");



CREATE INDEX "idx_deployment_apps_name" ON "public"."deployment_apps" USING "btree" ("name");



CREATE INDEX "idx_deployment_apps_workspace" ON "public"."deployment_apps" USING "btree" ("workspace_id");



CREATE INDEX "idx_deployment_artifacts_run_id" ON "public"."deployment_artifacts" USING "btree" ("run_id");



CREATE INDEX "idx_deployment_artifacts_type" ON "public"."deployment_artifacts" USING "btree" ("artifact_type");



CREATE INDEX "idx_deployment_logs_run_id" ON "public"."deployment_logs" USING "btree" ("run_id");



CREATE INDEX "idx_deployment_logs_timestamp" ON "public"."deployment_logs" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_deployment_runs_app_id" ON "public"."deployment_runs" USING "btree" ("app_id");



CREATE INDEX "idx_deployment_runs_created_at" ON "public"."deployment_runs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_deployment_runs_status" ON "public"."deployment_runs" USING "btree" ("status");



CREATE INDEX "idx_deployment_steps_run_id" ON "public"."deployment_steps" USING "btree" ("run_id");



CREATE INDEX "idx_diagrams_created_by" ON "public"."diagrams" USING "btree" ("created_by");



CREATE INDEX "idx_diagrams_environment" ON "public"."diagrams" USING "btree" ("environment_id");



CREATE INDEX "idx_diagrams_id" ON "public"."diagrams" USING "btree" ("id") INCLUDE ("workspace_id", "environment_id", "name", "nodes", "edges", "viewport");



CREATE INDEX "idx_diagrams_path" ON "public"."diagrams" USING "btree" ("path");



CREATE INDEX "idx_diagrams_workspace" ON "public"."diagrams" USING "btree" ("workspace_id");



CREATE INDEX "idx_diagrams_workspace_env" ON "public"."diagrams" USING "btree" ("workspace_id", "environment_id", "updated_at" DESC);



CREATE INDEX "idx_environments_workspace" ON "public"."environments" USING "btree" ("workspace_id");



CREATE INDEX "idx_profiles_id" ON "public"."profiles" USING "btree" ("id");



CREATE INDEX "idx_roles_id" ON "public"."roles" USING "btree" ("id");



CREATE INDEX "idx_user_profiles_id" ON "public"."user_profiles" USING "btree" ("id");



CREATE INDEX "idx_workspace_members_user" ON "public"."workspace_members" USING "btree" ("user_id");



CREATE INDEX "idx_workspace_members_user_active" ON "public"."workspace_members" USING "btree" ("user_id", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_workspace_members_workspace" ON "public"."workspace_members" USING "btree" ("workspace_id");



CREATE INDEX "idx_workspaces_company" ON "public"."workspaces" USING "btree" ("company_id");



CREATE INDEX "idx_workspaces_slug" ON "public"."workspaces" USING "btree" ("slug");



CREATE OR REPLACE TRIGGER "ensure_company_owner_trigger" BEFORE DELETE OR UPDATE ON "public"."company_members" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_company_has_owner"();



CREATE OR REPLACE TRIGGER "update_companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_credentials_updated_at" BEFORE UPDATE ON "public"."credentials" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_deployment_apps_updated_at" BEFORE UPDATE ON "public"."deployment_apps" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_deployment_runs_updated_at" BEFORE UPDATE ON "public"."deployment_runs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_diagrams_updated_at" BEFORE UPDATE ON "public"."diagrams" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_environments_updated_at" BEFORE UPDATE ON "public"."environments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_workspaces_updated_at" BEFORE UPDATE ON "public"."workspaces" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."company_invitations"
    ADD CONSTRAINT "company_invitations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_invitations"
    ADD CONSTRAINT "company_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."company_members"
    ADD CONSTRAINT "company_members_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_members"
    ADD CONSTRAINT "company_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credentials"
    ADD CONSTRAINT "credentials_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."credentials"
    ADD CONSTRAINT "credentials_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deployment_apps"
    ADD CONSTRAINT "deployment_apps_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."deployment_apps"
    ADD CONSTRAINT "deployment_apps_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deployment_logs"
    ADD CONSTRAINT "deployment_logs_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."deployment_runs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deployment_logs"
    ADD CONSTRAINT "deployment_logs_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."deployment_steps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deployment_runs"
    ADD CONSTRAINT "deployment_runs_parent_run_id_fkey" FOREIGN KEY ("parent_run_id") REFERENCES "public"."deployment_runs"("id");



ALTER TABLE ONLY "public"."deployment_runs"
    ADD CONSTRAINT "deployment_runs_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."deployment_steps"
    ADD CONSTRAINT "deployment_steps_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."deployment_runs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diagrams"
    ADD CONSTRAINT "diagrams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."diagrams"
    ADD CONSTRAINT "diagrams_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "public"."environments"("id");



ALTER TABLE ONLY "public"."diagrams"
    ADD CONSTRAINT "diagrams_parent_version_id_fkey" FOREIGN KEY ("parent_version_id") REFERENCES "public"."diagrams"("id");



ALTER TABLE ONLY "public"."diagrams"
    ADD CONSTRAINT "diagrams_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."diagrams"
    ADD CONSTRAINT "diagrams_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."environments"
    ADD CONSTRAINT "environments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



CREATE POLICY "Owners and admins can add members" ON "public"."company_members" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."company_members" "cm"
  WHERE (("cm"."company_id" = "company_members"."company_id") AND ("cm"."user_id" = "auth"."uid"()) AND (("cm"."role")::"text" = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::"text"[]))))));



CREATE POLICY "Owners can update companies" ON "public"."companies" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."company_members"
  WHERE (("company_members"."company_id" = "companies"."id") AND ("company_members"."user_id" = "auth"."uid"()) AND (("company_members"."role")::"text" = 'owner'::"text")))));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."user_profiles" FOR SELECT USING (true);



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view company members" ON "public"."company_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."company_members" "cm"
  WHERE (("cm"."company_id" = "company_members"."company_id") AND ("cm"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their companies" ON "public"."companies" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."company_members"
  WHERE (("company_members"."company_id" = "companies"."id") AND ("company_members"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."deployment_artifacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."ensure_company_has_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_company_has_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_company_has_owner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_data"("p_user_id" "uuid", "p_company_id" "uuid", "p_workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_data"("p_user_id" "uuid", "p_company_id" "uuid", "p_workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_data"("p_user_id" "uuid", "p_company_id" "uuid", "p_workspace_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_full_data"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_full_data"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_full_data"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_permission"("p_user_id" "uuid", "p_workspace_id" "uuid", "p_permission" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_permission"("p_user_id" "uuid", "p_workspace_id" "uuid", "p_permission" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_permission"("p_user_id" "uuid", "p_workspace_id" "uuid", "p_permission" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."company_invitations" TO "anon";
GRANT ALL ON TABLE "public"."company_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."company_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."company_members" TO "anon";
GRANT ALL ON TABLE "public"."company_members" TO "authenticated";
GRANT ALL ON TABLE "public"."company_members" TO "service_role";



GRANT ALL ON TABLE "public"."credentials" TO "anon";
GRANT ALL ON TABLE "public"."credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."credentials" TO "service_role";



GRANT ALL ON TABLE "public"."deployment_apps" TO "anon";
GRANT ALL ON TABLE "public"."deployment_apps" TO "authenticated";
GRANT ALL ON TABLE "public"."deployment_apps" TO "service_role";



GRANT ALL ON TABLE "public"."deployment_artifacts" TO "anon";
GRANT ALL ON TABLE "public"."deployment_artifacts" TO "authenticated";
GRANT ALL ON TABLE "public"."deployment_artifacts" TO "service_role";



GRANT ALL ON TABLE "public"."deployment_logs" TO "anon";
GRANT ALL ON TABLE "public"."deployment_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."deployment_logs" TO "service_role";



GRANT ALL ON TABLE "public"."deployment_runs" TO "anon";
GRANT ALL ON TABLE "public"."deployment_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."deployment_runs" TO "service_role";



GRANT ALL ON TABLE "public"."deployment_steps" TO "anon";
GRANT ALL ON TABLE "public"."deployment_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."deployment_steps" TO "service_role";



GRANT ALL ON TABLE "public"."diagrams" TO "anon";
GRANT ALL ON TABLE "public"."diagrams" TO "authenticated";
GRANT ALL ON TABLE "public"."diagrams" TO "service_role";



GRANT ALL ON TABLE "public"."environments" TO "anon";
GRANT ALL ON TABLE "public"."environments" TO "authenticated";
GRANT ALL ON TABLE "public"."environments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_members" TO "anon";
GRANT ALL ON TABLE "public"."workspace_members" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_members" TO "service_role";



GRANT ALL ON TABLE "public"."workspaces" TO "anon";
GRANT ALL ON TABLE "public"."workspaces" TO "authenticated";
GRANT ALL ON TABLE "public"."workspaces" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;

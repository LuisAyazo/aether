#!/usr/bin/env node

/**
 * Script para configurar usuarios de prueba en Supabase
 * Ejecutar con: npx ts-node __tests__/e2e/scripts/setup-test-users.ts
 */

import { createClient } from '@supabase/supabase-js';
import { testUsers } from '../fixtures/users.fixtures';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno de test
dotenv.config({ path: path.resolve(__dirname, '../../../.env.test') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Necesitas la service key para crear usuarios

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser(user: typeof testUsers[keyof typeof testUsers]) {
  try {
    console.log(`📝 Creando usuario: ${user.email}`);
    
    // Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // Auto-confirmar email para tests
      user_metadata: {
        name: user.name
      }
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        console.log(`⚠️  Usuario ${user.email} ya existe`);
        return;
      }
      throw authError;
    }

    const userId = authData.user?.id;
    if (!userId) throw new Error('No se pudo obtener el ID del usuario');

    // Crear perfil de usuario
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email: user.email,
        name: user.name,
        onboarding_completed: user.onboardingCompleted || false,
        first_company_created: user.firstCompanyCreated || false,
        usage_type: user.type === 'new' ? null : 'company'
      });

    if (profileError) {
      console.error(`❌ Error creando perfil para ${user.email}:`, profileError);
      throw profileError;
    }

    // Si el usuario tiene una empresa, crearla
    if (user.companyName && user.type !== 'new') {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: user.companyName,
          slug: user.companyName.toLowerCase().replace(/\s+/g, '-')
        })
        .select()
        .single();

      if (companyError) {
        console.error(`❌ Error creando empresa para ${user.email}:`, companyError);
      } else if (companyData) {
        // Agregar usuario como miembro de la empresa
        const role = user.type === 'admin' ? 'owner' : user.type === 'invited' ? 'member' : 'owner';
        
        await supabase
          .from('company_members')
          .insert({
            company_id: companyData.id,
            user_id: userId,
            role: role
          });

        // Crear workspace por defecto
        const { data: workspaceData } = await supabase
          .from('workspaces')
          .insert({
            company_id: companyData.id,
            name: 'Main Workspace',
            is_default: true
          })
          .select()
          .single();

        if (workspaceData) {
          // Agregar usuario al workspace
          await supabase
            .from('workspace_members')
            .insert({
              workspace_id: workspaceData.id,
              user_id: userId,
              role_id: 'owner' // Simplificado para el ejemplo
            });
        }
      }
    }

    console.log(`✅ Usuario ${user.email} creado exitosamente`);
  } catch (error) {
    console.error(`❌ Error creando usuario ${user.email}:`, error);
  }
}

async function setupTestUsers() {
  console.log('🚀 Iniciando configuración de usuarios de prueba...\n');

  for (const [key, user] of Object.entries(testUsers)) {
    await createTestUser(user);
  }

  console.log('\n✅ Configuración completada');
}

async function cleanupTestUsers() {
  console.log('🧹 Limpiando usuarios de prueba...\n');

  for (const [key, user] of Object.entries(testUsers)) {
    try {
      // Buscar usuario por email
      const { data: users } = await supabase.auth.admin.listUsers();
      const testUser = users?.users.find(u => u.email === user.email);
      
      if (testUser) {
        // Eliminar usuario (esto también elimina el perfil por CASCADE)
        await supabase.auth.admin.deleteUser(testUser.id);
        console.log(`✅ Usuario ${user.email} eliminado`);
      }
    } catch (error) {
      console.error(`❌ Error eliminando usuario ${user.email}:`, error);
    }
  }
}

// Parsear argumentos de línea de comandos
const args = process.argv.slice(2);
const command = args[0];

if (command === 'cleanup') {
  cleanupTestUsers().catch(console.error);
} else {
  setupTestUsers().catch(console.error);
}
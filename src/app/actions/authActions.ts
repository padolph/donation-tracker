'use server';

/* eslint-disable security/detect-non-literal-fs-filename */

import fs from 'fs';
import path from 'path';

export async function setupPassword(password: string) {
  // Prevent overwriting if password is already set
  if (process.env.APP_PASSWORD) {
    return { success: false, error: 'Password is already configured.' };
  }

  if (!password || password.trim().length === 0) {
    return { success: false, error: 'Password cannot be empty.' };
  }

  try {
    const trimmedPassword = password.trim();

    // 1. Update the environment variable for the current process immediately
    process.env.APP_PASSWORD = trimmedPassword;

    // 2. Persist the password
    const configPath = process.env.CONFIG_PATH;
    if (configPath) {
      // Production mode - write to persistent config.json
      let config: Record<string, string> = {};
      if (fs.existsSync(configPath)) {
        try {
          const content = fs.readFileSync(configPath, 'utf8');
          config = JSON.parse(content);
        } catch (e) {
          console.error('Failed to parse config file', e);
        }
      }
      config.APP_PASSWORD = trimmedPassword;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    } else {
      // Development mode - write to .env.local
      const envLocalPath = path.join(process.cwd(), '.env.local');
      let envContent = '';
      if (fs.existsSync(envLocalPath)) {
        envContent = fs.readFileSync(envLocalPath, 'utf8');
      }

      if (envContent.includes('APP_PASSWORD=')) {
        envContent = envContent.replace(/APP_PASSWORD=.*/, `APP_PASSWORD=${trimmedPassword}`);
      } else {
        envContent += `\nAPP_PASSWORD=${trimmedPassword}\n`;
      }
      fs.writeFileSync(envLocalPath, envContent, 'utf8');
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to set application password:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set password.'
    };
  }
}

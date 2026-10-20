export const ciDatabaseName = "gustafta_ci_integration_test";

export function validateCiDatabaseEnvironment(env) {
  if (env.GITHUB_ACTIONS !== "true" || env.NODE_ENV !== "test") {
    throw new Error("Database CI hanya boleh disiapkan pada runner GitHub dalam mode test.");
  }
  let target;
  try { target = new URL(env.CI_TEST_DATABASE_URL); }
  catch { throw new Error("URL database CI tidak valid."); }
  if (target.protocol !== "postgres:" || target.hostname !== "127.0.0.1"
      || target.port !== "5432" || target.username !== "ci_runner"
      || target.pathname !== `/${ciDatabaseName}` || target.search || target.hash) {
    throw new Error("Database CI harus menunjuk layanan disposable loopback yang ditentukan.");
  }
  if (env.DATABASE_URL !== env.CI_TEST_DATABASE_URL || env.DATABASE_URL_POOLED
      || env.TEST_DATABASE_URL) {
    throw new Error("Jalur koneksi database CI tidak konsisten.");
  }
  for (const [key, value] of Object.entries(env)) {
    if (value && /^(?:OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|DEEPSEEK_API_KEY|QWEN_API_KEY|NVIDIA_API_KEY|OPENROUTER_API_KEY|BREVO_API_KEY|FONNTE_API_KEY|FONNTE_API_TOKEN|SCALEV_API_KEY|META_CAPI_ACCESS_TOKEN)$/.test(key)) {
      throw new Error("Kredensial layanan nyata tidak diizinkan dalam fixture CI.");
    }
  }
  return ciDatabaseName;
}

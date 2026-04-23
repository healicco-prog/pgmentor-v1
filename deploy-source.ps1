$EnvVars = @(
    "NODE_ENV=production",
    "GOOGLE_CLOUD_PROJECT=pgmentor-ver-1",
    "SUPABASE_URL=https://qnguxwmrqwcksspujmoa.supabase.co",
    "ALLOWED_ORIGINS=https://pgmentor.netlify.app,https://www.pgmentor.in,https://pgmentor.in",
    "APP_URL=https://www.pgmentor.in",
    "EMAIL_FROM=PGMentor <noreply@pgmentor.in>",
    "ADMIN_EMAIL=drnarayanak@gmail.com",
    "PORT=8080"
) -join ","

$Secrets = @(
    "SUPABASE_ANON_KEY=supabase-anon-key:latest",
    "SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest",
    "GEMINI_API_KEY=gemini-api-key:latest",
    "RESEND_API_KEY=resend-api-key:latest",
    "BACKEND_API_KEY=backend-api-key:latest",
    "ADMIN_API_SECRET=admin-api-secret:latest",
    "YOUTUBE_API_KEY=youtube-api-key:latest"
) -join ","

gcloud run deploy pgmentor-backend `
  --source="." `
  --region=us-central1 `
  --platform=managed `
  --allow-unauthenticated `
  --port=8080 `
  --memory=512Mi `
  --cpu=1 `
  --min-instances=0 `
  --max-instances=10 `
  --concurrency=80 `
  --timeout=300 `
  --set-env-vars="$EnvVars" `
  --set-secrets="$Secrets" `
  --project=pgmentor-ver-1

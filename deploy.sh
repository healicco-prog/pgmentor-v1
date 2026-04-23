#!/usr/bin/env bash
# ================================================================
# PGMentor Backend — Google Cloud Run Deployment Script
# Project : pgmentor-ver-1
# Region  : us-central1
# Service : pgmentor-backend
#
# PREREQUISITES (run once):
#   1. gcloud auth login && gcloud config set project pgmentor-ver-1
#   2. Run the "One-time setup" section below (or comment it out
#      after the first run).
#
# USAGE:
#   chmod +x deploy.sh
#   ./deploy.sh
# ================================================================

set -euo pipefail

PROJECT_ID="pgmentor-ver-1"
REGION="us-central1"
SERVICE="pgmentor-backend"
REPO="pgmentor"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}"
TAG=$(git rev-parse --short HEAD 2>/dev/null || echo "manual")

echo "▶ Deploying ${SERVICE} @ ${TAG} to ${PROJECT_ID}/${REGION}"

# ──────────────────────────────────────────────────────────────────
# ONE-TIME SETUP  (comment out after first successful run)
# ──────────────────────────────────────────────────────────────────

echo "── Enabling required APIs ──"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  --project="${PROJECT_ID}"

echo "── Creating Artifact Registry repository (if missing) ──"
gcloud artifacts repositories create "${REPO}" \
  --repository-format=docker \
  --location="${REGION}" \
  --project="${PROJECT_ID}" \
  --quiet 2>/dev/null || echo "  (repository already exists)"

echo "── Creating Secret Manager secrets ──"
# For each secret: create if it doesn't exist, then add a new version.
# You will be prompted to paste each value on stdin.
create_or_update_secret() {
  local name="$1"
  local prompt="$2"
  echo ""
  echo "  Secret: ${name}"
  echo "  ${prompt}"
  printf "  Value (paste, then Enter): "
  read -r secret_value

  gcloud secrets describe "${name}" --project="${PROJECT_ID}" &>/dev/null \
    || gcloud secrets create "${name}" \
         --replication-policy=automatic \
         --project="${PROJECT_ID}"

  printf '%s' "${secret_value}" \
    | gcloud secrets versions add "${name}" \
        --data-file=- \
        --project="${PROJECT_ID}"
  echo "  ✅ ${name} stored."
}

create_or_update_secret "supabase-anon-key"        "SUPABASE_ANON_KEY (public JWT from Supabase → Settings → API)"
create_or_update_secret "supabase-service-role-key" "SUPABASE_SERVICE_ROLE_KEY (service_role key — keep secret!)"
create_or_update_secret "gemini-api-key"            "GEMINI_API_KEY (from Google AI Studio)"
create_or_update_secret "resend-api-key"            "RESEND_API_KEY (from resend.com)"
create_or_update_secret "backend-api-key"           "BACKEND_API_KEY (random string sent as X-Api-Key by Netlify frontend)"
create_or_update_secret "admin-api-secret"          "ADMIN_API_SECRET (strong random string for Control Panel login)"

# ──────────────────────────────────────────────────────────────────
# BUILD & PUSH
# ──────────────────────────────────────────────────────────────────

echo ""
echo "── Configuring Docker auth for Artifact Registry ──"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

echo "── Building Docker image ──"
docker build \
  -t "${IMAGE}:${TAG}" \
  -t "${IMAGE}:latest" \
  .

echo "── Pushing image ──"
docker push "${IMAGE}:${TAG}"
docker push "${IMAGE}:latest"

# ──────────────────────────────────────────────────────────────────
# DEPLOY TO CLOUD RUN
# ──────────────────────────────────────────────────────────────────

echo ""
echo "── Deploying to Cloud Run ──"
gcloud run deploy "${SERVICE}" \
  --image="${IMAGE}:${TAG}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --timeout=300 \
  --set-env-vars="NODE_ENV=production,\
GOOGLE_CLOUD_PROJECT=${PROJECT_ID},\
SUPABASE_URL=https://qnguxwmrqwcksspujmoa.supabase.co,\
ALLOWED_ORIGINS=https://pgmentor.netlify.app,https://www.pgmentor.in,https://pgmentor.in,\
APP_URL=https://www.pgmentor.in,\
EMAIL_FROM=PGMentor <noreply@pgmentor.in>,\
ADMIN_EMAIL=drnarayanak@gmail.com" \
  --set-secrets="\
SUPABASE_ANON_KEY=supabase-anon-key:latest,\
SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest,\
GEMINI_API_KEY=gemini-api-key:latest,\
RESEND_API_KEY=resend-api-key:latest,\
BACKEND_API_KEY=backend-api-key:latest,\
ADMIN_API_SECRET=admin-api-secret:latest" \
  --project="${PROJECT_ID}"

echo ""
echo "✅ Deployment complete!"
echo ""
SERVICE_URL=$(gcloud run services describe "${SERVICE}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="value(status.url)")
echo "   Service URL : ${SERVICE_URL}"
echo "   Health check: ${SERVICE_URL}/health"
echo ""
echo "Post-deploy verification:"
echo "  curl ${SERVICE_URL}/health"
echo "  curl ${SERVICE_URL}/api/health"

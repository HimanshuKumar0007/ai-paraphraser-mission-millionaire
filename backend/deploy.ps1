# deploy.ps1 - Google Cloud Run Deployment Script

$PROJECT_ID = "turing-clock-460408-c3"
$REGION = "us-central1"
$SERVICE_NAME = "wordlyai-backend"
$REPO_NAME = "wordlyai-repo"

Write-Host "🚀 Starting Deployment for $PROJECT_ID..." -ForegroundColor Green

# 1. Configuration
Write-Host "`n1️⃣ Configuring Project..."
gcloud config set project $PROJECT_ID

# 2. Enable APIs
Write-Host "`n2️⃣ Enabling Required APIs..."
gcloud services enable artifactregistry.googleapis.com run.googleapis.com cloudbuild.googleapis.com

# 3. Create Artifact Registry (if not exists)
Write-Host "`n3️⃣ Checking Artifact Registry..."
$repoExists = gcloud artifacts repositories list --project=$PROJECT_ID --location=$REGION --filter="name:$REPO_NAME" --format="value(name)"
if (-not $repoExists) {
    Write-Host "Creating repository $REPO_NAME..."
    gcloud artifacts repositories create $REPO_NAME --repository-format=docker --location=$REGION --description="Docker repository for WordlyAi"
} else {
    Write-Host "Repository $REPO_NAME already exists."
}

# 4. Authentication
Write-Host "`n4️⃣ Configuring Docker Authentication..."
gcloud auth configure-docker $REGION-docker.pkg.dev --quiet

# 5. Build and Push
Write-Host "`n5️⃣ Building and Pushing Image..."
$IMAGE_TAG = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME`:latest"
gcloud builds submit --tag $IMAGE_TAG .

# 6. Deploy
Write-Host "`n6️⃣ Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_TAG `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --port 8080 `
    --set-env-vars NODE_ENV=production

Write-Host "`n✅ Deployment Complete!" -ForegroundColor Green
Write-Host "Your service should be available at the URL provided above."

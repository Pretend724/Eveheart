param(
  [string]$OutputDir = ".\\dist"
)

$ErrorActionPreference = "Stop"

function Assert-ImageExists {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ImageName
  )

  docker image inspect $ImageName *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "Docker image '$ImageName' does not exist. Run 'docker compose -f docker/docker-compose.yml build' first."
  }
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

Assert-ImageExists "eveheart-web:delivery"
Assert-ImageExists "eveheart-agent:delivery"
Assert-ImageExists "postgres:16"

docker save -o (Join-Path $OutputDir "eveheart-web-delivery.tar") eveheart-web:delivery
if ($LASTEXITCODE -ne 0) {
  throw "Failed to export eveheart-web:delivery."
}

docker save -o (Join-Path $OutputDir "eveheart-agent-delivery.tar") eveheart-agent:delivery
if ($LASTEXITCODE -ne 0) {
  throw "Failed to export eveheart-agent:delivery."
}

docker save -o (Join-Path $OutputDir "postgres-16.tar") postgres:16
if ($LASTEXITCODE -ne 0) {
  throw "Failed to export postgres:16."
}

Copy-Item .\docker-compose.yml (Join-Path $OutputDir "docker-compose.yml") -Force

Write-Host "Delivery files exported to $OutputDir"

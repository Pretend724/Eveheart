param(
  [string]$OutputDir = ".\\dist"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ResolvedOutputDir = if ([System.IO.Path]::IsPathRooted($OutputDir)) {
  $OutputDir
}
else {
  Join-Path $ScriptDir $OutputDir
}

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

function Compress-GzipFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,
    [Parameter(Mandatory = $true)]
    [string]$DestinationPath
  )

  Add-Type -AssemblyName System.IO.Compression.FileSystem

  $sourceStream = [System.IO.File]::OpenRead($SourcePath)
  try {
    $destinationStream = [System.IO.File]::Create($DestinationPath)
    try {
      $gzipStream = New-Object System.IO.Compression.GzipStream(
        $destinationStream,
        [System.IO.Compression.CompressionLevel]::Optimal
      )
      try {
        $sourceStream.CopyTo($gzipStream)
      }
      finally {
        $gzipStream.Dispose()
      }
    }
    finally {
      $destinationStream.Dispose()
    }
  }
  finally {
    $sourceStream.Dispose()
  }
}

function Export-CompressedImage {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ImageName,
    [Parameter(Mandatory = $true)]
    [string]$ArchiveName
  )

  $tempTarPath = Join-Path ([System.IO.Path]::GetTempPath()) ("{0}.tar" -f [System.Guid]::NewGuid())
  $archivePath = Join-Path $ResolvedOutputDir $ArchiveName

  try {
    docker save -o $tempTarPath $ImageName
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to export $ImageName."
    }

    Compress-GzipFile -SourcePath $tempTarPath -DestinationPath $archivePath
  }
  finally {
    if (Test-Path $tempTarPath) {
      Remove-Item -LiteralPath $tempTarPath -Force
    }
  }
}

function Copy-DeliveryFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,
    [Parameter(Mandatory = $true)]
    [string]$DestinationPath
  )

  $resolvedSource = [System.IO.Path]::GetFullPath($SourcePath)
  $resolvedDestination = [System.IO.Path]::GetFullPath($DestinationPath)

  if ($resolvedSource -ne $resolvedDestination) {
    Copy-Item $resolvedSource $resolvedDestination -Force
  }
}

New-Item -ItemType Directory -Force -Path $ResolvedOutputDir | Out-Null

$legacyArtifacts = @(
  "eveheart-web.tar",
  "eveheart-agent.tar",
  "eveheart-web-delivery.tar",
  "eveheart-agent-delivery.tar",
  "postgres-16.tar"
)

foreach ($artifact in $legacyArtifacts) {
  $artifactPath = Join-Path $ResolvedOutputDir $artifact
  if (Test-Path $artifactPath) {
    Remove-Item -LiteralPath $artifactPath -Force
  }
}

Assert-ImageExists "eveheart-web:delivery"
Assert-ImageExists "eveheart-agent:delivery"

Export-CompressedImage "eveheart-web:delivery" "eveheart-web-delivery.tar.gz"
Export-CompressedImage "eveheart-agent:delivery" "eveheart-agent-delivery.tar.gz"

Copy-DeliveryFile (Join-Path $ScriptDir "dist\\docker-compose.yml") (Join-Path $ResolvedOutputDir "docker-compose.yml")
Copy-DeliveryFile (Join-Path $ScriptDir "dist\\README.md") (Join-Path $ResolvedOutputDir "README.md")

Write-Host "Delivery files exported to $ResolvedOutputDir"
Write-Host "PostgreSQL is no longer bundled. Recipients can pull postgres:16 on first startup."

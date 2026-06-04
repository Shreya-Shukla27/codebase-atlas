#!/usr/bin/env pwsh
<#
PowerShell script to convert SVG diagrams to PNG using ImageMagick or Inkscape.
Run: .\scripts\convert-diagrams.ps1
#>
param(
    [string[]] $Svgs = @("assets/diagrams/app-architecture.svg","assets/diagrams/backend-data-flow.svg","assets/diagrams/recruiter-architecture.svg")
)

function Convert-With-Magick($inFile, $outFile){
    Write-Host "Using ImageMagick: magick convert $inFile $outFile"
    magick convert $inFile $outFile
}

function Convert-With-Inkscape($inFile, $outFile){
    Write-Host "Using Inkscape: inkscape --export-type=png --export-filename=$outFile $inFile"
    inkscape --export-type=png --export-filename=$outFile $inFile
}

foreach ($svg in $Svgs) {
    if (-not (Test-Path $svg)) { Write-Host "Skipping missing: $svg"; continue }
    $png = [System.IO.Path]::ChangeExtension($svg, '.png')
    if (Get-Command magick -ErrorAction SilentlyContinue) {
        Convert-With-Magick $svg $png
    } elseif (Get-Command inkscape -ErrorAction SilentlyContinue) {
        Convert-With-Inkscape $svg $png
    } else {
        Write-Host "No supported converter found (magick or inkscape). Install ImageMagick or Inkscape to generate PNGs." -ForegroundColor Yellow
        exit 2
    }
}

Write-Host "Done. Generated PNGs are next to SVGs. Commit them if you want them pushed to GitHub." -ForegroundColor Green

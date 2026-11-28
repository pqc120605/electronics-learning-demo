$ErrorActionPreference = 'Stop'
Push-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
try {
    $approval = 'ef88a72e4dba5015a288d84ddccf9eda0b0a84dd05a8aaac3e77ad663da15960'
    $proposal = 'docs/research/2026-11-28-a12-firmware-r2-proposal.json'
    if ((Get-FileHash -LiteralPath $proposal).Hash.ToLowerInvariant() -ne $approval) {
        throw 'SHA-256 A12-FW-R2 không khớp.'
    }
    $plan = Get-Content -LiteralPath $proposal -Raw | ConvertFrom-Json
    $stage = Join-Path (Get-Location) '.tmp/a12-fw-r2'
    $assets = Join-Path $stage 'runtime'
    $scripts = Join-Path $stage 'build-sources'
    $s2 = '.tmp/a12-s2-build/button_led.elf'
    $nano = '.tmp/a12-nano-build-verified/nano-every-a12.ino.elf'
    $rom = '.tmp/a12-vendor/s2probe/s2rom.bin'
    if ((Get-FileHash -LiteralPath $s2).Hash -ne $plan.runners.esp32s2.firmware.sha256 -or
        (Get-FileHash -LiteralPath $nano).Hash -ne $plan.runners.nanoEvery.firmware.sha256) {
        throw 'ELF A12 không khớp cấu hình.'
    }
    if ((Get-Item -LiteralPath $rom).Length -ne 131072 -or
        ([IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $rom).Path) | Where-Object { $_ -ne 0 } | Select-Object -First 1)) {
        throw 'ROM thử của loader SRAM S2 phải là 128 KiB byte 0.'
    }
    $tool = '.tmp/a12-arduino-data/packages/arduino/tools/avr-gcc/7.3.0-atmel3.6.1-arduino5/bin/avr-objcopy.exe'
    [IO.Directory]::CreateDirectory($scripts) | Out-Null
    [IO.Directory]::CreateDirectory($assets) | Out-Null
    $sources = 'qemu-s2.patch', 'avr-mcsim.patch', 'nano-runner.c', 'build-linux.sh'
    foreach ($source in $sources) {
        Copy-Item -LiteralPath (Join-Path "$PSScriptRoot/a12-fw-r2" $source) -Destination $scripts
    }
    wsl.exe -d podman-machine-default -- podman exec machmo-a12-fw-r2 bash /r2/build-sources/build-linux.sh
    if ($LASTEXITCODE) { throw 'Build runner A12 thất bại.' }
    Copy-Item -LiteralPath $s2 -Destination (Join-Path $assets 's2.elf')
    Copy-Item -LiteralPath $nano -Destination (Join-Path $assets 'nano.elf')
    Copy-Item -LiteralPath $rom -Destination $assets
    Copy-Item -LiteralPath "$PSScriptRoot/a12-fw-r2/run-s2.py" -Destination $assets
    & $tool -O ihex -R .eeprom -R .fuse -R .lock -R .signature -R .user_signatures $nano (Join-Path $assets 'nano.hex')
    if ($LASTEXITCODE) { throw 'Không trích được flash Nano Every.' }
    $names = 's2.elf', 's2rom.bin', 'run-s2.py', 'qemu-system-xtensa', 'nano.elf', 'nano.hex', 'nano-runner'
    $hashes = [ordered]@{}
    foreach ($name in $names) {
        $hashes[$name] = (Get-FileHash -LiteralPath (Join-Path $assets $name)).Hash.ToLowerInvariant()
    }
    $manifest = [ordered]@{ approvalSha256 = $approval; files = $hashes }
    $manifestPath = Join-Path $assets 'manifest.json'
    $encoding = [Text.UTF8Encoding]::new($false)
    [IO.File]::WriteAllText($manifestPath, ($manifest | ConvertTo-Json -Depth 4), $encoding)
    node --test --test-concurrency=1 tests/a12-firmware-r2.test.mjs
    if ($LASTEXITCODE) { throw 'Hai runner A12 chưa vượt phép thử ghép mạch.' }
    $manifest['passed'] = [ordered]@{ esp32s2 = $hashes['qemu-system-xtensa']; atmega4809 = $hashes['nano-runner'] }
    [IO.File]::WriteAllText($manifestPath, ($manifest | ConvertTo-Json -Depth 4), $encoding)
    'Đã chuẩn bị hai runner A12-FW-R2 cho bản local.'
} finally {
    Pop-Location
}

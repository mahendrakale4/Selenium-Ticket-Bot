# Script to start all servers in separate windows
$num = python -c "from num import NUM; print(NUM)"  # Get number directly from num.py
$folders = 1..$num

foreach ($folder in $folders) {
    $path = Join-Path $PSScriptRoot $folder
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$path'; node index.js"
} 
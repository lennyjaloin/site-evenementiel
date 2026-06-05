$text = (ipconfig) -join "`n"
$blocks = $text -split "(`r?`n){2,}" | Where-Object { $_ -match "Adresse IPv4|IPv4 Address" }

$items = foreach ($block in $blocks) {
  $ipMatch = [regex]::Match($block, "(Adresse IPv4|IPv4 Address)[^:]*:\s*([0-9.]+)")
  $gatewayMatch = [regex]::Match($block, "(Passerelle|Default Gateway)[^:]*:\s*([0-9.]+)")

  if ($ipMatch.Success) {
    [pscustomobject]@{
      IP = $ipMatch.Groups[2].Value
      HasGateway = $gatewayMatch.Success
    }
  }
}

$ip = $items |
  Sort-Object @{ Expression = "HasGateway"; Descending = $true } |
  Select-Object -ExpandProperty IP -First 1

if ($ip) {
  Write-Output $ip
}

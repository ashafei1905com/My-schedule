param([int]$Start, [int]$End)
$lines = Get-Content -LiteralPath 'c:/html6/My-schedule/index.html'
$end = if($End -le 0){ $lines.Length } else { $End }
if($end -gt $lines.Length){ $end = $lines.Length }
for($i=$Start; $i -lt $end; $i++){
  '{0}:{1}' -f ($i+1), $lines[$i]
}


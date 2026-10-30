<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$dataDir = __DIR__ . '/data';
$dataFile = $dataDir . '/runs.json';
if (!is_dir($dataDir)) { mkdir($dataDir, 0750, true); }
if (!file_exists($dataFile)) { file_put_contents($dataFile, json_encode(['runs'=>[]], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE), LOCK_EX); }
function respond($payload, int $status=200): void { http_response_code($status); echo json_encode($payload, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); exit; }
function loadData(string $file): array {
  $fp=fopen($file,'c+'); if(!$fp) respond(['error'=>'Impossible de lire le stockage JSON.'],500);
  flock($fp,LOCK_SH); $raw=stream_get_contents($fp); flock($fp,LOCK_UN); fclose($fp);
  $decoded=json_decode($raw ?: '{"runs":[]}',true);
  return is_array($decoded) && isset($decoded['runs']) && is_array($decoded['runs']) ? $decoded : ['runs'=>[]];
}
function saveData(string $file,array $data): void {
  $fp=fopen($file,'c+'); if(!$fp) respond(['error'=>'Impossible d’écrire le stockage JSON.'],500);
  flock($fp,LOCK_EX); ftruncate($fp,0); rewind($fp);
  fwrite($fp,json_encode($data,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)); fflush($fp); flock($fp,LOCK_UN); fclose($fp);
}
$method=$_SERVER['REQUEST_METHOD'] ?? 'GET';
if($method==='GET') respond(loadData($dataFile));
if($method!=='POST') respond(['error'=>'Méthode non autorisée.'],405);
$body=json_decode(file_get_contents('php://input'),true);
if(!is_array($body)) respond(['error'=>'Données JSON invalides.'],400);
$data=loadData($dataFile); $action=$body['action'] ?? '';
if($action==='save') {
  $run=$body['run'] ?? null;
  if(!is_array($run) || empty($run['date']) || empty($run['place']) || !isset($run['distance']) || (float)$run['distance']<=0) respond(['error'=>'Date, lieu et distance sont obligatoires.'],422);
  $run['id']=!empty($run['id']) ? preg_replace('/[^a-zA-Z0-9_-]/','',(string)$run['id']) : bin2hex(random_bytes(8));
  $run['updatedAt']=date(DATE_ATOM);
  $found=false;
  foreach($data['runs'] as $i=>$existing) if(($existing['id']??'')===$run['id']) { $data['runs'][$i]=$run; $found=true; break; }
  if(!$found) $data['runs'][]=$run;
  usort($data['runs'],fn($a,$b)=>strcmp($a['date']??'',$b['date']??''));
  saveData($dataFile,$data); respond(['ok'=>true,'run'=>$run,'runs'=>$data['runs']]);
}
if($action==='delete') {
  $id=(string)($body['id']??''); $before=count($data['runs']);
  $data['runs']=array_values(array_filter($data['runs'],fn($r)=>($r['id']??'')!==$id));
  if(count($data['runs'])===$before) respond(['error'=>'Course introuvable.'],404);
  saveData($dataFile,$data); respond(['ok'=>true,'runs'=>$data['runs']]);
}
if($action==='import') {
  $runs=$body['runs']??null; if(!is_array($runs)) respond(['error'=>'Import invalide.'],422);
  foreach($runs as $run) if(is_array($run) && !empty($run['date']) && !empty($run['place']) && isset($run['distance'])) {
    if(empty($run['id'])) $run['id']=bin2hex(random_bytes(8));
    $data['runs'][]=$run;
  }
  $unique=[]; foreach($data['runs'] as $r) $unique[$r['id']]=$r;
  $data['runs']=array_values($unique); usort($data['runs'],fn($a,$b)=>strcmp($a['date']??'',$b['date']??''));
  saveData($dataFile,$data); respond(['ok'=>true,'runs'=>$data['runs']]);
}
respond(['error'=>'Action inconnue.'],400);
?>
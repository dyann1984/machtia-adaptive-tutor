const fs = require('node:fs');
const cp = require('node:child_process');
const patterns = [
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['Private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/g],
  ['API token', /\b(?:sk-[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,})\b/g],
  ['JWT', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g],
  ['Credential assignment', /(?:secret[_-]?access[_-]?key|api[_-]?key|password|service[_-]?role[_-]?key|access[_-]?token)\s*[=:]\s*["'][^"'\r\n]{8,}["']/gi]
];
const git = (...args) => cp.execFileSync('git', args, {encoding:'utf8', maxBuffer:64*1024*1024});
const findings=[];
let scanned=0;
function scan(label, data) {
  if (data.includes('\0')) return;
  scanned++;
  data.split(/\r?\n/).forEach((line,i)=>patterns.forEach(([type,re])=>{
    re.lastIndex=0;
    if (re.test(line)) findings.push({file:label,line:i+1,type});
  }));
}
const files=git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(Boolean);
for(const file of files) if(fs.existsSync(file)) scan(file,fs.readFileSync(file,'utf8'));
const commits=git('rev-list','--all').trim().split(/\r?\n/).filter(Boolean);
let blobs=0;
const seen=new Set();
for(const commit of commits){
  for(const item of git('ls-tree','-r',commit).trim().split(/\r?\n/)){
    const match=item.match(/^\d+ blob ([a-f0-9]+)\t(.+)$/);
    if(!match || seen.has(match[1])) continue;
    seen.add(match[1]); blobs++;
    scan(`${commit.slice(0,12)}:${match[2]}`,git('cat-file','blob',match[1]));
  }
}
const report={timestamp:new Date().toISOString(),workingFiles:files.length,commits:commits.length,uniqueHistoricalBlobs:blobs,textsScanned:scanned,candidates:findings,limitations:'Pattern scan of working tracked/untracked nonignored files and all locally reachable Git blobs. Binary assets, remote-only history, ignored dependencies, and external infrastructure are not certified.'};
fs.writeFileSync('docs/audit-2026-10-05/secrets-scan.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));

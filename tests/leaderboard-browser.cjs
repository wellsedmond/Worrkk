const {chromium}=require('playwright-core'),{spawn}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{createHmac}=require('node:crypto');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'upyr-leaderboard-')),token='leaderboard-test-token';
function auth(id,name){const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:name})});const check=[...p].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('\n');p.set('hash',createHmac('sha256',createHmac('sha256','WebAppData').update(token).digest()).update(check).digest('hex'));return p.toString();}
const first=auth(123,'Роман'),other=auth(456,'<img src=x onerror=alert(1)>');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3162',TELEGRAM_BOT_TOKEN:token,UPYR_DATA_DIR:directory},stdio:'ignore'});
async function save(initData,events){const response=await fetch('http://127.0.0.1:3162/api/achievements',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({initData,events})});assert.equal(response.status,200);}
const events=(id,coins)=>[{stream:'device-stream-'+id,run:'game-run-test-'+id,seq:1,type:'run_started',data:{level:'level1'}},{stream:'device-stream-'+id,run:'game-run-test-'+id,seq:2,type:'coin_collected',data:{id:'coin-a',amount:coins}}];
(async()=>{let browser;try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3162/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 await save(first,events('123',100));await save(other,events('456',50));
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://telegram.org/**',r=>r.fulfill({body:`window.Telegram={WebApp:{platform:'ios',initData:${JSON.stringify(first)},initDataUnsafe:{user:{id:123}},ready(){},expand(){},onEvent(){}}}`}));
 await page.goto('http://127.0.0.1:3162/');await page.waitForFunction(()=>assetsReady);
 await page.locator('#leaderboard-open').tap();await page.waitForSelector('#leaderboard-table:not([hidden])');
 assert.equal(await page.locator('#leaderboard-rows tr').count(),2);assert.match(await page.locator('#leaderboard-rows tr').first().innerText(),/Роман.*Вы/);
 assert.equal(await page.locator('#leaderboard-rows img').count(),0);assert.match(await page.locator('#leaderboard-rows').innerText(),/<img src=x/);
 assert.match(await page.locator('#leaderboard-self').innerText(),/Ваше место: 1.*100/);assert.equal(await page.evaluate(()=>paused),true);
 assert.equal(await page.locator('#leaderboard-panel').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
 await save(other,[{...events('456',50)[1],seq:3,data:{id:'coin-b',amount:100}}]);
 await page.locator('#leaderboard-refresh').tap();await page.waitForFunction(()=>document.querySelector('#leaderboard-self').textContent.includes('место: 2'));
 await page.screenshot({path:'/tmp/upyr-leaderboard.png'});
 await page.route('**/api/leaderboard',r=>r.abort());await page.locator('#leaderboard-refresh').tap();await page.waitForFunction(()=>document.querySelector('#leaderboard-status').textContent.includes('Не удалось'));
 assert.equal(await page.locator('#leaderboard-refresh').isEnabled(),true);
 await page.unroute('**/api/leaderboard');await page.locator('#leaderboard-refresh').tap();await page.waitForSelector('#leaderboard-table:not([hidden])');
 await page.locator('#leaderboard-close').tap();assert.equal(await page.evaluate(()=>paused),false);
 await page.goto('http://127.0.0.1:3162/Worrkk.html');await page.waitForFunction(()=>assetsReady);await page.locator('#leaderboard-open').tap();
 assert.match(await page.locator('#leaderboard-status').innerText(),/доступен в Telegram/);assert.equal(await page.locator('#leaderboard-rows tr').count(),0);
 assert.deepEqual(errors,[]);console.log('Shared coin ranking, safe names, own rank, refresh, retry, mobile layout, pause and offline state passed');
}finally{await browser?.close();server.kill();fs.rmSync(directory,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});

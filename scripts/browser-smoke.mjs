// Optional real-browser smoke checks. Uses an isolated temporary Chrome profile.
// No browser automation dependency or application backend is required.
import {spawn} from 'node:child_process';
import {mkdtemp,rm,mkdir,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(join(tmpdir(),'rvmx-browser-'));
const children=[];let socket;let logs='';
const start=(command,args)=>{
 const child=spawn(command,args,{stdio:['ignore','pipe','pipe']});children.push(child);
 child.stdout.on('data',chunk=>{logs+=chunk;});child.stderr.on('data',chunk=>{logs+=chunk;});
 child.on('error',error=>{logs+=error.message;});return child;
};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,label){
 for(let i=0;i<100;i++){try{const value=await fn();if(value)return value;}catch{}await delay(100);}
 throw Error(`Timed out: ${label}\n${logs.slice(-2000)}`);
}
try{
 start(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5175','--strictPort']);
 await until(async()=> (await fetch('http://127.0.0.1:5175/')).ok,'Vite startup');
 start(process.env.CHROME_BIN??'google-chrome',['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--no-default-browser-check','--disable-background-networking',`--user-data-dir=${profile}`,
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=9224','about:blank']);
 const targets=await until(async()=>{const result=await (await fetch('http://127.0.0.1:9224/json')).json();return result.find(t=>t.type==='page');},'Chrome DevTools');
 socket=new WebSocket(targets.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let next=1;const pending=new Map(),exceptions=[];
 socket.onmessage=event=>{const response=JSON.parse(event.data);if(response.method==='Runtime.exceptionThrown')exceptions.push(response.params.exceptionDetails.text);if(response.id){const {resolve,reject}=pending.get(response.id)??{};pending.delete(response.id);if(response.error)reject?.(Error(response.error.message));else resolve?.(response.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=next++;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const evaluate=async(expression)=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);return result.result?.value;};
 const click=label=>evaluate(`(()=>{const element=[...document.querySelectorAll('button,[role=button]')].find(b=>b.getAttribute('aria-label')===${JSON.stringify(label)}||b.textContent.trim()===${JSON.stringify(label)});if(!element)throw Error('Missing button: '+${JSON.stringify(label)});element.dispatchEvent(new MouseEvent('click',{bubbles:true}));return true})()`);
 const text=()=>evaluate('document.body.innerText');
 const setInput=(selector,value)=>evaluate(`(()=>{const input=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input),'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await send('Runtime.enable');await send('Page.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1400,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:5175/'});
 await until(async()=> (await text())?.includes('Out-of-order datapath'),'application mount');
 for(let i=0;i<8;i++)await click('Next cycle');
 assert.match(await text(),/Reorder buffer/);assert.match(await text(),/Register renaming/);
 await click('Inspect Fetch');assert.equal(await evaluate("document.querySelector('.component-inspector>b').textContent"),'Fetch');
 await click('Inspect ROB');await click('Physical file');assert.match(await text(),/p63/);await click('RAT');
 await mkdir('docs/screenshots',{recursive:true});
 const desktop=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile('docs/screenshots/cpu-explorer.png',Buffer.from(desktop.data,'base64'));
 await click('Finish');await click('Previous cycle');await click('Next cycle');await click('Performance Lab');
 await until(async()=> (await text()).includes('Verified against interpreter'),'comparison verification');
 await click('CPU Explorer');await click('In-order');await until(async()=> (await text()).includes('Five-stage pipeline'),'in-order view');
 await click('Configure');
 await setInput('input[max="128"]','32');
 await until(async()=> (await text()).includes('physicalRegisters must be an integer'),'configuration validation');
 await click('Restore defaults');await click('Configure');
 await setInput('textarea','ADDI x1,x0,9\nSW x1,0(x0)\nLW x0,1(x0)\nSW x1,4(x0)');
 await click('Assemble / load');await click('Finish');
 await until(async()=> (await text()).includes('Fatal fault at PC'),'precise fault display');
 await click('Performance Lab');assert.match(await text(),/Verified against interpreter/);
 await click('CPU Explorer');await click('Out-of-order');
 const verificationProgram=await readFile(new URL('../examples/cpu-verification.s',import.meta.url),'utf8');
 await setInput('textarea',verificationProgram.replace('BEQ  x7, x10, finish','BEQ  x7, x10, wrong_path'));
 await until(async()=> (await text()).includes('Cannot assemble'),'undefined-label error banner');
 assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Assemble / load').disabled`),true);
 await setInput('textarea',verificationProgram);await click('Assemble / load');await click('Finish');
 await click('Performance Lab');await until(async()=> (await text()).includes('Verified against interpreter'),'user verification program');
 await click('CPU Explorer');
 const examples=await evaluate(`[...document.querySelector('[aria-label="Example program"]').options].map(o=>o.value)`);
 for(const name of examples){
  await setInput('[aria-label="Example program"]',name);await click('Assemble / load');await click('Finish');
  await click('Performance Lab');await until(async()=> (await text()).includes('Verified against interpreter'),`verification for ${name}`);
  await click('CPU Explorer');
 }
 await click('Configure');await click('Restore defaults');await click('Configure');
 await setInput('[aria-label="Example program"]','Register Renaming');await click('Assemble / load');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await delay(300);
 const overflow=await evaluate('document.documentElement.scrollWidth > window.innerWidth');assert.equal(overflow,false,'mobile page should not overflow horizontally');
 const mobile=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile('docs/screenshots/mobile.png',Buffer.from(mobile.data,'base64'));
 await click('Learning Center');assert.match(await text(),/WAR and WAW/);
 assert.deepEqual(exceptions,[],'no uncaught browser exceptions');
 console.log(`Browser checks passed: ${examples.length} examples; both diagrams; cycle navigation; configuration validation/reset; precise fault; comparison; mobile layout; learning view. Screenshots saved.`);
}finally{
 socket?.close();
 for(const child of children)child.kill('SIGTERM');
 await delay(300);await rm(profile,{recursive:true,force:true});
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';
const env = { CORE_SHEETS_WEBHOOK: 'https://example.com/lead', CORE_SHEETS_SECRET: 'test-only', ASSETS: { fetch: async () => new Response('%PDF-test', { headers: { 'Content-Type': 'application/pdf' } }) } };
const request = data => new Request('https://core.example/api/workbook', { method: 'POST', headers: { Origin: 'https://core.example', 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
test('private PDF has no public route, including encoded paths', async () => {
 for (const path of ['/__private/workbook.pdf','/%5f%5fprivate/workbook.pdf']) assert.equal((await worker.fetch(new Request('https://core.example'+path),env)).status,404);
});
test('rejects invalid input and other origins', async () => {
 assert.equal((await worker.fetch(request({name:'A',email:'bad'}),env)).status,400);
 const req=request({name:'Teste',email:'qa@example.com'});req.headers.set('Origin','https://other.example');
 assert.equal((await worker.fetch(req,env)).status,403);
});
test('fails closed when unconfigured', async () => assert.equal((await worker.fetch(request({name:'Teste',email:'qa@example.com'}),{...env,CORE_SHEETS_SECRET:''})).status,503));
test('PDF requires confirmed storage', async () => {
 const original=globalThis.fetch;
 try {
 globalThis.fetch=async()=>Response.json({ok:false});
 assert.equal((await worker.fetch(request({name:'Teste',email:'qa@example.com'}),env)).status,503);
 globalThis.fetch=async()=>Response.json({ok:true});
 const result=await worker.fetch(request({name:'Teste',email:'qa@example.com'}),env);
 assert.equal(result.status,200);assert.equal(await result.text(),'%PDF-test');assert.equal(result.headers.get('Cache-Control'),'no-store');
 } finally {globalThis.fetch=original;}
});
test('native form returns PDF attachment only after storing contact', async () => {
 const original = globalThis.fetch;
 try {
  const req = () => new Request('https://core.example/api/workbook', {method:'POST', headers:{Origin:'https://core.example','Content-Type':'application/x-www-form-urlencoded'}, body:new URLSearchParams({name:'Teste Android',email:'android@example.com'})});
  globalThis.fetch = async (_url, options) => {const lead=JSON.parse(options.body);assert.equal(lead.email,'android@example.com');return Response.json({ok:true});};
  const result=await worker.fetch(req(),env);
  assert.equal(result.status,200);assert.equal(result.headers.get('Content-Type'),'application/pdf');assert.match(result.headers.get('Content-Disposition'),/^attachment;/);assert.equal(await result.text(),'%PDF-test');
  globalThis.fetch=async()=>Response.json({ok:false});
  assert.equal((await worker.fetch(req(),env)).status,503);
 } finally {globalThis.fetch=original;}
});

import express from 'express';
import { dbAuthRouter } from './backend/db/authRouter';
import { dbSaasRouter } from './backend/db/saasRouter';
import { dbSecurityRouter } from './backend/db/securityRouter';
import { dbMonetizationRouter } from './backend/db/monetizationRouter';
import { dbMonetizationGuardRouter } from './backend/db/monetizationGuardRouter';
import { dbPaymentRouter } from './backend/db/paymentRouter';

const originalPost=express.application.post;const originalGet=express.application.get;
let authMounted=false,saasMounted=false,securityMounted=false,monetizationMounted=false,guardMounted=false,paymentMounted=false;
const AUTH_PATHS=new Set(['/api/auth/login','/api/auth/password-reset/request','/api/auth/password-reset/verify','/api/auth/password-reset/verify-otp','/api/auth/password-reset/complete','/api/auth/password-reset/confirm']);
const SAAS_POST_PATHS=new Set(['/api/saas/register','/api/saas/approve-registration']);
function mountAuth(app:any){if(!authMounted){app.use('/api/auth',dbAuthRouter);authMounted=true;}}
function mountSaas(app:any){if(!saasMounted){app.use('/api/saas',dbSaasRouter);saasMounted=true;}}
function mountSecurity(app:any){if(!securityMounted){app.use('/api/security',dbSecurityRouter);securityMounted=true;}}
function mountGuard(app:any){if(!guardMounted){app.use('/api/monetization',dbMonetizationGuardRouter);guardMounted=true;}}
function mountMonetization(app:any){if(!monetizationMounted){app.use('/api/monetization',dbMonetizationRouter);monetizationMounted=true;}}
function mountPayment(app:any){if(!paymentMounted){app.use('/api/payment',dbPaymentRouter);paymentMounted=true;}}

(express.application as any).post=function(path:any,...handlers:any[]){
  if(typeof path==='string'&&AUTH_PATHS.has(path)){mountAuth(this);return this;}
  if(typeof path==='string'&&SAAS_POST_PATHS.has(path)){mountSaas(this);return this;}
  if(typeof path==='string'&&(path.startsWith('/api/security/')||path==='/api/security')){mountSecurity(this);return this;}
  if(typeof path==='string'&&path.startsWith('/api/monetization/')){mountGuard(this);mountMonetization(this);return this;}
  if(typeof path==='string'&&path.startsWith('/api/payment/')){mountPayment(this);return this;}
  return originalPost.call(this,path,...handlers);
};
(express.application as any).get=function(path:any,...handlers:any[]){
  if(path==='/api/saas/registrations'){mountSaas(this);return this;}
  if(typeof path==='string'&&(path.startsWith('/api/security/')||path==='/api/security')){mountSecurity(this);return this;}
  if(typeof path==='string'&&path.startsWith('/api/monetization/')){mountGuard(this);mountMonetization(this);return this;}
  if(typeof path==='string'&&path.startsWith('/api/payment/')){mountPayment(this);return this;}
  return originalGet.call(this,path,...handlers);
};

import('./server').catch((error)=>{console.error('[BIZONE_SERVER_BOOT]',error);process.exitCode=1;});

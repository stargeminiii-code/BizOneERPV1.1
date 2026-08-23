import express from 'express';
import { dbAuthRouter } from './backend/db/authRouter';
import { dbSaasRouter } from './backend/db/saasRouter';

// Keep the existing ERP server and UI intact. Replace only the Auth/SaaS persistence routes.
// This compatibility layer lets Round 2 land without rewriting the large legacy server.ts.
const originalPost = express.application.post;
const originalGet = express.application.get;
let authMounted = false;
let saasMounted = false;

const AUTH_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/password-reset/request',
  '/api/auth/password-reset/verify',
  '/api/auth/password-reset/verify-otp',
  '/api/auth/password-reset/complete',
  '/api/auth/password-reset/confirm',
]);

const SAAS_POST_PATHS = new Set([
  '/api/saas/register',
  '/api/saas/approve-registration',
]);

function mountAuth(app: any) {
  if (!authMounted) {
    app.use('/api/auth', dbAuthRouter);
    authMounted = true;
  }
}

function mountSaas(app: any) {
  if (!saasMounted) {
    app.use('/api/saas', dbSaasRouter);
    saasMounted = true;
  }
}

(express.application as any).post = function(path: any, ...handlers: any[]) {
  if (typeof path === 'string' && AUTH_PATHS.has(path)) {
    mountAuth(this);
    return this;
  }
  if (typeof path === 'string' && SAAS_POST_PATHS.has(path)) {
    mountSaas(this);
    return this;
  }
  return originalPost.call(this, path, ...handlers);
};

(express.application as any).get = function(path: any, ...handlers: any[]) {
  if (path === '/api/saas/registrations') {
    mountSaas(this);
    return this;
  }
  return originalGet.call(this, path, ...handlers);
};

await import('./server');

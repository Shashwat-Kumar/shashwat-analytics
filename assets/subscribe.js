(function () {
  'use strict';
  const form = document.getElementById('subscribe-form');
  const email = document.getElementById('subscriber-email');
  const check = document.getElementById('newsletter-consent');
  const submit = document.getElementById('subscribe-submit');
  const status = document.getElementById('subscribe-status');
  const actions = document.getElementById('confirmation-actions');
  const verified = document.getElementById('verified-email');
  const confirmYes = document.getElementById('confirm-opt-in');
  const confirmNo = document.getElementById('confirm-opt-out');
  const config = window.RS_AUTH_CONFIG || {};
  const base = (config.url || '').replace(/\/$/, '');
  let accessToken = null;
  let busy = false;
  const manage = new URLSearchParams(location.search).get('manage') === '1';

  function say(message, kind) {
    status.textContent = message;
    status.dataset.kind = kind || '';
  }
  function lock(on) {
    busy = on; submit.disabled = on;
    confirmYes.disabled = on; confirmNo.disabled = on;
  }
  function apiHeaders(token) {
    const h = { apikey: config.anonKey, 'Content-Type': 'application/json' };
    if (token) h.Authorization = 'Bearer ' + token;
    return h;
  }
  async function api(path, method, payload, token) {
    const resp = await fetch(base + path, {
      method: method,
      headers: apiHeaders(token),
      body: payload ? JSON.stringify(payload) : undefined,
      cache: 'no-store',
      referrerPolicy: 'no-referrer'
    });
    let data = {};
    try { data = await resp.json(); } catch (_) {}
    if (!resp.ok) {
      const message = data.msg || data.error_description || data.message || data.error || 'Request could not be completed.';
      throw new Error(message);
    }
    return data;
  }
  async function finish(enabled) {
    if (busy || !accessToken) return;
    lock(true);
    try {
      await api('/auth/v1/user', 'PUT', {
        data: {
          readsigil_newsletter_opt_in: enabled,
          readsigil_newsletter_changed_at: new Date().toISOString(),
          readsigil_newsletter_source: 'readsigil.com'
        }
      }, accessToken);
      say(enabled ? 'You are subscribed. Welcome to ReadSigil.' : 'Your subscription preference is now set to unsubscribed.', 'success');
      actions.hidden = true;
      try { await api('/auth/v1/logout', 'POST', {}, accessToken); } catch (_) {}
      accessToken = null;
      sessionStorage.removeItem('rs-newsletter-intent');
    } catch (_) {
      say('We could not save your preference. Please retry, or email privacy@readsigil.com.', 'error');
    } finally { lock(false); }
  }
  async function handleMagicLink() {
    const fragment = new URLSearchParams(location.hash.slice(1));
    const token = fragment.get('access_token');
    const error = fragment.get('error_description');
    if (!token && !error) return;
    history.replaceState({}, '', location.pathname + location.search);
    if (error) {
      say('Your email link could not be verified. Please request a new one.', 'error');
      return;
    }
    accessToken = token;
    form.hidden = true;
    try {
      const user = await api('/auth/v1/user', 'GET', null, token);
      verified.textContent = user.email ? 'Verified: ' + user.email : 'Your email is verified.';
      actions.hidden = false;
      say('Email verified. Choose whether to subscribe or unsubscribe.', 'success');
    } catch (_) {
      accessToken = null;
      say('That verification link has expired. Please request a new one.', 'error');
      form.hidden = false;
    }
  }

  if (manage) {
    document.getElementById('signup-heading').textContent = 'Manage your emails.';
    document.querySelector('.intro').textContent = 'Verify your email to update your ReadSigil subscription.';
    submit.textContent = 'Send email link';
    check.required = false;
    check.closest('label').hidden = true;
  }
  if (!base || !config.anonKey) {
    submit.disabled = true;
    say('Subscriptions are temporarily unavailable. Please try again later.', 'error');
    return;
  }
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (busy) return;
    if (!email.checkValidity()) { email.reportValidity(); return; }
    if (!manage && !check.checked) { check.reportValidity(); return; }
    lock(true);
    try {
      const redirect = location.origin + '/subscribe.html';
      await api('/auth/v1/otp?redirect_to=' + encodeURIComponent(redirect), 'POST', {
        email: email.value.trim().toLowerCase(),
        create_user: true
      });
      sessionStorage.setItem('rs-newsletter-intent', manage ? 'manage' : 'subscribe');
      say('Check your email. Open the verification link to complete your subscription preference.', 'success');
      form.hidden = true;
    } catch (err) {
      say(/rate|limit|too many/i.test(err.message) ? 'Too many attempts. Please try again later.' : 'We could not send the verification email. Please try later or contact privacy@readsigil.com.', 'error');
    } finally { lock(false); }
  });
  confirmYes.addEventListener('click', function () { finish(true); });
  confirmNo.addEventListener('click', function () { finish(false); });
  handleMagicLink();
})();

/* global PocketBase */
"use strict";

// ── PocketBase client ────────────────────────────────────────────────────────
const pb = new PocketBase(window.location.origin);
pb.autoCancellation(false);

// ── DOM refs ─────────────────────────────────────────────────────────────────
const appEl      = document.getElementById("app");
const navLinksEl = document.getElementById("nav-links");

// ── Helpers ──────────────────────────────────────────────────────────────────
function esc(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function starsHtml(rating, maxRating = 5) {
    const filled = Math.round(rating || 0);
    return `<span class="stars">${"★".repeat(filled)}<span class="stars-empty">${"★".repeat(maxRating - filled)}</span></span>`;
}

function formatDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function skeletonGrid(n = 6) {
    const card = `
        <div class="whiskey-card skeleton" aria-hidden="true">
            <div class="card-thumb"></div>
            <div class="card-body">
                <div class="skeleton-line w80"></div>
                <div class="skeleton-line w50"></div>
                <div class="skeleton-line w30"></div>
            </div>
        </div>`;
    return `<div class="whiskey-grid" aria-busy="true" aria-label="Loading whiskeys">${card.repeat(n)}</div>`;
}

function passwordToggle(inputId) {
    return `<button type="button" class="password-toggle" aria-label="Toggle password visibility"
        onclick="(function(btn){var inp=document.getElementById('${inputId}');inp.type=inp.type==='password'?'text':'password';})(this)">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
    </button>`;
}

function imageUrl(record, filename) {
    if (!filename) return null;
    return pb.getFileUrl(record, filename, { thumb: "300x300" });
}

function navigate(path) {
    window.location.hash = "#" + path;
}

function currentUser() {
    return pb.authStore.model;
}

function isAdmin() {
    return currentUser()?.whiskey_admin === true;
}

// ── Router ───────────────────────────────────────────────────────────────────
window.addEventListener("hashchange", route);
window.addEventListener("load", route);

function route() {
    const hash = window.location.hash.replace(/^#/, "") || "/";
    renderNav();

    if (hash === "/" || hash === "") {
        renderHome();
    } else if (hash === "/login") {
        renderLogin();
    } else if (hash === "/register") {
        renderRegister();
    } else if (hash === "/add-whiskey") {
        renderAddWhiskey();
    } else if (hash === "/my-reviews") {
        renderMyReviews();
    } else if (hash.startsWith("/whiskey/")) {
        const id = hash.split("/")[2];
        renderWhiskeyDetail(id);
    } else {
        renderHome();
    }
}

// ── Navbar ───────────────────────────────────────────────────────────────────
function renderNav() {
    const user = currentUser();
    if (!user) {
        navLinksEl.innerHTML = `
            <a href="#/login">Login</a>
            <a href="#/register" class="btn-primary">Register</a>`;
    } else {
        const adminBadge = isAdmin() ? `<span class="admin-badge">ADMIN</span>` : "";
        const userSvg = `<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
        navLinksEl.innerHTML = `
            ${isAdmin() ? `<a href="#/add-whiskey">+ Add Whiskey</a>` : ""}
            <a href="#/my-reviews">My Reviews</a>
            <span style="color:var(--text-muted);font-size:.88rem;display:inline-flex;align-items:center;gap:.35rem;padding:.5rem .6rem">
                ${userSvg} <span>${esc(user.username)}${adminBadge}</span>
            </span>
            <button onclick="logout()">Logout</button>`;
    }
}

function logout() {
    pb.authStore.clear();
    navigate("/");
}

// ── Home – whiskey browse ─────────────────────────────────────────────────────
let _homeRecords   = [];
let _homeAvgRatings = {};

async function renderHome() {
    appEl.innerHTML = skeletonGrid(6);
    try {
        _homeRecords    = await pb.collection("whiskeys").getFullList({ sort: "name" });
        _homeAvgRatings = await loadAverageRatings();

        appEl.innerHTML = `
            <div class="hero">
                <span class="hero-eyebrow">Est. Collection</span>
                <h1>The Art of <em>Whiskey</em></h1>
                <p>Discover and review the world's finest whiskies</p>
                <span class="hero-divider"></span>
            </div>
            <div class="search-bar">
                <div class="search-wrapper">
                    <svg class="search-icon" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <label for="whiskey-search" class="sr-only">Search whiskeys</label>
                    <input
                        id="whiskey-search"
                        type="search"
                        placeholder="Search by name, distillery, country or type…"
                        oninput="filterWhiskeys(this.value)"
                        autocomplete="off"
                        aria-label="Search whiskeys"
                    />
                </div>
            </div>
            <div id="whiskey-grid" class="whiskey-grid"></div>`;

        filterWhiskeys("");
    } catch (err) {
        appEl.innerHTML = `<div class="form-error" role="alert">${esc(err.message)}</div>`;
    }
}

function filterWhiskeys(query) {
    const gridEl = document.getElementById("whiskey-grid");
    if (!gridEl) return;
    const q = query.trim().toLowerCase();
    const filtered = q
        ? _homeRecords.filter(w =>
            [w.name, w.distillery, w.country, w.type]
                .some(v => (v || "").toLowerCase().includes(q)))
        : _homeRecords;

    if (filtered.length === 0) {
        gridEl.innerHTML = `<div class="empty-state"><div class="empty-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div><p>No whiskeys match your search.</p></div>`;
    } else {
        gridEl.innerHTML = filtered.map((w, i) => whiskeyCardHtml(w, _homeAvgRatings[w.id], i)).join("");
    }
}

async function loadNicknames(userIds) {
    try {
        const unique = [...new Set(userIds)].filter(Boolean);
        if (!unique.length) return {};
        const filter = unique.map(id => `user = "${id}"`).join(" || ");
        const profiles = await pb.collection("public_profiles").getFullList({ filter, fields: "user,nickname" });
        const map = {};
        for (const p of profiles) map[p.user] = p.nickname;
        return map;
    } catch (_) {
        return {};
    }
}

async function loadAverageRatings() {
    try {
        const reviews = await pb.collection("reviews").getFullList({ fields: "whiskey,rating" });
        const totals = {};
        const counts = {};
        for (const r of reviews) {
            totals[r.whiskey] = (totals[r.whiskey] || 0) + r.rating;
            counts[r.whiskey] = (counts[r.whiskey] || 0) + 1;
        }
        const avgs = {};
        for (const id of Object.keys(totals)) {
            avgs[id] = { avg: totals[id] / counts[id], count: counts[id] };
        }
        return avgs;
    } catch (_) {
        return {};
    }
}

function whiskeyCardHtml(w, ratingInfo, animIndex = 0) {
    const imgUrl  = imageUrl(w, w.image);
    const thumb   = imgUrl
        ? `<img src="${esc(imgUrl)}" alt="${esc(w.name)}" loading="lazy" />`
        : `<span aria-hidden="true" style="font-size:4rem">🥃</span>`;
    const ratingHtml = ratingInfo
        ? `${starsHtml(ratingInfo.avg)} <span class="review-count">(${ratingInfo.count})</span>`
        : `<span class="text-muted" style="font-size:.82rem">No reviews yet</span>`;
    const delay = animIndex < 12 ? `animation-delay:${animIndex * 0.05}s` : "";

    return `
        <div class="whiskey-card"
             role="button"
             tabindex="0"
             aria-label="${esc(w.name)}${w.distillery ? ` — ${esc(w.distillery)}` : ""}"
             style="${delay}"
             onclick="navigate('/whiskey/${esc(w.id)}')"
             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();navigate('/whiskey/${esc(w.id)}');}"
        >
            <div class="card-thumb">${thumb}</div>
            <div class="card-body">
                <div class="card-name">${esc(w.name)}</div>
                <div class="card-meta">${esc(w.distillery || "")}${w.distillery && w.country ? " · " : ""}${esc(w.country || "")}</div>
                ${w.type ? `<div class="card-type">${esc(w.type)}</div>` : ""}
                <div class="card-stars">${ratingHtml}</div>
            </div>
        </div>`;
}

// ── Whiskey detail ────────────────────────────────────────────────────────────
async function renderWhiskeyDetail(id) {
    appEl.innerHTML = `<div class="loading"><div class="spinner" aria-hidden="true"></div>Loading whiskey…</div>`;
    try {
        const [whiskey, reviewsPage] = await Promise.all([
            pb.collection("whiskeys").getOne(id),
            pb.collection("reviews").getList(1, 200, {
                filter: `whiskey = "${id}"`,
                sort:   "-created",
            }),
        ]);
        const reviews = reviewsPage.items;
        const nicknames = await loadNicknames(reviews.map(r => r.user));
        renderDetailView(whiskey, reviews, nicknames);
    } catch (err) {
        appEl.innerHTML = `
            <a href="#/" class="back-link">Back to whiskeys</a>
            <div class="form-error" role="alert">${esc(err.message)}</div>`;
    }
}

function renderDetailView(w, reviews, nicknames) {
    const imgUrl = imageUrl(w, w.image);
    const imgHtml = imgUrl
        ? `<img src="${esc(imgUrl)}" alt="${esc(w.name)}" />`
        : `<span aria-hidden="true" style="font-size:5rem">🥃</span>`;

    const specsArr = [];
    if (w.distillery) specsArr.push(`<span><strong>Distillery:</strong> ${esc(w.distillery)}</span>`);
    if (w.country)    specsArr.push(`<span><strong>Country:</strong> ${esc(w.country)}</span>`);
    if (w.region)     specsArr.push(`<span><strong>Region:</strong> ${esc(w.region)}</span>`);
    if (w.age)        specsArr.push(`<span><strong>Age:</strong> ${esc(w.age)} years</span>`);
    if (w.abv)        specsArr.push(`<span><strong>ABV:</strong> ${esc(w.abv)}%</span>`);

    const avgRating = reviews.length
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : null;

    const user = currentUser();
    const hasReviewed = user ? reviews.some(r => r.user === user.id) : false;

    const reviewsHtml = reviews.length === 0
        ? `<div class="empty-state"><div class="empty-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div><p>No reviews yet. Be the first!</p></div>`
        : reviews.map(r => reviewCardHtml(r, nicknames)).join("");

    const addReviewHtml = !user
        ? `<p class="text-muted mb-2">
               <a href="#/login">Login</a> or <a href="#/register">register</a> to write a review.
           </p>`
        : hasReviewed
            ? `<p class="text-muted mb-2">You've already reviewed this whiskey.</p>`
            : reviewFormHtml(w.id);

    appEl.innerHTML = `
        <a href="#/" class="back-link">Back to whiskeys</a>
        <div class="detail-header">
            <div class="detail-image">${imgHtml}</div>
            <div class="detail-info">
                <h1>${esc(w.name)}</h1>
                ${w.type ? `<div class="type-badge">${esc(w.type)}</div>` : ""}
                <div class="specs">${specsArr.join("")}</div>
                ${avgRating !== null
                    ? `<div class="mb-1">${starsHtml(avgRating)} <span class="review-count">${reviews.length} review${reviews.length !== 1 ? "s" : ""}</span></div>`
                    : `<div class="text-muted mb-1">No reviews yet</div>`}
                ${w.description ? `<p class="description">${esc(w.description)}</p>` : ""}
                ${isAdmin() ? `<div style="margin-top:1rem"><a href="#/edit-whiskey/${esc(w.id)}" class="btn btn-outline btn-sm">Edit Whiskey</a></div>` : ""}
            </div>
        </div>

        <h2 class="section-title">Reviews</h2>
        ${addReviewHtml}
        <div id="reviews-list">${reviewsHtml}</div>`;

    // Bind review form submit
    const form = document.getElementById("review-form");
    if (form) {
        form.addEventListener("submit", e => submitReview(e, w.id));
    }
}

function reviewCardHtml(r, nicknames) {
    const username = nicknames?.[r.user] ?? "Unknown";
    const canDelete = currentUser()?.id === r.user;
    return `
        <div class="review-card" id="review-${esc(r.id)}">
            <div class="review-header">
                <span>
                    ${starsHtml(r.rating)}
                    <span class="review-username">@${esc(username)}</span>
                </span>
                <span class="review-date">${formatDate(r.created)}</span>
            </div>
            ${r.title ? `<div class="review-title">${esc(r.title)}</div>` : ""}
            ${r.body  ? `<div class="review-body">${esc(r.body)}</div>`   : ""}
            ${canDelete ? `
                <div class="review-actions">
                    <button class="btn btn-danger btn-sm" onclick="deleteReview('${esc(r.id)}', '${esc(r.whiskey)}')">Delete</button>
                </div>` : ""}
        </div>`;
}

function reviewFormHtml(whiskeyId) {
    return `
        <div class="form-card mb-3" style="max-width:600px;margin-left:0">
            <h2>Write a Review</h2>
            <div id="review-error" role="alert" aria-live="polite"></div>
            <form id="review-form">
                <input type="hidden" name="whiskey" value="${esc(whiskeyId)}" />
                <div class="form-group">
                    <fieldset style="border:none;padding:0">
                        <legend style="display:block;font-weight:500;font-size:.83rem;margin-bottom:.45rem;color:var(--text-mid);letter-spacing:.04em;text-transform:uppercase">Rating *</legend>
                        <div class="star-input">
                            ${[5,4,3,2,1].map(n => `
                            <input type="radio" name="rating" id="star${n}" value="${n}" ${n === 5 ? "required" : ""} aria-label="${n} star${n !== 1 ? "s" : ""}" />
                            <label for="star${n}" aria-hidden="true" title="${n} star${n !== 1 ? "s" : ""}">★</label>`).join("")}
                        </div>
                    </fieldset>
                </div>
                <div class="form-group">
                    <label for="rev-title">Title</label>
                    <input type="text" id="rev-title" name="title" placeholder="e.g. A superb dram" maxlength="200" />
                </div>
                <div class="form-group">
                    <label for="rev-body">Your Review</label>
                    <textarea id="rev-body" name="body" placeholder="Share your tasting notes, impressions…"></textarea>
                </div>
                <button type="submit" class="btn btn-amber">Submit Review</button>
            </form>
        </div>`;
}

async function submitReview(e, whiskeyId) {
    e.preventDefault();
    const form  = e.target;
    const errEl = document.getElementById("review-error");
    const btn   = form.querySelector('button[type="submit"]');
    errEl.innerHTML = "";

    const ratingInput = form.querySelector('input[name="rating"]:checked');
    if (!ratingInput) {
        errEl.innerHTML = `<div class="form-error">Please select a rating.</div>`;
        return;
    }

    btn.disabled = true;
    btn.textContent = "Submitting…";

    const data = {
        whiskey: whiskeyId,
        user:    currentUser().id,
        rating:  parseInt(ratingInput.value, 10),
        title:   form.title.value.trim(),
        body:    form.body.value.trim(),
    };

    try {
        await pb.collection("reviews").create(data);
        renderWhiskeyDetail(whiskeyId);
    } catch (err) {
        const msg = err.response?.message || err.message || "Failed to submit review.";
        errEl.innerHTML = `<div class="form-error">${esc(msg)}</div>`;
        btn.disabled = false;
        btn.textContent = "Submit Review";
    }
}

async function deleteReview(reviewId, whiskeyId) {
    if (!confirm("Delete this review?")) return;
    try {
        await pb.collection("reviews").delete(reviewId);
        renderWhiskeyDetail(whiskeyId);
    } catch (err) {
        alert("Failed to delete review: " + err.message);
    }
}

// ── Login ─────────────────────────────────────────────────────────────────────
function renderLogin() {
    if (currentUser()) return navigate("/");
    appEl.innerHTML = `
        <div class="form-card">
            <h2>Login</h2>
            <div id="login-error" role="alert" aria-live="polite"></div>
            <form id="login-form">
                <div class="form-group">
                    <label for="login-email">Email or Username</label>
                    <input type="text" id="login-email" required autocomplete="username" />
                </div>
                <div class="form-group">
                    <label for="login-pass">Password</label>
                    <div class="password-wrapper">
                        <input type="password" id="login-pass" required autocomplete="current-password" />
                        ${passwordToggle("login-pass")}
                    </div>
                </div>
                <button type="submit" class="btn btn-amber" style="width:100%">Login</button>
            </form>
            <div class="form-footer">Don't have an account? <a href="#/register">Register</a></div>
        </div>`;
    document.getElementById("login-form").addEventListener("submit", handleLogin);
}

async function handleLogin(e) {
    e.preventDefault();
    const errEl = document.getElementById("login-error");
    const btn   = e.target.querySelector('button[type="submit"]');
    const identity = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-pass").value;
    errEl.innerHTML = "";
    btn.disabled = true;
    btn.textContent = "Logging in…";
    try {
        await pb.collection("users").authWithPassword(identity, password);
        navigate("/");
    } catch (err) {
        const msg = err.response?.message || err.message || "Login failed.";
        errEl.innerHTML = `<div class="form-error">${esc(msg)}</div>`;
        btn.disabled = false;
        btn.textContent = "Login";
    }
}

// ── Register ──────────────────────────────────────────────────────────────────
function renderRegister() {
    if (currentUser()) return navigate("/");
    appEl.innerHTML = `
        <div class="form-card">
            <h2>Create Account</h2>
            <p class="text-muted mb-2" style="font-size:.9rem">Your username is your public display name on reviews.</p>
            <div id="reg-error" role="alert" aria-live="polite"></div>
            <form id="reg-form">
                <div class="form-group">
                    <label for="reg-username">Username *</label>
                    <input type="text" id="reg-username" required minlength="3" maxlength="40"
                           placeholder="e.g. whiskey_lover42" autocomplete="username" />
                </div>
                <div class="form-group">
                    <label for="reg-email">Email *</label>
                    <input type="email" id="reg-email" required autocomplete="email" />
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="reg-pass">Password *</label>
                        <div class="password-wrapper">
                            <input type="password" id="reg-pass" required minlength="8" autocomplete="new-password" />
                            ${passwordToggle("reg-pass")}
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="reg-pass2">Confirm *</label>
                        <div class="password-wrapper">
                            <input type="password" id="reg-pass2" required minlength="8" autocomplete="new-password" />
                            ${passwordToggle("reg-pass2")}
                        </div>
                    </div>
                </div>
                <button type="submit" class="btn btn-amber" style="width:100%">Create Account</button>
            </form>
            <div class="form-footer">Already have an account? <a href="#/login">Login</a></div>
        </div>`;
    document.getElementById("reg-form").addEventListener("submit", handleRegister);
}

async function handleRegister(e) {
    e.preventDefault();
    const errEl = document.getElementById("reg-error");
    const btn   = e.target.querySelector('button[type="submit"]');
    const username = document.getElementById("reg-username").value.trim();
    const email    = document.getElementById("reg-email").value.trim();
    const pass     = document.getElementById("reg-pass").value;
    const pass2    = document.getElementById("reg-pass2").value;
    errEl.innerHTML = "";

    if (pass !== pass2) {
        errEl.innerHTML = `<div class="form-error">Passwords do not match.</div>`;
        return;
    }

    btn.disabled = true;
    btn.textContent = "Creating account…";

    try {
        await pb.collection("users").create({
            username,
            email,
            password: pass,
            passwordConfirm: pass2,
            emailVisibility: false,
        });
        await pb.collection("users").authWithPassword(email, pass);
        await pb.collection("public_profiles").create({
            user:     pb.authStore.model.id,
            nickname: username,
        });
        navigate("/");
    } catch (err) {
        const data   = err.response?.data || {};
        const fields = Object.entries(data).map(([k, v]) => `<strong>${esc(k)}</strong>: ${esc(v?.message ?? v)}`).join("<br>");
        const msg    = fields || esc(err.response?.message || err.message || "Registration failed.");
        errEl.innerHTML = `<div class="form-error">${msg}</div>`;
        btn.disabled = false;
        btn.textContent = "Create Account";
    }
}

// ── Add Whiskey (admin) ───────────────────────────────────────────────────────
function renderAddWhiskey() {
    if (!currentUser()) return navigate("/login");
    if (!isAdmin()) {
        appEl.innerHTML = `<div class="form-error">Access denied. Whiskey admin role required.</div>`;
        return;
    }
    appEl.innerHTML = `
        <a href="#/" class="back-link">Back to whiskeys</a>
        <div class="form-card" style="max-width:700px;margin:0 auto">
            <h2>Add Whiskey</h2>
            <div id="wsk-error" role="alert" aria-live="polite"></div>
            <div id="wsk-success" aria-live="polite"></div>
            <form id="wsk-form" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="wsk-name">Name *</label>
                    <input type="text" id="wsk-name" required placeholder="e.g. Glenfiddich 12 Year Old" />
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="wsk-distillery">Distillery</label>
                        <input type="text" id="wsk-distillery" placeholder="e.g. Glenfiddich" />
                    </div>
                    <div class="form-group">
                        <label for="wsk-type">Type</label>
                        <select id="wsk-type">
                            <option value="">— select —</option>
                            <option>Single Malt Scotch</option>
                            <option>Blended Scotch</option>
                            <option>Bourbon</option>
                            <option>Rye</option>
                            <option>Irish</option>
                            <option>Japanese</option>
                            <option>Canadian</option>
                            <option>Other</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="wsk-country">Country</label>
                        <input type="text" id="wsk-country" placeholder="e.g. Scotland" />
                    </div>
                    <div class="form-group">
                        <label for="wsk-region">Region</label>
                        <input type="text" id="wsk-region" placeholder="e.g. Speyside" />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="wsk-age">Age (years)</label>
                        <input type="number" id="wsk-age" min="0" max="100" placeholder="e.g. 12" />
                    </div>
                    <div class="form-group">
                        <label for="wsk-abv">ABV (%)</label>
                        <input type="number" id="wsk-abv" min="0" max="100" step="0.1" placeholder="e.g. 43.0" />
                    </div>
                </div>
                <div class="form-group">
                    <label for="wsk-description">Description</label>
                    <textarea id="wsk-description" rows="4" placeholder="Tasting notes, history, character…"></textarea>
                </div>
                <div class="form-group">
                    <label for="wsk-image">Image (optional)</label>
                    <input type="file" id="wsk-image" accept="image/*" style="background:transparent;border:none;padding:0" />
                </div>
                <button type="submit" class="btn btn-amber">Add Whiskey</button>
            </form>
        </div>`;
    document.getElementById("wsk-form").addEventListener("submit", handleAddWhiskey);
}

async function handleAddWhiskey(e) {
    e.preventDefault();
    const errEl  = document.getElementById("wsk-error");
    const succEl = document.getElementById("wsk-success");
    errEl.innerHTML  = "";
    succEl.innerHTML = "";

    const formData = new FormData();
    formData.append("name",        document.getElementById("wsk-name").value.trim());
    formData.append("distillery",  document.getElementById("wsk-distillery").value.trim());
    formData.append("type",        document.getElementById("wsk-type").value);
    formData.append("country",     document.getElementById("wsk-country").value.trim());
    formData.append("region",      document.getElementById("wsk-region").value.trim());
    const age = document.getElementById("wsk-age").value;
    const abv = document.getElementById("wsk-abv").value;
    if (age) formData.append("age", age);
    if (abv) formData.append("abv", abv);
    formData.append("description", document.getElementById("wsk-description").value.trim());
    const imageFile = document.getElementById("wsk-image").files[0];
    if (imageFile) formData.append("image", imageFile);

    if (!formData.get("name")) {
        errEl.innerHTML = `<div class="form-error">Name is required.</div>`;
        return;
    }

    try {
        const record = await pb.collection("whiskeys").create(formData);
        succEl.innerHTML = `<div class="form-success">Whiskey added! <a href="#/whiskey/${record.id}">View it →</a></div>`;
        e.target.reset();
    } catch (err) {
        const data   = err.response?.data || {};
        const fields = Object.entries(data).map(([k, v]) => `<strong>${esc(k)}</strong>: ${esc(v?.message ?? v)}`).join("<br>");
        const msg    = fields || esc(err.response?.message || err.message || "Failed to add whiskey.");
        errEl.innerHTML = `<div class="form-error">${msg}</div>`;
    }
}

// ── My Reviews ────────────────────────────────────────────────────────────────
async function renderMyReviews() {
    const user = currentUser();
    if (!user) return navigate("/login");

    appEl.innerHTML = `<div class="loading"><div class="spinner" aria-hidden="true"></div>Loading your reviews…</div>`;
    try {
        const reviews = await pb.collection("reviews").getFullList({
            filter: `user = "${user.id}"`,
            sort:   "-created",
            expand: "whiskey",
        });

        const cardsHtml = reviews.length === 0
            ? `<div class="empty-state"><div class="empty-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div><p>You haven't written any reviews yet. <a href="#/">Browse whiskeys</a> to get started!</p></div>`
            : reviews.map(r => myReviewCardHtml(r)).join("");

        appEl.innerHTML = `
            <h1 class="section-title" style="margin-bottom:1.5rem">My Reviews <span style="font-size:1rem;font-weight:400;color:var(--mid)">(${reviews.length})</span></h1>
            ${cardsHtml}`;
    } catch (err) {
        appEl.innerHTML = `<div class="form-error">Failed to load your reviews: ${esc(err.message)}</div>`;
    }
}

function myReviewCardHtml(r) {
    const w = r.expand?.whiskey;
    const whiskeyName = w ? esc(w.name) : "Unknown Whiskey";
    const whiskeyLink = w
        ? `<a href="#/whiskey/${esc(w.id)}" class="my-review-whiskey">${whiskeyName}</a>`
        : `<span class="my-review-whiskey">${whiskeyName}</span>`;
    return `
        <div class="review-card" id="review-${esc(r.id)}">
            <div class="review-header">
                <span>
                    ${starsHtml(r.rating)}
                    ${whiskeyLink}
                </span>
                <span class="review-date">${formatDate(r.created)}</span>
            </div>
            ${r.title ? `<div class="review-title">${esc(r.title)}</div>` : ""}
            ${r.body  ? `<div class="review-body">${esc(r.body)}</div>`   : ""}
            <div class="review-actions">
                <a href="#/whiskey/${w ? esc(w.id) : ""}" class="btn btn-outline btn-sm">View Whiskey</a>
                <button class="btn btn-danger btn-sm" onclick="deleteMyReview('${esc(r.id)}')">
                    Delete
                </button>
            </div>
        </div>`;
}

async function deleteMyReview(reviewId) {
    if (!confirm("Delete this review?")) return;
    try {
        await pb.collection("reviews").delete(reviewId);
        renderMyReviews();
    } catch (err) {
        alert("Failed to delete review: " + err.message);
    }
}

// ── Expose globals used in inline handlers ────────────────────────────────────
window.navigate        = navigate;
window.logout          = logout;
window.deleteReview    = deleteReview;
window.deleteMyReview  = deleteMyReview;

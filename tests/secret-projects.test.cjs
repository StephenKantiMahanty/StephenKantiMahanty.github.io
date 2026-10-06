const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => readFileSync(path.join(root, file), 'utf8');
const script = read('script.js');
const home = read('index.html');
const secret = read('secret/index.html');
const attributes = tag => Object.fromEntries(
    [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]])
);

function element(classes = []) {
    const classNames = new Set(classes);
    const listeners = new Map();
    return {
        classList: {
            add: name => classNames.add(name),
            remove: name => classNames.delete(name),
            contains: name => classNames.has(name),
            toggle(name, enabled) {
                if (enabled) classNames.add(name);
                else classNames.delete(name);
            }
        },
        style: { setProperty() {} },
        dataset: {},
        target: '',
        hasAttribute: () => false,
        addEventListener(name, fn) { listeners.set(name, fn); },
        dispatch(name, event) { listeners.get(name)?.(event); },
        closest(selector) {
            if (selector === '.component') return classNames.has('component') ? this : null;
            return this;
        },
        focus() { this.focused = true; }
    };
}

function loadPage({ reducedMotion = false, isHome = true } = {}) {
    const link = element(['voltage-value', 'secret-projects-link']);
    link.href = 'https://portfolio.test/secret/';
    const slider = element();
    slider.value = '5';
    const body = element();
    const component = element(['component']);
    const back = element(['back-button']);
    back.href = 'https://portfolio.test/index.html';
    const document = element();
    document.body = body;
    document.documentElement = element();
    document.activeElement = body;
    document.querySelector = selector => isHome ? {
        '.voltage-value': link, '.voltage-control': slider
    }[selector] || null : null;
    document.querySelectorAll = selector => {
        if (selector === '.component') return isHome ? [component] : [];
        if (selector === '.component, .back-button, .secret-projects-link') {
            return isHome ? [component, link] : [back];
        }
        if (selector === '.back-button') return isHome ? [] : [back];
        if (selector === '.is-activating') return [link, back].filter(
            item => item.classList.contains('is-activating')
        );
        return [];
    };
    const destinations = [];
    const timers = [];
    const window = element();
    window.matchMedia = query => ({ matches: query.includes('reduced-motion') && reducedMotion });
    window.location = { assign: href => destinations.push(href) };
    window.setTimeout = (fn, delay) => timers.push({ fn, delay });
    vm.runInNewContext(script, { document, window });
    document.dispatch('DOMContentLoaded');
    return { link, slider, body, component, back, document, window, destinations,
        flush: () => timers.sort((a, b) => a.delay - b.delay).forEach(timer => timer.fn()) };
}

function click(overrides = {}) {
    return { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...overrides };
}

test('voltage readout links to the hidden page and keeps its default value', () => {
    const tag = home.match(/<a\b[^>]*class="[^"]*secret-projects-link[^>]*>/)[0];
    assert.equal(attributes(tag).href, 'secret/');
    assert.equal(attributes(tag)['aria-label'], 'Open secret projects');
    assert.match(home, /secret-projects-link[^>]*>5\.0V<\/a>/);
    assert.doesNotMatch(home, /<label class="voltage-indicator">/);
    assert.match(home, /class="voltage-control"[^>]*value="5"/);
});

test('four cards open existing projects in new tabs and the footer matches', () => {
    const cards = [...secret.matchAll(/<a\b[^>]*class="project-bubble"[^>]*>/g)];
    assert.equal(cards.length, 4);
    assert.deepEqual(cards.map(match => attributes(match[0]).href),
        ['../circular/', '../cad-machining/', '../upload/', '../kalman/']);
    assert.match(secret, /END OF LINE \/ 4 PROJECTS/);
    for (const [tag] of cards) {
        const attrs = attributes(tag);
        assert.equal(attrs.target, '_blank');
        assert.equal(attrs.rel, 'noopener noreferrer');
        assert.ok(existsSync(path.resolve(root, 'secret', attrs.href, 'index.html')));
        for (const id of `${attrs['aria-labelledby']} ${attrs['aria-describedby']}`.split(' ')) {
            assert.ok(secret.includes(`id="${id}"`), `Missing accessible text: ${id}`);
        }
    }
    assert.doesNotMatch(secret, /stephen-ai/);
    assert.match(secret, /name="robots" content="noindex, nofollow"/);
});

test('all local stylesheets and scripts resolve for the hidden page', () => {
    for (const [, resource] of secret.matchAll(/(?:href|src)="([^"]+\.(?:css|js))"/g)) {
        assert.ok(existsSync(path.resolve(root, 'secret', resource)), resource);
    }
    assert.match(secret, /href="\.\.\/index\.html" class="back-button"/);
});

test('secret page uses natural document scrolling and a responsive card column', () => {
    const css = read('secret/styles.css');
    assert.doesNotMatch(secret, /class="(?:home-page|circuit-container|hero-section|content-section)/);
    assert.doesNotMatch(css, /(?:^|[;{])\s*height:\s*100(?:s?vh|%)|overflow(?:-y)?:\s*hidden|position:\s*fixed/);
    assert.match(css, /width: min\(100%, 860px\)/);
    assert.match(css, /grid-template-columns: 48px minmax\(0, 1fr\) 24px/);
    assert.match(css, /@media \(max-width: 520px\)/);
    assert.match(css, /overflow-wrap: anywhere/);
    assert.match(read('styles.css'), /scrollbar-color: var\(--dim-green\) var\(--bg-darker\)/);
});

test('clicking the readout navigates after the shared transition', () => {
    const page = loadPage();
    const event = click();
    page.link.dispatch('click', event);
    assert.equal(event.defaultPrevented, true);
    assert.equal(page.destinations.length, 0);
    page.flush();
    assert.deepEqual(page.destinations, ['https://portfolio.test/secret/']);
});

test('changed voltage keeps the link functional', () => {
    const page = loadPage();
    assert.equal(page.link.textContent, '5.0V');
    page.slider.dispatch('input', { target: { value: '7.2' } });
    assert.equal(page.link.textContent, '7.2V');
    assert.equal(page.link.href, 'https://portfolio.test/secret/');
    page.link.dispatch('click', click());
    page.flush();
    assert.deepEqual(page.destinations, ['https://portfolio.test/secret/']);
});

test('modified clicks keep native browser behavior', () => {
    for (const key of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey', 'defaultPrevented']) {
        const page = loadPage();
        const event = click({ [key]: true });
        page.link.dispatch('click', event);
        page.flush();
        assert.deepEqual(page.destinations, []);
        if (key !== 'defaultPrevented') assert.equal(event.defaultPrevented, false);
    }
});

test('reduced motion navigates immediately', () => {
    const page = loadPage({ reducedMotion: true });
    page.link.dispatch('click', click());
    assert.deepEqual(page.destinations, ['https://portfolio.test/secret/']);
});

test('keyboard shortcuts leave the slider and readout keys alone', () => {
    const page = loadPage();
    for (const target of [page.slider, page.link]) {
        for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', ' ', 'Enter']) {
            page.document.activeElement = target;
            const event = click({ key, target });
            page.document.dispatch('keydown', event);
            assert.equal(event.defaultPrevented, false, key);
            assert.equal(page.component.focused, undefined);
        }
    }
    const event = click({ key: 'ArrowDown', target: page.component });
    page.document.activeElement = page.component;
    page.document.dispatch('keydown', event);
    assert.equal(event.defaultPrevented, true);
    assert.equal(page.component.focused, true);
});

test('hidden page initializes without homepage controls and returns home', () => {
    const page = loadPage({ isHome: false });
    page.back.dispatch('click', click());
    page.flush();
    assert.deepEqual(page.destinations, ['https://portfolio.test/index.html']);
});

test('back/forward restoration clears leaving and activation states', () => {
    const page = loadPage();
    page.link.dispatch('click', click());
    page.flush();
    assert.equal(page.body.classList.contains('page-leaving'), true);
    page.window.dispatch('pageshow');
    assert.equal(page.body.classList.contains('page-leaving'), false);
    assert.equal(page.link.classList.contains('is-activating'), false);
});

test('existing Worker routing serves the hidden page, projects, and assets', async () => {
    const worker = (await import(`data:text/javascript;base64,${Buffer.from(read('worker.js')).toString('base64')}`)).default;
    const env = { ASSETS: { async fetch(request) {
        let relative = decodeURIComponent(new URL(request.url).pathname).replace(/^\//, '');
        if (!relative || relative.endsWith('/')) relative += 'index.html';
        const file = path.resolve(root, relative);
        if (!file.startsWith(root + path.sep)) return new Response(null, { status: 403 });
        return existsSync(file) ? new Response(readFileSync(file)) : new Response(null, { status: 404 });
    } } };
    for (const route of ['/secret/', '/secret/index.html', '/secret/styles.css', '/styles.css', '/script.js', '/circular/', '/cad-machining/', '/upload/', '/kalman/', '/kalman/model.js', '/kalman/app.js', '/kalman/styles.css']) {
        const response = await worker.fetch(new Request(`https://portfolio.test${route}`), env);
        assert.equal(response.status, 200, route);
        assert.ok((await response.text()).length > 0, route);
    }
});

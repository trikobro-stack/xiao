const SAVE_KEY = 'mistbound-game-saves';
const SETTINGS_KEY = 'mistbound-game-settings';
const LEGACY_SAVE_KEY = 'signal-game-saves';
const LEGACY_SETTINGS_KEY = 'signal-game-settings';
const defaultSettings = { master: 75, music: 62, effects: 80, subtitles: true, language: 'Русский', difficulty: 'Обычная' };

function readStorage(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

const storedSettings = { ...defaultSettings, ...readStorage(SETTINGS_KEY, readStorage(LEGACY_SETTINGS_KEY, {})) };
if (!['Спокойная', 'Обычная', 'Сложная'].includes(storedSettings.difficulty)) storedSettings.difficulty = defaultSettings.difficulty;
if (storedSettings.language !== 'Русский') storedSettings.language = defaultSettings.language;

const state = {
    view: 'home',
    difficulty: storedSettings.difficulty,
    saves: readStorage(SAVE_KEY, readStorage(LEGACY_SAVE_KEY, [])),
    settings: storedSettings,
    toastTimer: null
};

const panel = document.getElementById('menu-panel');

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function persistSaves() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state.saves));
}

function persistSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function formatDate(value) {
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function renderHome() {
    const lastSave = [...state.saves].sort((a, b) => b.updatedAt - a.updatedAt)[0];
    return `<p class="panel-kicker">ГЛАВНОЕ МЕНЮ</p>
        <h2 class="panel-title">Туман хранит древнюю тайну.</h2>
        <p class="panel-copy">Меню Mistbound. Игровая сцена отключена; сохранения и настройки доступны отдельно.</p>
        <div class="save-summary"><span>ПОСЛЕДНЕЕ СОХРАНЕНИЕ</span><strong>${lastSave ? `СЛОТ ${String(lastSave.slot).padStart(2, '0')} · ${formatDate(lastSave.updatedAt)}` : 'ПОКА НЕТ'}</strong></div>
        <div class="action-row"><button class="game-button secondary" type="button" data-view="saves">Открыть сохранения</button><button class="game-button secondary" type="button" data-view="settings">Настройки</button></div>`;
}

function renderSolo() {
    return `<p class="panel-kicker">ОДИНОЧНЫЙ РЕЖИМ</p>
        <h2 class="panel-title">Игровой процесс отключён</h2>
        <p class="panel-copy">Настройка сложности остаётся сохранённой в этом браузере.</p>
        <div class="option-group" role="group" aria-label="Сложность игры">${['Спокойная', 'Обычная', 'Сложная'].map(level => `<button class="option-button" type="button" data-difficulty="${level}" aria-pressed="${state.difficulty === level}">${level}</button>`).join('')}</div>
        <div class="action-row"><button class="game-button secondary" type="button" data-view="saves">Просмотреть сохранения</button></div>`;
}

function renderCoop() {
    return `<p class="panel-kicker">СОВМЕСТНЫЙ РЕЖИМ</p>
        <h2 class="panel-title">Игровой процесс отключён</h2>
        <p class="panel-copy">Совместный и сетевой режимы сейчас недоступны. Сохранённые слоты можно просмотреть отдельно.</p>
        <div class="action-row"><button class="game-button secondary" type="button" data-view="saves">Просмотреть сохранения</button></div>`;
}

function renderSaves() {
    const slots = [1, 2, 3].map(slot => {
        const save = state.saves.find(item => item.slot === slot);
        const details = save ? `<span>${escapeHtml(save.modeLabel || 'Mistbound')} · ${escapeHtml(save.progress || 'Сохранено')} · ${formatDate(save.updatedAt)}</span>` : '<span class="slot-empty">ПУСТО</span>';
        const actions = save ? `<div class="slot-actions"><button type="button" data-action="delete-save" data-id="${escapeHtml(save.id)}" aria-label="Удалить сохранение в слоте ${slot}">Удалить</button></div>` : '';
        return `<div class="save-slot"><div><strong>СЛОТ ${String(slot).padStart(2, '0')}</strong>${details}</div>${actions}</div>`;
    }).join('');
    return `<p class="panel-kicker">СЛОТЫ ИГРЫ</p><h2 class="panel-title">Сохранения</h2><p class="panel-copy">Сохранённые данные оставлены в этом браузере. Загрузка игрового мира отключена.</p><div class="save-list">${slots}</div>`;
}

function renderSettings() {
    const settingRange = (key, label) => `<label class="setting-row"><span>${label}</span><input type="range" min="0" max="100" value="${state.settings[key]}" data-setting="${key}" aria-label="${label}"><output data-output="${key}">${state.settings[key]}%</output></label>`;
    return `<p class="panel-kicker">НАСТРОЙКИ</p><h2 class="panel-title">Настрой под себя</h2>
        <div class="setting-list">${settingRange('master', 'Общая громкость')}${settingRange('music', 'Музыка')}${settingRange('effects', 'Звуковые эффекты')}
            <div class="setting-row toggle-row"><span>Субтитры</span><button class="toggle-control" type="button" role="switch" aria-checked="${state.settings.subtitles}" data-setting="subtitles" aria-label="Субтитры"></button></div>
            <label class="setting-row"><span>Язык</span><select data-setting="language" aria-label="Язык"><option selected>Русский</option><option disabled>English — скоро</option></select><output></output></label>
        </div><p class="settings-note">Игровой процесс отключён. Эти параметры сохраняются в браузере, но не влияют на игру.</p><div class="setting-actions"><button class="game-button secondary" type="button" data-action="fullscreen">Во весь экран</button><button class="subtle-button" type="button" data-action="reset-settings">Сбросить настройки</button></div>`;
}

function render() {
    const views = { home: renderHome, solo: renderSolo, coop: renderCoop, saves: renderSaves, settings: renderSettings };
    panel.innerHTML = (views[state.view] || renderHome)();
    document.querySelectorAll('.game-nav [data-view]').forEach(button => {
        button.setAttribute('aria-current', button.dataset.view === state.view ? 'page' : 'false');
    });
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove('visible'), 2400);
}

function updateSetting(target) {
    const key = target.dataset.setting;
    if (!key) return;
    state.settings[key] = target.type === 'range' ? Number(target.value) : target.matches('[role="switch"]') ? target.getAttribute('aria-checked') !== 'true' : target.value;
    persistSettings();
    if (target.type === 'range') target.parentElement.querySelector('output').value = `${target.value}%`;
    if (target.matches('[role="switch"]')) target.setAttribute('aria-checked', String(state.settings[key]));
}

document.addEventListener('click', event => {
    const settingSwitch = event.target.closest('[data-setting][role="switch"]');
    if (settingSwitch) {
        updateSetting(settingSwitch);
        return;
    }
    const viewButton = event.target.closest('[data-view]');
    if (viewButton && !viewButton.disabled) {
        state.view = viewButton.dataset.view;
        render();
        return;
    }
    const difficultyButton = event.target.closest('[data-difficulty]');
    if (difficultyButton) {
        state.difficulty = difficultyButton.dataset.difficulty;
        state.settings.difficulty = state.difficulty;
        persistSettings();
        render();
        return;
    }
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === 'delete-save') {
        state.saves = state.saves.filter(save => String(save.id) !== id);
        persistSaves();
        render();
        showToast('Сохранение удалено.');
    }
    if (action === 'reset-settings') {
        state.settings = { ...defaultSettings };
        state.difficulty = defaultSettings.difficulty;
        persistSettings();
        render();
        showToast('Настройки сброшены.');
    }
    if (action === 'fullscreen') {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen?.().catch(() => showToast('Полноэкранный режим недоступен.'));
    }
});

document.addEventListener('input', event => {
    if (event.target.matches('[data-setting]')) updateSetting(event.target);
});

document.addEventListener('change', event => {
    if (event.target.matches('[data-setting]')) updateSetting(event.target);
});

document.addEventListener('keydown', event => {
    const menuItems = [...document.querySelectorAll('.game-nav .menu-item:not(:disabled)')];
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && menuItems.length) {
        event.preventDefault();
        const index = menuItems.indexOf(event.target);
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const nextIndex = index < 0 ? (direction > 0 ? 0 : menuItems.length - 1) : (index + direction + menuItems.length) % menuItems.length;
        menuItems[nextIndex].focus();
        return;
    }
    if (event.key === 'Escape' && state.view !== 'home') {
        state.view = 'home';
        render();
    }
});

render();
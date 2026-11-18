const SAVE_KEY = 'signal-game-saves';
const SETTINGS_KEY = 'signal-game-settings';
const defaultSettings = { master: 75, music: 62, effects: 80, subtitles: true, language: 'Русский' };

function readStorage(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch {
        return fallback;
    }
}

const state = {
    view: 'home',
    mode: 'solo',
    difficulty: 'Обычная',
    saves: readStorage(SAVE_KEY, []),
    settings: { ...defaultSettings, ...readStorage(SETTINGS_KEY, {}) },
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
        <h2 class="panel-title">Путь начинается с сигнала.</h2>
        <p class="panel-copy">Исследуй заброшенный сектор, следуй за голосом в эфире и решай, кому ответить.</p>
        <div class="save-summary"><span>ПОСЛЕДНЕЕ СОХРАНЕНИЕ</span><strong>${lastSave ? `СЛОТ ${String(lastSave.slot).padStart(2, '0')} · ${formatDate(lastSave.updatedAt)}` : 'ПОКА НЕТ'}</strong></div>
        <div class="action-row"><button class="game-button" type="button" data-action="start-new" data-mode="solo">Начать новую игру <span class="button-arrow">↗</span></button><button class="game-button secondary" type="button" data-action="continue" ${lastSave ? '' : 'disabled'}>Продолжить</button></div>`;
}

function renderSolo() {
    return `<p class="panel-kicker">ОДИНОЧНОЕ ПУТЕШЕСТВИЕ</p>
        <h2 class="panel-title">Выбери темп экспедиции</h2>
        <p class="panel-copy">История одна и та же. Настрой только то, насколько опасным будет путь.</p>
        <div class="option-group" role="group" aria-label="Сложность игры">${['Спокойная', 'Обычная', 'Сложная'].map(level => `<button class="option-button" type="button" data-difficulty="${level}" aria-pressed="${state.difficulty === level}">${level}</button>`).join('')}</div>
        <div class="action-row"><button class="game-button" type="button" data-action="start-new" data-mode="solo">Начать экспедицию <span class="button-arrow">↗</span></button>${state.saves.length ? '<button class="game-button secondary" type="button" data-action="continue">Загрузить последнее</button>' : ''}</div>`;
}

function renderCoop() {
    return `<p class="panel-kicker">СОВМЕСТНАЯ ЭКСПЕДИЦИЯ</p>
        <h2 class="panel-title">Два игрока. Один сигнал.</h2>
        <p class="panel-copy">Локальная игра рассчитана на двоих за одним устройством. Онлайн-комнаты появятся, когда будет подключён сервер.</p>
        <div class="save-summary"><span>РЕЖИМ</span><strong>ЛОКАЛЬНЫЙ · 2 ИГРОКА</strong></div>
        <div class="action-row"><button class="game-button" type="button" data-action="start-new" data-mode="coop">Начать вдвоём <span class="button-arrow">↗</span></button><button class="game-button secondary" type="button" data-action="online-info">Онлайн · скоро</button></div>`;
}

function renderSaves() {
    const slots = [1, 2, 3].map(slot => {
        const save = state.saves.find(item => item.slot === slot);
        return `<div class="save-slot"><div><strong>СЛОТ ${String(slot).padStart(2, '0')}</strong>${save ? `<span>${escapeHtml(save.modeLabel)} · ${escapeHtml(save.progress)} · ${formatDate(save.updatedAt)}</span>` : '<span class="slot-empty">ПУСТО</span>'}</div>${save ? `<div class="slot-actions"><button type="button" data-action="load-save" data-id="${save.id}">Загрузить</button><button type="button" data-action="delete-save" data-id="${save.id}" aria-label="Удалить сохранение в слоте ${slot}">×</button></div>` : `<div class="slot-actions"><button type="button" data-action="new-in-slot" data-slot="${slot}">Новая игра</button></div>`}</div>`;
    }).join('');
    return `<p class="panel-kicker">ПРОГРЕСС ЭКСПЕДИЦИИ</p><h2 class="panel-title">Сохранения</h2><p class="panel-copy">Сохранения хранятся в этом браузере на этом устройстве.</p><div class="save-list">${slots}</div>`;
}

function renderSettings() {
    const settingRange = (key, label) => `<label class="setting-row"><span>${label}</span><input type="range" min="0" max="100" value="${state.settings[key]}" data-setting="${key}" aria-label="${label}"><output data-output="${key}">${state.settings[key]}%</output></label>`;
    return `<p class="panel-kicker">НАСТРОЙКИ ИГРЫ</p><h2 class="panel-title">Настрой под себя</h2>
        <div class="setting-list">${settingRange('master', 'Общая громкость')}${settingRange('music', 'Музыка')}${settingRange('effects', 'Звуковые эффекты')}
            <div class="setting-row toggle-row"><span>Субтитры</span><button class="toggle-control" type="button" role="switch" aria-checked="${state.settings.subtitles}" data-setting="subtitles" aria-label="Субтитры"></button></div>
            <label class="setting-row"><span>Язык</span><select data-setting="language" aria-label="Язык"><option ${state.settings.language === 'Русский' ? 'selected' : ''}>Русский</option><option ${state.settings.language === 'English' ? 'selected' : ''}>English</option></select><output></output></label>
        </div><div class="setting-actions"><button class="game-button secondary" type="button" data-action="fullscreen">Во весь экран</button><button class="subtle-button" type="button" data-action="reset-settings">Сбросить настройки</button></div>`;
}

function renderPlaying(save) {
    return `<p class="panel-kicker">ЭКСПЕДИЦИЯ НАЧАЛАСЬ</p><h2 class="panel-title">Сигнал становится ближе.</h2>
        <p class="panel-copy">${escapeHtml(save.modeLabel)} · сложность: ${escapeHtml(save.difficulty.toLowerCase())} · ${escapeHtml(save.progress)}.</p>
        <div class="save-summary"><span>АВТОСОХРАНЕНИЕ</span><strong>СЛОТ ${String(save.slot).padStart(2, '0')} ОБНОВЛЁН</strong></div>
        <p class="empty-note">Это пока стартовый экран игрового прототипа. Игровую сцену можно добавить следующим этапом.</p>
        <div class="action-row"><button class="game-button secondary" type="button" data-action="back-home">Вернуться в меню</button></div>`;
}

function render() {
    const views = { home: renderHome, solo: renderSolo, coop: renderCoop, saves: renderSaves, settings: renderSettings };
    panel.innerHTML = state.view === 'playing' ? renderPlaying(state.activeSave) : (views[state.view] || renderHome)();
    document.querySelectorAll('.game-nav [data-view]').forEach(button => {
        button.setAttribute('aria-current', button.dataset.view === state.view ? 'page' : 'false');
    });
    const continueButton = document.querySelector('.game-nav [data-action="continue"]');
    continueButton.disabled = state.saves.length === 0;
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove('visible'), 2400);
}

function startNewGame(mode, requestedSlot) {
    const slot = requestedSlot || [1, 2, 3].find(number => !state.saves.some(save => save.slot === number));
    if (!slot) {
        state.view = 'saves';
        render();
        showToast('Все слоты заняты. Удали сохранение, чтобы начать новую игру.');
        return;
    }
    const save = {
        id: `${Date.now()}-${slot}`,
        slot,
        mode,
        modeLabel: mode === 'coop' ? 'Локальная игра · 2 игрока' : 'Одиночная игра',
        difficulty: state.difficulty,
        progress: 'Начало экспедиции',
        updatedAt: Date.now()
    };
    state.saves = [...state.saves.filter(item => item.slot !== slot), save];
    state.activeSave = save;
    state.view = 'playing';
    persistSaves();
    render();
}

function loadSave(id) {
    const save = state.saves.find(item => item.id === id) || [...state.saves].sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (!save) {
        showToast('Сохранений пока нет. Начни новую игру.');
        state.view = 'solo';
        render();
        return;
    }
    save.updatedAt = Date.now();
    state.activeSave = save;
    state.view = 'playing';
    persistSaves();
    render();
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
    if (viewButton) {
        state.view = viewButton.dataset.view;
        render();
        return;
    }
    const difficultyButton = event.target.closest('[data-difficulty]');
    if (difficultyButton) {
        state.difficulty = difficultyButton.dataset.difficulty;
        render();
        return;
    }
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const { action, id, mode, slot } = button.dataset;
    if (action === 'continue') loadSave();
    if (action === 'start-new') startNewGame(mode || 'solo');
    if (action === 'new-in-slot') startNewGame('solo', Number(slot));
    if (action === 'load-save') loadSave(id);
    if (action === 'delete-save') {
        state.saves = state.saves.filter(save => save.id !== id);
        persistSaves();
        render();
        showToast('Сохранение удалено.');
    }
    if (action === 'back-home') {
        state.view = 'home';
        render();
    }
    if (action === 'online-info') showToast('Сетевой режим появится после подключения сервера.');
    if (action === 'reset-settings') {
        state.settings = { ...defaultSettings };
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
    if (event.key === 'Escape' && state.view !== 'home') {
        state.view = 'home';
        render();
    }
    if (event.key === 'Enter' && event.target.matches('.game-nav .menu-item')) event.target.click();
});

render();
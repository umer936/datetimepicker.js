document.addEventListener('DOMContentLoaded', () => {
    let currentPicker = null;
    let currentMode = 'input';
    let currentTheme = { ...DateTimePicker.defaultTheme };
    let currentOptions = {};

    const bootstrapToggle = document.getElementById('toggle-bootstrap');
    const darkToggle = document.getElementById('toggle-dark');
    const darkToggleContainer = document.getElementById('dark-toggle-container');
    const pickerPreview = document.getElementById('picker-preview');
    const modeButtons = document.querySelectorAll('.mode-tab');
    const generatedCode = document.getElementById('generated-code');
    const copyCodeBtn = document.getElementById('copy-code-btn');

    // Initialize
    bootstrapToggle.checked = false;
    darkToggleContainer.style.display = 'none';
    document.body.setAttribute('data-bs-theme', 'light');
    darkToggle.checked = false;

    // Theme options
    const themeOptions = [
        { name: 'primaryColor', type: 'color', def: '#0d6efd', help: 'Selected dates color' },
        { name: 'backgroundColor', type: 'color', def: 'white', help: 'Background color' },
        { name: 'dowBackgroundColor', type: 'color', def: 'transparent', help: 'Header background' },
        { name: 'textColor', type: 'color', def: '#000', help: 'Text color' },
        { name: 'borderColor', type: 'color', def: '#ccc', help: 'Border color' },
        { name: 'hoverColor', type: 'color', def: '#e0e0ff', help: 'Hover background' },
        { name: 'disabledColor', type: 'color', def: '#f1f1f1', help: 'Disabled background' },
        { name: 'dangerColor', type: 'color', def: '#dc3545', help: 'Marker color' },
        { name: 'borderWidth', type: 'text', def: '1px', help: 'Border width' },
        { name: 'borderRadius', type: 'text', def: '0.25rem', help: 'Corner radius' },
        { name: 'buttonBorderRadius', type: 'text', def: '0.25rem', help: 'Button radius (50% = circles)' },
        { name: 'shadow', type: 'text', def: '0 4px 8px rgba(0, 0, 0, 0.1)', help: 'Box shadow' },
    ];

    // Preset themes
    const presets = {
        'Default': DateTimePicker.defaultTheme,
        'Dark': {
            primaryColor: '#0d6efd',
            backgroundColor: '#1e1e1e',
            dowBackgroundColor: '#2a2a2a',
            textColor: '#e0e0e0',
            borderColor: '#444',
            hoverColor: '#404040',
            disabledColor: '#2a2a2a',
            dangerColor: '#dc3545',
            borderWidth: '1px',
            borderRadius: '0.25rem',
            buttonBorderRadius: '0.25rem',
            shadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
        },
        'Vibrant': {
            primaryColor: '#ff006e',
            backgroundColor: '#ffffff',
            dowBackgroundColor: '#ffe0f0',
            textColor: '#000000',
            borderColor: '#ff006e',
            hoverColor: '#f0e6ff',
            disabledColor: '#e8e8e8',
            dangerColor: '#ff006e',
            borderWidth: '2px',
            borderRadius: '8px',
            buttonBorderRadius: '8px',
            shadow: '0 4px 12px rgba(255, 0, 110, 0.2)',
        },
        'Circles': {
            primaryColor: '#0d6efd',
            backgroundColor: 'white',
            dowBackgroundColor: '#f8f9fa',
            textColor: '#000',
            borderColor: '#ccc',
            hoverColor: '#e0e0ff',
            disabledColor: '#f1f1f1',
            dangerColor: '#dc3545',
            borderWidth: '1px',
            borderRadius: '0.25rem',
            buttonBorderRadius: '50%',
            shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
    };

    // Picker options
    const pickerOptions = [
        { name: 'language', type: 'text', def: 'en-US', help: 'Locale code' },
        { name: 'firstDayOfWeek', type: 'number', def: 0, help: 'Week start (0=Sunday)' },
        { name: 'showCalendar', type: 'checkbox', def: true },
        { name: 'showDaysOfWeek', type: 'checkbox', def: true },
        { name: 'showSliders', type: 'checkbox', def: true },
        { name: 'showUtcToggle', type: 'checkbox', def: true },
        { name: 'showDoyToggle', type: 'checkbox', def: false },
        { name: 'showNowButton', type: 'checkbox', def: true },
        { name: 'showCloseButton', type: 'checkbox', def: true },
        { name: 'nowSetsTime', type: 'checkbox', def: false },
        { name: 'sliders', type: 'text', def: 'hours,minutes', help: 'Sliders to show' },
        { name: 'minDate', type: 'text', def: '', help: 'YYYY-MM-DD' },
        { name: 'maxDate', type: 'text', def: '', help: 'YYYY-MM-DD' },
    ];

    // Build theme builder
    const themeBuilder = document.getElementById('theme-builder');
    themeOptions.forEach(({ name, type, def, help }) => {
        const div = document.createElement('div');
        div.className = 'form-group';

        const label = document.createElement('label');
        label.textContent = name;
        label.title = help;
        div.appendChild(label);

        const input = document.createElement('input');
        input.type = type;
        input.id = `theme-${name}`;
        input.value = def;
        input.title = help;
        input.addEventListener('change', () => {
            currentTheme[name] = input.value;
            applyThemeAndRefresh();
        });
        input.addEventListener('input', () => {
            currentTheme[name] = input.value;
            applyThemeAndRefresh();
        });
        div.appendChild(input);
        themeBuilder.appendChild(div);
    });

    // Add preset buttons
    const presetDiv = document.createElement('div');
    presetDiv.className = 'preset-buttons';
    for (const [name] of Object.entries(presets)) {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.textContent = name;
        btn.addEventListener('click', () => {
            currentTheme = { ...presets[name] };
            updateThemeInputs();
            applyThemeAndRefresh();
        });
        presetDiv.appendChild(btn);
    }
    themeBuilder.appendChild(presetDiv);

    // Build options config
    const optionsConfig = document.getElementById('options-config');
    pickerOptions.forEach(({ name, type, def, help }) => {
        const div = document.createElement('div');
        div.className = 'form-group';

        if (type === 'checkbox') {
            const label = document.createElement('label');
            label.className = 'checkbox-label';
            label.title = help;
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = `opt-${name}`;
            input.checked = def;
            input.title = help;
            input.addEventListener('change', () => {
                currentOptions[name] = input.checked;
                refreshPicker();
                updateCode();
            });
            label.appendChild(input);
            label.appendChild(document.createTextNode(name));
            div.appendChild(label);
        } else {
            const label = document.createElement('label');
            label.textContent = name;
            label.title = help;
            div.appendChild(label);

            const input = document.createElement('input');
            input.type = type;
            input.id = `opt-${name}`;
            input.value = def;
            input.title = help;
            input.addEventListener('change', () => {
                currentOptions[name] = input.value;
                refreshPicker();
                updateCode();
            });
            div.appendChild(input);
        }
        optionsConfig.appendChild(div);
        currentOptions[name] = def;
    });

    // Mode tabs
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            refreshPicker();
            updateCode();
        });
    });

    // Bootstrap toggle
    bootstrapToggle.addEventListener('change', () => {
        document.getElementById('bootstrap-css').disabled = !bootstrapToggle.checked;
        darkToggleContainer.style.display = bootstrapToggle.checked ? '' : 'none';
        if (!bootstrapToggle.checked) {
            document.body.setAttribute('data-bs-theme', 'light');
            darkToggle.checked = false;
        }
        refreshPicker();
        updateCode();
    });

    // Dark mode toggle
    darkToggle.addEventListener('change', () => {
        document.body.setAttribute('data-bs-theme', darkToggle.checked ? 'dark' : 'light');
    });

    function updateThemeInputs() {
        themeOptions.forEach(({ name }) => {
            const input = document.getElementById(`theme-${name}`);
            if (input) input.value = currentTheme[name] || '';
        });
    }

    function applyThemeAndRefresh() {
        const root = document.documentElement.style;
        Object.entries(currentTheme).forEach(([key, value]) => {
            const cssVar = `--dtp-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
            if (value) root.setProperty(cssVar, value);
        });
        refreshPicker();
        updateCode();
    }

    function getOptions() {
        const opts = { mode: currentMode, theme: { ...currentTheme }, useBootstrap: bootstrapToggle.checked };

        pickerOptions.forEach(({ name, type }) => {
            const input = document.getElementById(`opt-${name}`);
            if (input) {
                if (type === 'checkbox') {
                    opts[name] = input.checked;
                } else if (type === 'number') {
                    opts[name] = parseInt(input.value, 10);
                } else if (name === 'sliders') {
                    // Parse sliders string into array
                    opts[name] = input.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                } else {
                    opts[name] = input.value || undefined;
                }
            }
        });

        return opts;
    }

    function refreshPicker() {
        pickerPreview.innerHTML = '';

        if (currentPicker) currentPicker = null;

        const options = getOptions();
        let el;

        if (currentMode === 'input') {
            el = document.createElement('input');
            el.type = 'text';
            el.placeholder = 'Pick date and time';
            el.style.width = '100%';
            el.style.padding = '0.5rem';
            el.style.fontSize = '1rem';
        } else if (currentMode === 'inline') {
            el = document.createElement('div');
        } else if (currentMode === 'button') {
            el = document.createElement('button');
            el.textContent = 'Pick Date and Time';
            el.style.padding = '0.75rem 1.5rem';
            el.style.fontSize = '1rem';
            el.style.cursor = 'pointer';
        }

        pickerPreview.appendChild(el);
        currentPicker = new DateTimePicker(el, options);
    }

    function updateCode() {
        const options = getOptions();

        // Filter out defaults for theme
        const nonDefaultTheme = {};
        Object.entries(options.theme || {}).forEach(([key, value]) => {
            if (value !== DateTimePicker.defaultTheme[key]) {
                nonDefaultTheme[key] = value;
            }
        });

        // Filter out defaults for other options
        const nonDefaultOptions = { mode: options.mode };
        if (Object.keys(nonDefaultTheme).length > 0) {
            nonDefaultOptions.theme = nonDefaultTheme;
        }
        if (options.useBootstrap) {
            nonDefaultOptions.useBootstrap = true;
        }

        // Add other non-default options
        pickerOptions.forEach(({ name, def }) => {
            const val = options[name];
            if (val !== def && val !== undefined) {
                nonDefaultOptions[name] = val;
            }
        });

        generatedCode.value = `new DateTimePicker(element, ${JSON.stringify(nonDefaultOptions, null, 2)})`;
    }

    // Copy code
    copyCodeBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(generatedCode.value);
            const original = copyCodeBtn.textContent;
            copyCodeBtn.textContent = 'Copied!';
            setTimeout(() => { copyCodeBtn.textContent = original; }, 2000);
        } catch {
            generatedCode.select();
            copyCodeBtn.textContent = 'Select + Copy';
        }
    });

    // Initial setup
    refreshPicker();
    updateCode();
});

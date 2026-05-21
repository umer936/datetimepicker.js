document.addEventListener('DOMContentLoaded', () => {
    const pickers = { inline: null, input: null, button: null };
    const bootstrapToggle = document.getElementById('toggle-bootstrap');
    const darkToggle = document.getElementById('toggle-dark');
    const darkToggleContainer = document.getElementById('dark-toggle-container');
    const snippetOutputs = {};

    // Set Bootstrap Styles unchecked by default
    bootstrapToggle.checked = false;
    document.getElementById('bootstrap-css').disabled = true;
    darkToggleContainer.style.display = 'none';
    document.body.setAttribute('data-bs-theme', 'light');
    darkToggle.checked = false;

    const optionTemplate = [
        { name: 'language', type: 'text', def: 'en-US', help: 'Locale code used by Intl formatting (e.g. en-US, fr-FR, tr-TR).' },
        { name: 'firstDayOfWeek', type: 'number', def: 0, help: 'Week start day index: 0 Sunday ... 6 Saturday.' },
        { name: 'monthLabelFormat', type: 'text', def: 'long', help: 'Month header style: long, short, or narrow.' },
        { name: 'weekdayLabelFormat', type: 'text', def: 'short', help: 'Weekday header style: long, short, or narrow.' },
        { name: 'showCalendar', type: 'checkbox', def: true, help: 'Show the calendar grid.' },
        { name: 'showDaysOfWeek', type: 'checkbox', def: true, help: 'Show weekday labels row.' },
        { name: 'showSliders', type: 'checkbox', def: true, help: 'Show time sliders area.' },
        { name: 'showUtcToggle', type: 'checkbox', def: true, help: 'Show local/UTC toggle switch.' },
        { name: 'showDoyToggle', type: 'checkbox', def: false, help: 'Show day-of-year toggle.' },
        { name: 'showNowButton', type: 'checkbox', def: true, help: 'Show the Now button in footer.' },
        { name: 'showSelectedDatetime', type: 'checkbox', def: true, help: 'Show readonly selected datetime field.' },
        { name: 'showCloseButton', type: 'checkbox', def: true, help: 'Show the Close button in footer.' },
        { name: 'showMarkerLegend', type: 'checkbox', def: false, help: 'Show marker labels legend under footer buttons.' },
        { name: 'nowSetsTime', type: 'checkbox', def: false, help: 'If true, Now sets both date and time.' },
        { name: 'sliders', type: 'text', def: 'hours,minutes,seconds,nanoseconds', help: 'Comma-separated sliders to show.' },
        { name: 'disabledWeekdays', type: 'text', def: '', help: 'Comma-separated weekdays to block (e.g. 0,6).' },
        { name: 'disabledDates', type: 'text', def: '', help: 'Comma-separated blocked dates (YYYY-MM-DD).' },
        { name: 'minDate', type: 'text', def: '', help: 'Earliest selectable date (YYYY-MM-DD).' },
        { name: 'maxDate', type: 'text', def: '', help: 'Latest selectable date (YYYY-MM-DD).' },
        { name: 'markers', type: 'text', def: '2026-12-25|Holiday|#dc3545', help: 'Format: date|label|color, separated by commas.' },
        { name: 'labelNow', type: 'text', def: 'Now', help: 'Custom text for the Now button.' },
        { name: 'labelClose', type: 'text', def: 'Close', help: 'Custom text for the Close button.' }
    ];

    const parseCSV = (value) => value.split(',').map((s) => s.trim()).filter(Boolean);
    const parseWeekdays = (value) => parseCSV(value)
        .map((d) => parseInt(d, 10))
        .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    const parseDateList = (value) => parseCSV(value);
    const parseMarkers = (value) => {
        // Format: YYYY-MM-DD|Label|Color,YYYY-MM-DD|Another Label|#0d6efd
        return parseCSV(value).map((entry) => {
            const [date = '', label = '', color = ''] = entry.split('|').map((part) => part.trim());
            return {
                date,
                label,
                color,
                tooltip: label,
            };
        }).filter((marker) => marker.date);
    };

    // Generate inputs
    for (const id of ['inline', 'input', 'button']) {
        const fs = document.getElementById(`${id}-options`);
        optionTemplate.forEach(({ name, type, def, help }) => {
            const row = document.createElement('div');
            row.classList.add('option-row');
            row.title = help;

            const lbl = document.createElement('label');
            lbl.textContent = name;
            lbl.setAttribute('for', `${id}-${name}`);
            lbl.style.margin = '0';
            lbl.title = help;

            const input = document.createElement('input');
            input.type = type;
            input.id = `${id}-${name}`;
            if (type === 'checkbox') input.checked = def;
            else input.value = def;
            input.style.marginLeft = '0.5rem';
            input.title = help;

            if (type === 'checkbox') {
                input.style.width = '';
                input.style.height = '';
                input.style.minWidth = '';
                input.style.minHeight = '';
                input.style.maxWidth = '';
                input.style.maxHeight = '';
            } else {
                input.style.width = 'auto';
                input.style.maxWidth = '180px';
            }

            const header = document.createElement('div');
            header.classList.add('option-header');
            header.appendChild(lbl);
            header.appendChild(input);

            row.appendChild(header);
            fs.appendChild(row);
        });

        const snippetBox = document.createElement('details');
        snippetBox.classList.add('snippet-box');
        snippetBox.open = false;
        snippetBox.innerHTML = `
            <summary>Copy/Paste Setup</summary>
            <div class="snippet-box-content">
                <div class="snippet-box-header">
                    <small>Generated from current options.</small>
                    <button type="button" id="${id}-copy-code" class="btn btn-sm btn-secondary">Copy</button>
                </div>
                <textarea id="${id}-generated-code" readonly></textarea>
            </div>
        `;
        fs.appendChild(snippetBox);
        snippetOutputs[id] = snippetBox.querySelector('textarea');

        const copyButton = snippetBox.querySelector('button');
        copyButton.addEventListener('click', async () => {
            const code = snippetOutputs[id].value;
            if (!code) return;
            try {
                await navigator.clipboard.writeText(code);
                copyButton.textContent = 'Copied!';
            } catch {
                snippetOutputs[id].focus();
                snippetOutputs[id].select();
                copyButton.textContent = 'Select + Ctrl/Cmd+C';
            }
            setTimeout(() => {
                copyButton.textContent = 'Copy';
            }, 1400);
        });
    }

    // Helper to update playground form controls with Bootstrap classes
    function updatePlaygroundFormStyles(useBootstrap) {
        for (const id of ['inline', 'input', 'button']) {
            const fs = document.getElementById(`${id}-options`);
            fs.querySelectorAll('.option-header').forEach(row => {
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.justifyContent = 'space-between';
            });
            fs.querySelectorAll('label').forEach(lbl => {
                if (useBootstrap) {
                    lbl.classList.add('form-label', 'mb-0');
                } else {
                    lbl.classList.remove('form-label', 'mb-0');
                }
                lbl.style.margin = '0';
            });
            fs.querySelectorAll('input[type="text"], input[type="number"]').forEach(inp => {
                if (useBootstrap) {
                    inp.classList.add('form-control', 'form-control-sm');
                    inp.style.width = 'auto';
                    inp.style.maxWidth = '180px';
                } else {
                    inp.classList.remove('form-control', 'form-control-sm');
                    inp.style.width = 'auto';
                    inp.style.maxWidth = '180px';
                }
            });
            fs.querySelectorAll('input[type="checkbox"]').forEach(inp => {
                if (useBootstrap) {
                    inp.classList.add('form-check-input');
                } else {
                    inp.classList.remove('form-check-input');
                }
                // Always remove all sizing for checkboxes
                inp.style.width = '';
                inp.style.height = '';
                inp.style.minWidth = '';
                inp.style.minHeight = '';
                inp.style.maxWidth = '';
                inp.style.maxHeight = '';
            });
            fs.querySelectorAll('select').forEach(sel => {
                if (useBootstrap) {
                    sel.classList.add('form-select', 'form-select-sm');
                    sel.style.width = 'auto';
                    sel.style.maxWidth = '180px';
                } else {
                    sel.classList.remove('form-select', 'form-select-sm');
                    sel.style.width = 'auto';
                    sel.style.maxWidth = '180px';
                }
            });
        }
    }

    bootstrapToggle.addEventListener('change', () => {
        document.getElementById('bootstrap-css').disabled = !bootstrapToggle.checked;
        darkToggleContainer.style.display = bootstrapToggle.checked ? '' : 'none';
        // Reset dark mode if Bootstrap is disabled
        if (!bootstrapToggle.checked) {
            document.body.setAttribute('data-bs-theme', 'light');
            darkToggle.checked = false;
        }
        updatePlaygroundFormStyles(bootstrapToggle.checked);
        refreshAll();
    });

    darkToggle.addEventListener('change', () => {
        document.body.setAttribute('data-bs-theme', darkToggle.checked ? 'dark' : 'light');
    });

    function getSerializableOptions(id) {
        const fs = document.getElementById(`${id}-options`);
        const get = (n) => fs.querySelector(`#${id}-${n}`);

        return {
            language: get('language').value,
            firstDayOfWeek: parseInt(get('firstDayOfWeek').value, 10),
            monthLabelFormat: get('monthLabelFormat').value || 'long',
            weekdayLabelFormat: get('weekdayLabelFormat').value || 'short',
            showCalendar: get('showCalendar').checked,
            showDaysOfWeek: get('showDaysOfWeek').checked,
            showSliders: get('showSliders').checked,
            showUtcToggle: get('showUtcToggle').checked,
            showDoyToggle: get('showDoyToggle').checked,
            showNowButton: get('showNowButton').checked,
            showSelectedDatetime: get('showSelectedDatetime').checked,
            showCloseButton: get('showCloseButton').checked,
            showMarkerLegend: get('showMarkerLegend').checked,
            nowSetsTime: get('nowSetsTime').checked,
            sliders: parseCSV(get('sliders').value),
            disabledWeekdays: parseWeekdays(get('disabledWeekdays').value),
            disabledDates: parseDateList(get('disabledDates').value),
            minDate: get('minDate').value || null,
            maxDate: get('maxDate').value || null,
            markers: parseMarkers(get('markers').value),
            labels: {
                now: get('labelNow').value || 'Now',
                close: get('labelClose').value || 'Close',
            },
            mode: id,
            useBootstrap: bootstrapToggle.checked,
        };
    }

    function updateCodeSnippet(id) {
        const target = snippetOutputs[id];
        if (!target) return;
        const options = getMinimalOptionsForSnippet(id);
        const sampleTarget = id === 'inline'
            ? 'inline-picker'
            : id === 'input'
                ? 'input-picker'
                : 'button-picker';

        target.value = [
            `const el = document.getElementById('${sampleTarget}');`,
            `const picker = new DateTimePicker(el, ${JSON.stringify(options, null, 2)});`
        ].join('\n');
    }

    function isSameValue(a, b) {
        if (a === b) return true;
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (!isSameValue(a[i], b[i])) return false;
            }
            return true;
        }
        if (a && b && typeof a === 'object' && typeof b === 'object') {
            const aKeys = Object.keys(a);
            const bKeys = Object.keys(b);
            if (aKeys.length !== bKeys.length) return false;
            for (const key of aKeys) {
                if (!isSameValue(a[key], b[key])) return false;
            }
            return true;
        }
        return false;
    }

    function getMinimalOptionsForSnippet(id) {
        const options = getSerializableOptions(id);
        const defaults = DateTimePicker.defaultSettings || {};
        const minimal = {};

        for (const [key, value] of Object.entries(options)) {
            if (key === 'labels') {
                const defaultLabels = defaults.labels || {};
                const labelDiff = {};
                for (const [labelKey, labelValue] of Object.entries(value || {})) {
                    if (!isSameValue(labelValue, defaultLabels[labelKey])) {
                        labelDiff[labelKey] = labelValue;
                    }
                }
                if (Object.keys(labelDiff).length > 0) {
                    minimal.labels = labelDiff;
                }
                continue;
            }

            if (!isSameValue(value, defaults[key])) {
                minimal[key] = value;
            }
        }

        return minimal;
    }

    function getOptions(id) {
        return {
            ...getSerializableOptions(id),
            onSelect: (t) => {
                if (id === 'input')
                    document.querySelector('#input-wrapper input').value = t.toLocaleString();
            },
            onChange: (t) => {
                if (id === 'input')
                    document.querySelector('#input-wrapper input').value = t.toLocaleString();
            },
            onInvalidSelect: ({ date, reason }) => {
                if (id === 'input') {
                    const target = document.querySelector('#input-wrapper input');
                    if (target) {
                        target.value = `Blocked: ${date.toLocaleDateString()} (${reason})`;
                    }
                }
            }
        };
    }

    function destroyPicker(id) {
        const picker = pickers[id];
        if (picker && typeof picker.destroy === 'function') picker.destroy();
        pickers[id] = null;
    }

    function recreateElement(id) {
        const wrap = document.getElementById(`${id}-wrapper`);
        wrap.innerHTML = '';
        let el;
        if (id === 'inline') {
            el = document.createElement('div');
        } else if (id === 'input') {
            el = document.createElement('input');
            el.className = 'form-control';
            el.placeholder = 'Select Date and Time';
        } else if (id === 'button') {
            el = document.createElement('button');
            el.className = 'btn btn-primary';
            el.textContent = 'Pick Date and Time';
        }
        el.id = `${id}-picker`;
        wrap.appendChild(el);

        // Apply Bootstrap classes to picker containers if enabled
        if (bootstrapToggle.checked) {
            wrap.classList.add('bg-body', 'rounded', 'shadow', 'p-3', 'mb-3');
        } else {
            wrap.classList.remove('bg-body', 'rounded', 'shadow', 'p-3', 'mb-3');
        }
        return el;
    }

    function initPicker(id) {
        destroyPicker(id);
        const el = recreateElement(id);
        const options = getOptions(id);
        pickers[id] = new DateTimePicker(el, options);
        updateCodeSnippet(id);
    }

    function refreshAll() {
        ['inline', 'input', 'button'].forEach(initPicker);
    }

    function attachOptionListeners(id) {
        const fs = document.getElementById(`${id}-options`);
        fs.querySelectorAll('input, select').forEach(inp => {
            inp.addEventListener('change', () => initPicker(id));
        });
    }

    ['inline', 'input', 'button'].forEach(id => {
        attachOptionListeners(id);
        initPicker(id);
    });

    // Initial style setup
    updatePlaygroundFormStyles(bootstrapToggle.checked);
});

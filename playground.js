document.addEventListener('DOMContentLoaded', () => {
    const pickers = { inline: null, input: null, button: null };
    const bootstrapToggle = document.getElementById('toggle-bootstrap');
    const darkToggle = document.getElementById('toggle-dark');
    const darkToggleContainer = document.getElementById('dark-toggle-container');

    // Set Bootstrap Styles unchecked by default
    bootstrapToggle.checked = false;
    document.getElementById('bootstrap-css').disabled = true;
    darkToggleContainer.style.display = 'none';
    document.body.setAttribute('data-bs-theme', 'light');
    darkToggle.checked = false;

    const optionTemplate = [
        ['language', 'text', 'en-US'],
        ['firstDayOfWeek', 'number', 0],
        ['showCalendar', 'checkbox', true],
        ['showDaysOfWeek', 'checkbox', true],
        ['showSliders', 'checkbox', true],
        ['showUTC', 'checkbox', true],
        ['showDOYtoggle', 'checkbox', false],
        ['showFooter', 'checkbox', true],
        ['showNowButton', 'checkbox', true],
        ['showSelectedDatetime', 'checkbox', true],
        ['showCloseButton', 'checkbox', true],
        ['setNowIncludesTime', 'checkbox', false],
        ['slidersToShow', 'text', 'hours,minutes,seconds,nanoseconds']
    ];

    // Generate inputs
    for (const id of ['inline', 'input', 'button']) {
        const fs = document.getElementById(`${id}-options`);
        optionTemplate.forEach(([name, type, def]) => {
            // Create a flex row for label and input
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.marginBottom = '0.5rem';

            const lbl = document.createElement('label');
            lbl.textContent = name;
            lbl.setAttribute('for', `${id}-${name}`);
            lbl.style.margin = '0';
            lbl.style.flex = '1 1 auto';
            lbl.style.textAlign = 'left';

            const input = document.createElement('input');
            input.type = type;
            input.id = `${id}-${name}`;
            if (type === 'checkbox') input.checked = def;
            else input.value = def;
            input.style.marginLeft = '0.5rem';

            // Remove all sizing for checkboxes, let browser/Bootstrap handle it
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

            row.appendChild(lbl);
            row.appendChild(input);
            fs.appendChild(row);
        });
    }

    // Helper to update playground form controls with Bootstrap classes
    function updatePlaygroundFormStyles(useBootstrap) {
        for (const id of ['inline', 'input', 'button']) {
            const fs = document.getElementById(`${id}-options`);
            fs.querySelectorAll('div').forEach(row => {
                row.style.display = 'flex';
                row.style.flexDirection = 'row';
                row.style.alignItems = 'center';
                row.style.justifyContent = 'space-between';
                row.style.marginBottom = '0.5rem';
            });
            fs.querySelectorAll('label').forEach(lbl => {
                if (useBootstrap) {
                    lbl.classList.add('form-label', 'mb-0');
                } else {
                    lbl.classList.remove('form-label', 'mb-0');
                }
                lbl.style.margin = '0';
                lbl.style.flex = '1 1 auto';
                lbl.style.textAlign = 'left';
            });
            fs.querySelectorAll('input[type="text"], input[type="number"]').forEach(inp => {
                if (useBootstrap) {
                    inp.classList.add('form-control');
                    inp.style.width = 'auto';
                    inp.style.maxWidth = '180px';
                } else {
                    inp.classList.remove('form-control');
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
                    sel.classList.add('form-select');
                    sel.style.width = 'auto';
                    sel.style.maxWidth = '180px';
                } else {
                    sel.classList.remove('form-select');
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

    function getOptions(id) {
        const fs = document.getElementById(`${id}-options`);
        const get = (n) => fs.querySelector(`#${id}-${n}`);
        return {
            language: get('language').value,
            firstDayOfWeek: parseInt(get('firstDayOfWeek').value),
            showCalendar: get('showCalendar').checked,
            showDaysOfWeek: get('showDaysOfWeek').checked,
            showSliders: get('showSliders').checked,
            showUTC: get('showUTC').checked,
            showDOYtoggle: get('showDOYtoggle').checked,
            showFooter: get('showFooter').checked,
            showNowButton: get('showNowButton').checked,
            showSelectedDatetime: get('showSelectedDatetime').checked,
            showCloseButton: get('showCloseButton').checked,
            setNowIncludesTime: get('setNowIncludesTime').checked,
            slidersToShow: get('slidersToShow').value.split(',').map(s => s.trim()).filter(Boolean),
            mode: id,
            useBootstrap: bootstrapToggle.checked,
            onDateSelect: (t) => {
                if (id === 'input')
                    document.querySelector('#input-wrapper input').value = t.toLocaleString();
            },
            onTimeChange: (t) => {
                if (id === 'input')
                    document.querySelector('#input-wrapper input').value = t.toLocaleString();
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

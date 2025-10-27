document.addEventListener('DOMContentLoaded', () => {
    const pickers = { inline: null, input: null, button: null };
    const bootstrapToggle = document.getElementById('toggle-bootstrap');

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
            const lbl = document.createElement('label');
            lbl.textContent = name;
            const input = document.createElement('input');
            input.type = type;
            input.id = `${id}-${name}`;
            if (type === 'checkbox') input.checked = def;
            else input.value = def;
            lbl.appendChild(input);
            fs.appendChild(lbl);
        });
    }

    bootstrapToggle.addEventListener('change', () => {
        document.getElementById('bootstrap-css').disabled = !bootstrapToggle.checked;
        refreshAll();
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
});

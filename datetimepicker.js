class DateTimePicker {
    static defaultSettings = {
        // Locale & calendar
        language: 'en-US',
        firstDayOfWeek: 0,         // 0 = Sunday, 1 = Monday, etc.
        initialValue: null,        // Initial date value (Date object or parseable string)
        monthLabelFormat: 'long',  // Intl month format: 'long' | 'short' | 'narrow'
        weekdayLabelFormat: 'short', // Intl weekday format: 'long' | 'short' | 'narrow'
        dateTimeFormat: null,      // Optional Intl.DateTimeFormat options for local output

        // Display mode: 'inline' | 'input' | 'button'
        mode: 'inline',

        // Visibility toggles
        showCalendar: true,
        showDaysOfWeek: true,
        showSliders: true,
        showUtcToggle: true,       // renamed from showUTC
        showDoyToggle: false,      // renamed from showDOYtoggle (was lowercase 't')
        showSelectedDatetime: true,
        showNowButton: true,
        showCloseButton: true,

        // Sliders: which time components to show
        // renamed from slidersToShow; valid values: 'hours', 'minutes', 'seconds', 'nanoseconds'
        sliders: ['hours', 'minutes'],

        // "Now" button behaviour
        nowSetsTime: false,        // renamed from setNowIncludesTime

        // Optional custom label for the datetime display row (null = auto)
        datetimeLabel: undefined,  // renamed from dayTimeLabel

        // Disable rules
        minDate: null,
        maxDate: null,
        disabledWeekdays: [],      // Array of weekday indexes [0..6]
        disabledDates: [],         // Array of Date/string values (YYYY-MM-DD preferred)

        // Optional day markers shown on specific dates
        // [{ date: '2026-12-25', label: 'Holiday', color: '#d32f2f', tooltip: 'Christmas', className: 'my-marker' }]
        markers: [],
        showMarkerLegend: false,
        markerLegendMaxItems: 6,

        // UI strings (localizable overrides)
        labels: {
            prevMonth: 'Previous Month',
            nextMonth: 'Next Month',
            selectMonth: 'Select Month',
            selectYear: 'Select Year',
            toggleUtc: 'Toggle UTC Time',
            toggleDoy: 'Toggle Day of Year',
            dayOfMonthDayOfYear: 'Day of Month/Day of Year',
            now: 'Now',
            close: 'Close',
        },

        // Styling
        useBootstrap: false,
        themeClass: '',
        themeVariables: null,

        // Callbacks
        onSelect: null,            // renamed from onDateSelect; called with (Date) on day click
        onChange: null,            // renamed from onTimeChange; called with (Date) on any change
        onInvalidSelect: null,     // called with ({ date, reason, cell }) when a locked date is clicked
    };

    constructor(element, options) {
        const userLabels = options && typeof options.labels === 'object' ? options.labels : {};

        // Merge default settings with the provided options
        this.settings = { ...DateTimePicker.defaultSettings, ...options };
        this.triggerElement = element;

        // Ensure language is always set and non-empty
        if (!this.settings.language) {
            this.settings.language = 'en-US';
        }

        if (!Number.isInteger(this.settings.firstDayOfWeek) || this.settings.firstDayOfWeek < 0 || this.settings.firstDayOfWeek > 6) {
            this.settings.firstDayOfWeek = 0;
        }

        this.settings.monthLabelFormat = this.normalizeWidthOption(this.settings.monthLabelFormat, 'long');
        this.settings.weekdayLabelFormat = this.normalizeWidthOption(this.settings.weekdayLabelFormat, 'short');
        this.settings.labels = this.getLocalizedLabels(this.settings.language, userLabels);

        // Validate mode
        if (!['inline', 'input', 'button'].includes(this.settings.mode)) {
            console.warn(`DateTimePicker: unknown mode "${this.settings.mode}", falling back to "inline".`);
            this.settings.mode = 'inline';
        }

        // Initialize selected date. For input mode, respect an existing input value when initialValue is omitted.
        const initialDate = this.resolveInitialDate(element);
        this.selectedDate = isNaN(initialDate.getTime()) ? new Date() : initialDate;

        // Placeholder for the container, which will be initialized in `init`
        this.container = null;

        // Build normalized lookup structures used during rendering and selection.
        this.prepareConstraints();
        this.prepareMarkers();

        // Call the initialization method
        this.init(element);
    }

    resolveInitialDate(element) {
        const explicitInitial = this.parseDateLike(this.settings.initialValue);
        if (explicitInitial) {
            return explicitInitial;
        }

        if (this.settings.mode === 'input' && element instanceof HTMLInputElement) {
            const fromInput = this.parseDateLike(element.value);
            if (fromInput) {
                return fromInput;
            }
        }

        return new Date();
    }

    parseDateLike(value) {
        if (value === null || value === undefined || value === '') return null;
        const parsed = value instanceof Date ? new Date(value) : new Date(value);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    normalizeWidthOption(value, fallback) {
        const allowed = new Set(['long', 'short', 'narrow']);
        return allowed.has(value) ? value : fallback;
    }

    getLocalizedLabels(language, userLabels = {}) {
        const lang = (language || 'en-US').split('-')[0].toLowerCase();
        const localizedDefaults = {
            en: { prevMonth: 'Previous Month', nextMonth: 'Next Month', selectMonth: 'Select Month', selectYear: 'Select Year', toggleUtc: 'Toggle UTC Time', toggleDoy: 'Toggle Day of Year', dayOfMonthDayOfYear: 'Day of Month/Day of Year', now: 'Now', close: 'Close', markerLegend: 'Markers' },
            es: { prevMonth: 'Mes anterior', nextMonth: 'Mes siguiente', selectMonth: 'Seleccionar mes', selectYear: 'Seleccionar anio', toggleUtc: 'Cambiar hora UTC', toggleDoy: 'Cambiar dia del anio', dayOfMonthDayOfYear: 'Dia del mes/Dia del anio', now: 'Ahora', close: 'Cerrar', markerLegend: 'Marcadores' },
            fr: { prevMonth: 'Mois precedent', nextMonth: 'Mois suivant', selectMonth: 'Selectionner le mois', selectYear: 'Selectionner l annee', toggleUtc: 'Basculer heure UTC', toggleDoy: 'Basculer jour de l annee', dayOfMonthDayOfYear: 'Jour du mois/Jour de l annee', now: 'Maintenant', close: 'Fermer', markerLegend: 'Marqueurs' },
            de: { prevMonth: 'Vorheriger Monat', nextMonth: 'Naechster Monat', selectMonth: 'Monat auswaehlen', selectYear: 'Jahr auswaehlen', toggleUtc: 'UTC-Zeit umschalten', toggleDoy: 'Tag des Jahres umschalten', dayOfMonthDayOfYear: 'Tag des Monats/Tag des Jahres', now: 'Jetzt', close: 'Schliessen', markerLegend: 'Markierungen' },
            pt: { prevMonth: 'Mes anterior', nextMonth: 'Proximo mes', selectMonth: 'Selecionar mes', selectYear: 'Selecionar ano', toggleUtc: 'Alternar hora UTC', toggleDoy: 'Alternar dia do ano', dayOfMonthDayOfYear: 'Dia do mes/Dia do ano', now: 'Agora', close: 'Fechar', markerLegend: 'Marcadores' },
            it: { prevMonth: 'Mese precedente', nextMonth: 'Mese successivo', selectMonth: 'Seleziona mese', selectYear: 'Seleziona anno', toggleUtc: 'Attiva/disattiva ora UTC', toggleDoy: 'Attiva/disattiva giorno dell anno', dayOfMonthDayOfYear: 'Giorno del mese/Giorno dell anno', now: 'Adesso', close: 'Chiudi', markerLegend: 'Indicatori' },
            tr: { prevMonth: 'Onceki ay', nextMonth: 'Sonraki ay', selectMonth: 'Ay sec', selectYear: 'Yil sec', toggleUtc: 'UTC saatini degistir', toggleDoy: 'Yilin gununu degistir', dayOfMonthDayOfYear: 'Ayin gunu/Yilin gunu', now: 'Simdi', close: 'Kapat', markerLegend: 'Isaretler' },
        };

        const fallback = DateTimePicker.defaultSettings.labels;
        const base = localizedDefaults[lang] || fallback;
        return { ...fallback, ...base, ...userLabels };
    }

    prepareConstraints() {
        const toDate = (value) => {
            if (!value) return null;
            const parsed = value instanceof Date ? new Date(value) : new Date(value);
            return isNaN(parsed.getTime()) ? null : parsed;
        };

        this.minDate = toDate(this.settings.minDate);
        this.maxDate = toDate(this.settings.maxDate);

        this.disabledWeekdaySet = new Set(
            (Array.isArray(this.settings.disabledWeekdays) ? this.settings.disabledWeekdays : [])
                .map((d) => Number(d))
                .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
        );

        this.disabledDateSet = new Set();
        const disabledDates = Array.isArray(this.settings.disabledDates) ? this.settings.disabledDates : [];
        for (const dateLike of disabledDates) {
            const parsed = toDate(dateLike);
            if (parsed) {
                this.disabledDateSet.add(this.toDateKey(parsed));
            }
        }
    }

    prepareMarkers() {
        this.markerMap = new Map();
        this.markerLegendItems = [];
        const seenLegendItems = new Set();
        const markers = Array.isArray(this.settings.markers) ? this.settings.markers : [];
        for (const marker of markers) {
            if (!marker || !marker.date) continue;
            const parsed = marker.date instanceof Date ? new Date(marker.date) : new Date(marker.date);
            if (isNaN(parsed.getTime())) continue;
            const normalizedMarker = {
                label: typeof marker.label === 'string' ? marker.label : '',
                tooltip: typeof marker.tooltip === 'string' ? marker.tooltip : '',
                color: typeof marker.color === 'string' ? marker.color : '',
                className: typeof marker.className === 'string' ? marker.className : '',
            };
            this.markerMap.set(this.toDateKey(parsed), normalizedMarker);

            if (normalizedMarker.label) {
                const legendKey = `${normalizedMarker.label}::${normalizedMarker.color}`;
                if (!seenLegendItems.has(legendKey)) {
                    this.markerLegendItems.push({ label: normalizedMarker.label, color: normalizedMarker.color });
                    seenLegendItems.add(legendKey);
                }
            }
        }
    }

    toDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    getLabel(key, fallback = '') {
        const value = this.settings.labels && typeof this.settings.labels[key] === 'string'
            ? this.settings.labels[key]
            : fallback;
        return value || fallback;
    }

    isDateDisabled(date) {
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const minOnly = this.minDate ? new Date(this.minDate.getFullYear(), this.minDate.getMonth(), this.minDate.getDate()) : null;
        const maxOnly = this.maxDate ? new Date(this.maxDate.getFullYear(), this.maxDate.getMonth(), this.maxDate.getDate()) : null;

        if (minOnly && dateOnly < minOnly) return true;
        if (maxOnly && dateOnly > maxOnly) return true;
        if (this.disabledWeekdaySet.has(date.getDay())) return true;
        return this.disabledDateSet.has(this.toDateKey(date));
    }

    init(element) {
        this.createPicker(element);
        this.populateDropdowns();
        this.renderCalendar();
        this.bindEvents(element);

        // Fix display for inline mode
        if (this.settings.mode === 'inline') {
            this.container.style.display = 'block';
            this.datetimePicker.style.display = 'block';
            this.datetimePicker.style.position = 'static';
        } else {
            this.container.style.display = 'none';
            this.datetimePicker.style.display = 'none';
            this.datetimePicker.parentElement.style.display = 'none';
        }

        this.toggleFeatures();
    }

    createPicker(element) {
        const container = document.createElement('div');
        container.classList.add('datetime-container');
        container.style.display = 'none';

        const themeClass = typeof this.settings.themeClass === 'string' ? this.settings.themeClass.trim() : '';

        const pickerClass = this.settings.useBootstrap
            ? 'datetime-picker border rounded shadow p-3 bg-body'
            : 'datetime-picker border rounded shadow p-3 bg-white';

        container.innerHTML = `
        <div class="${themeClass ? `${pickerClass} ${themeClass}` : pickerClass}" role="dialog" aria-hidden="true">
            ${this.getControlsHTML()}
            ${this.getDOWHTML()}
            ${this.getCalendarHTML()}
            ${this.getSelectedTimeHTML()}
            ${this.getSlidersHTML()}
            ${this.getTogglesHTML()}
            ${this.getFooterHTML()}
        </div>
    `;

        if (element.parentNode) {
            element.parentNode.insertBefore(container, element.nextSibling);
        }

        this.cacheElements(container);
        this.applyThemeVariables();
    }

    applyThemeVariables() {
        if (!this.datetimePicker) return;
        if (!this.settings.themeVariables || typeof this.settings.themeVariables !== 'object') return;

        for (const [key, value] of Object.entries(this.settings.themeVariables)) {
            if (typeof key !== 'string' || !key.startsWith('--')) continue;
            this.datetimePicker.style.setProperty(key, String(value));
        }
    }

    getControlsHTML() {
        const btnClass = this.settings.useBootstrap ? 'btn btn-primary' : 'btn';
        const selectClass = this.settings.useBootstrap ? 'form-select pe-4 my-1' : '';
        return `
    <div class="calendar-controls mb-3 d-flex align-items-center justify-content-between">
        <button type="button" class="${btnClass} me-2" id="prev-month" aria-label="${this.getLabel('prevMonth', 'Previous Month')}">
            <span>&lt;</span>
        </button>
        <div class="input-group">
            <select id="monthSelect" class="${selectClass}" aria-label="${this.getLabel('selectMonth', 'Select Month')}"></select>
            <select id="yearSelect" class="${selectClass}" aria-label="${this.getLabel('selectYear', 'Select Year')}"></select>
        </div>
        <button type="button" class="${btnClass} ms-2" id="next-month" aria-label="${this.getLabel('nextMonth', 'Next Month')}">
            <span>&gt;</span>
        </button>
    </div>
    `;
    }

    getDOWHTML() {
        const dowDiv = document.createElement('div');
        dowDiv.id = 'days-of-week';

        const formatter = new Intl.DateTimeFormat(this.settings.language, { weekday: this.settings.weekdayLabelFormat });
        const daysOfWeek = Array.from({ length: 7 }, (_, i) =>
            formatter.format(new Date(2023, 0, i + 1))
        );

        const first = this.settings.firstDayOfWeek;
        const rotatedDays = [...daysOfWeek.slice(first), ...daysOfWeek.slice(0, first)];

        for (const day of rotatedDays) {
            const dowCell = document.createElement('div');
            dowCell.textContent = day;
            dowCell.classList.add('dow-cell');
            if (this.settings.useBootstrap) {
                dowCell.classList.add('fw-bold');
            }
            dowDiv.appendChild(dowCell);
        }

        return dowDiv.outerHTML;
    }

    populateYearDropdown() {
        if (typeof this._yearRangeStart !== 'number' || typeof this._yearRangeEnd !== 'number') {
            const currentYear = this.selectedDate.getFullYear();
            const range = 20;
            this._yearRangeStart = currentYear - Math.floor(range / 2);
            this._yearRangeEnd = currentYear + Math.floor(range / 2);
        }

        this.renderYearOptions(this.selectedDate.getFullYear());

        if (!this._yearDropdownListenerAttached) {
            this.yearSelect.addEventListener('change', (e) => this.handleYearSelection(e));
            this._yearDropdownListenerAttached = true;
        }
    }

    renderYearOptions(selectedYear) {
        const options = [];
        for (let year = this._yearRangeStart; year <= this._yearRangeEnd; year++) {
            options.push(`<option value="${year}"${year === selectedYear ? ' selected' : ''}>${year}</option>`);
        }
        this.yearSelect.innerHTML = options.join('');
        this.yearSelect.value = selectedYear;
    }

    handleYearSelection(event) {
        const selectedYear = parseInt(event.target.value, 10);
        if (selectedYear === this._yearRangeStart) {
            this.loadMoreYears('backward', selectedYear);
        } else if (selectedYear === this._yearRangeEnd) {
            this.loadMoreYears('forward', selectedYear);
        }
        this.selectedDate.setFullYear(selectedYear);
        this.renderCalendar();
        this.updateSelectedDatetime();
    }

    loadMoreYears(direction, selectedYear) {
        const range = 20;
        if (direction === 'forward') {
            this._yearRangeEnd += range;
        } else if (direction === 'backward') {
            this._yearRangeStart -= range;
        }
        this.renderYearOptions(selectedYear);
        this.yearSelect.value = selectedYear;
    }

    getCalendarHTML() {
        return `<div id="calendar" class="calendar mb-3" role="grid" aria-label="Calendar"></div>`;
    }

    getSelectedTimeHTML() {
        const label = this.getDatetimeLabel();
        return this.settings.showSelectedDatetime
            ? `<div class="d-flex flex-row justify-content-between mb-1">
                ${label ? `<label for="selected-datetime">${label}:</label>` : '<span></span>'}
                <input id="selected-datetime" class="text-end" aria-live="polite" aria-readonly="true" readonly disabled aria-disabled="true">
            </div>`
            : '';
    }

    getDatetimeLabel() {
        // Use datetimeLabel if explicitly set (even empty string suppresses label)
        if (typeof this.settings.datetimeLabel === 'string') {
            return this.settings.datetimeLabel;
        }
        const lang = (this.settings.language || 'en-US').split('-')[0];
        if (lang === 'en') return 'Day Time';
        return '';
    }

    getSliderLabel(type) {
        const locale = this.settings.language;
        switch (type) {
            case 'hours':    return this.getUnitLabel(locale, 'hour');
            case 'minutes':  return this.getUnitLabel(locale, 'minute');
            case 'seconds':  return this.getUnitLabel(locale, 'second');
            case 'nanoseconds': {
                const secondsLabel = this.getUnitLabel(locale, 'second');
                const nanoPrefix = this.getNanoPrefixFromPattern(locale, secondsLabel);
                return `${nanoPrefix}${secondsLabel}`;
            }
            default:
                return type;
        }
    }

    getUnitLabel(locale, unit) {
        try {
            let label = new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'long' }).format(1);
            label = label.replace(/\d+/g, '').trim();
            if (label.length > 0) {
                label = label[0].toLocaleLowerCase(locale) + label.slice(1);
            }
            return label;
        } catch {
            return unit;
        }
    }

    getNanoPrefixFromPattern(locale, secondsLabel) {
        const first = secondsLabel[0] || '';
        return first === first.toLocaleUpperCase(locale) ? 'Nano' : 'nano';
    }

    getSlidersHTML() {
        const sliderContainerClass = this.settings.useBootstrap ? 'slider-container mb-3' : 'slider-container';
        const sliders = this.settings.sliders.map(slider => {
            switch (slider) {
                case 'hours':       return this.getSliderHTML('hours',       this.getSliderLabel('hours'),       0, 23);
                case 'minutes':     return this.getSliderHTML('minutes',     this.getSliderLabel('minutes'),     0, 59);
                case 'seconds':     return this.getSliderHTML('seconds',     this.getSliderLabel('seconds'),     0, 59);
                case 'nanoseconds': return this.getSliderHTML('nanoseconds', this.getSliderLabel('nanoseconds'), 0, 999999999);
                default:            return '';
            }
        }).join('');

        return `<div class="${sliderContainerClass}">${sliders}</div>`;
    }

    getSliderHTML(id, label, min, max) {
        const labelClass = this.settings.useBootstrap ? 'form-label me-2' : '';
        const inputClass = this.settings.useBootstrap ? 'form-range w-100' : '';
        return `
                <div class="d-flex flex-row align-items-center">
                        <label for="${id}" class="${labelClass}">${label}:</label>
                        <input type="range" id="${id}" value="0" min="${min}" max="${max}" step="1" class="${inputClass}" aria-label="${label}">
                        <span class="dtp-slider-value" id="${id}-value">0</span>
                </div>
            `;
    }

    getTogglesHTML() {
        const formCheckClass = this.settings.useBootstrap ? 'form-check form-switch' : '';
        const inputClass = this.settings.useBootstrap ? 'form-check-input' : '';
        const labelClass = this.settings.useBootstrap ? 'form-check-label' : '';
        const localLabel = this.getLocalizedLocalLabel();
        const utcLabel = this.getLocalizedUTCLabel();
        return `
                <div class="toggle-container justify-content-between w-100">
                    <div class="${formCheckClass}">
                        <input type="checkbox" id="utc-toggle" class="${inputClass}" aria-label="${this.getLabel('toggleUtc', 'Toggle UTC Time')}">
                        <label for="utc-toggle" class="${labelClass}" id="utc-toggle-label">${localLabel}/${utcLabel}</label>
                    </div>
                    <div class="${formCheckClass} mb-3">
                        <input type="checkbox" id="doy-toggle" class="${inputClass}" aria-label="${this.getLabel('toggleDoy', 'Toggle Day of Year')}">
                        <label for="doy-toggle" class="${labelClass}">${this.getLabel('dayOfMonthDayOfYear', 'Day of Month/Day of Year')}</label>
                    </div>
                </div>
            `;
    }

    getLocalizedLocalLabel() {
        try {
            const dtf = new Intl.DateTimeFormat(this.settings.language, { timeZoneName: 'short' });
            const parts = dtf.formatToParts(new Date());
            const tz = parts.find(p => p.type === 'timeZoneName');
            if (tz && tz.value && tz.value !== 'UTC') return tz.value;
        } catch {}
        return 'Local';
    }

    getLocalizedUTCLabel() {
        try {
            const dtf = new Intl.DateTimeFormat(this.settings.language, { timeZone: 'UTC', timeZoneName: 'short' });
            const parts = dtf.formatToParts(new Date());
            const tz = parts.find(p => p.type === 'timeZoneName');
            if (tz && tz.value) return tz.value;
        } catch {}
        return 'UTC';
    }

    getFooterHTML() {
        const markerLegendHTML = this.getMarkerLegendHTML();
        // Footer is shown if a button is enabled or marker legend is enabled and has marker labels.
        if (!this.settings.showNowButton && !this.settings.showCloseButton && !markerLegendHTML) return '';

        const nowBtnClass   = this.settings.useBootstrap ? 'btn btn-secondary' : 'btn';
        const closeBtnClass = this.settings.useBootstrap ? 'btn btn-primary'   : 'btn';
        const nowLabel = this.getLabel('now', 'Now');
        const closeLabel = this.getLabel('close', 'Close');
        const nowButtonHTML = this.settings.showNowButton
            ? `<button type="button" class="${nowBtnClass}" id="now-button" aria-label="${nowLabel}">${nowLabel}</button>`
            : '';
        const closeButtonHTML = this.settings.showCloseButton
            ? `<button type="button" class="${closeBtnClass}" id="close-button" aria-label="${closeLabel}">${closeLabel}</button>`
            : '';
        return `
        <div class="d-flex justify-content-between align-items-center">
            ${nowButtonHTML}
            ${closeButtonHTML}
        </div>
        ${markerLegendHTML}
    `;
    }

    getMarkerLegendHTML() {
        if (!this.settings.showMarkerLegend) return '';
        if (!Array.isArray(this.markerLegendItems) || this.markerLegendItems.length === 0) return '';

        const maxItems = Number.isInteger(this.settings.markerLegendMaxItems)
            ? Math.max(1, this.settings.markerLegendMaxItems)
            : 6;
        const visibleItems = this.markerLegendItems.slice(0, maxItems);
        const remaining = this.markerLegendItems.length - visibleItems.length;
        const items = visibleItems.map((item) => {
            const swatchStyle = item.color ? ` style="background-color: ${item.color}"` : '';
            return `<span class="dtp-legend-item"><span class="dtp-legend-dot"${swatchStyle}></span>${item.label}</span>`;
        }).join('');
        const more = remaining > 0 ? `<span class="dtp-legend-item">+${remaining}</span>` : '';

        return `<div class="dtp-marker-legend" aria-label="${this.getLabel('markerLegend', 'Markers')}">${items}${more}</div>`;
    }

    getDateDisabledReason(date) {
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const minOnly = this.minDate ? new Date(this.minDate.getFullYear(), this.minDate.getMonth(), this.minDate.getDate()) : null;
        const maxOnly = this.maxDate ? new Date(this.maxDate.getFullYear(), this.maxDate.getMonth(), this.maxDate.getDate()) : null;

        if (minOnly && dateOnly < minOnly) return 'beforeMinDate';
        if (maxOnly && dateOnly > maxOnly) return 'afterMaxDate';
        if (this.disabledWeekdaySet.has(date.getDay())) return 'disabledWeekday';
        if (this.disabledDateSet.has(this.toDateKey(date))) return 'disabledDate';
        return 'disabled';
    }

    cacheElements(container) {
        this.container = container;
        this.datetimePicker = container.querySelector('.datetime-picker');
        this.monthSelect = container.querySelector('#monthSelect');
        this.yearSelect  = container.querySelector('#yearSelect');
        this.calendar    = container.querySelector('#calendar');

        this.hoursSlider       = this.settings.sliders.includes('hours')       ? container.querySelector('#hours')       : null;
        this.minutesSlider     = this.settings.sliders.includes('minutes')     ? container.querySelector('#minutes')     : null;
        this.secondsSlider     = this.settings.sliders.includes('seconds')     ? container.querySelector('#seconds')     : null;
        this.nanosecondsSlider = this.settings.sliders.includes('nanoseconds') ? container.querySelector('#nanoseconds') : null;

        this.hoursValue       = this.hoursSlider       ? container.querySelector('#hours-value') : null;
        this.minutesValue     = this.minutesSlider     ? container.querySelector('#minutes-value') : null;
        this.secondsValue     = this.secondsSlider     ? container.querySelector('#seconds-value') : null;
        this.nanosecondsValue = this.nanosecondsSlider ? container.querySelector('#nanoseconds-value') : null;

        this.utcToggle       = container.querySelector('#utc-toggle');
        this.dowDiv          = container.querySelector('#days-of-week');
        this.doyToggle       = container.querySelector('#doy-toggle');
        this.selectedDatetime = this.settings.showSelectedDatetime ? container.querySelector('#selected-datetime') : null;
        this.closeBtn        = this.settings.showCloseButton ? container.querySelector('#close-button') : null;
    }

    bindEvents(element) {
        if (element) {
            element.addEventListener('click', (e) => this.togglePicker(e));
        }

        this.monthSelect.addEventListener('change', () => this.updateCalendarDate());
        this.yearSelect.addEventListener('change',  () => this.updateCalendarDate());
        this.yearSelect.addEventListener('input',   (e) => this.handleYearInputChange(e));

        const prevMonthButton = this.container.querySelector('#prev-month');
        const nextMonthButton = this.container.querySelector('#next-month');
        prevMonthButton.addEventListener('click', () => this.changeMonth(-1));
        nextMonthButton.addEventListener('click', () => this.changeMonth(1));

        if (this.hoursSlider)       this.hoursSlider.addEventListener('input',       () => this.updateSelectedDatetime());
        if (this.minutesSlider)     this.minutesSlider.addEventListener('input',     () => this.updateSelectedDatetime());
        if (this.secondsSlider)     this.secondsSlider.addEventListener('input',     () => this.updateSelectedDatetime());
        if (this.nanosecondsSlider) this.nanosecondsSlider.addEventListener('input', () => this.updateSelectedDatetime());

        this.utcToggle.addEventListener('change', () => {
            this.updateSelectedDatetime();
            this.updateUtcToggleLabel();
        });

        this.doyToggle.addEventListener('change', () => this.renderCalendar());

        this.calendar.addEventListener('click', (e) => this.handleDateSelection(e));
        this.calendar.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') this.handleDateSelection(e);
        });

        if (this.settings.showNowButton) {
            const nowButton = this.container.querySelector('#now-button');
            nowButton.addEventListener('click', () => this.setToNow());
        }

        if (this.settings.showCloseButton) {
            this.closeBtn.addEventListener('click', (e) => this.togglePicker(e));
        }
    }

    updateSliderValueDisplays() {
        if (this.hoursSlider && this.hoursValue) this.hoursValue.textContent = String(this.hoursSlider.value);
        if (this.minutesSlider && this.minutesValue) this.minutesValue.textContent = String(this.minutesSlider.value);
        if (this.secondsSlider && this.secondsValue) this.secondsValue.textContent = String(this.secondsSlider.value);
        if (this.nanosecondsSlider && this.nanosecondsValue) this.nanosecondsValue.textContent = String(this.nanosecondsSlider.value);
    }

    setToNow() {
        const now = new Date();

        this.selectedDate.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

        if (this.settings.nowSetsTime) {
            this.selectedDate.setHours(now.getHours());
            this.selectedDate.setMinutes(now.getMinutes());
            this.selectedDate.setSeconds(now.getSeconds());
            this.selectedDate.setMilliseconds(now.getMilliseconds());

            if (this.hoursSlider)       this.hoursSlider.value = now.getHours();
            if (this.minutesSlider)     this.minutesSlider.value = now.getMinutes();
            if (this.secondsSlider)     this.secondsSlider.value = now.getSeconds();
            if (this.nanosecondsSlider) this.nanosecondsSlider.value = now.getMilliseconds() * 1e6;
        }

        this.monthSelect.value = now.getMonth();
        this.yearSelect.value  = now.getFullYear();

        this.renderCalendar();
        this.populateYearDropdown();
        this.updateSelectedDatetime();
    }

    changeMonth(delta) {
        this.selectedDate.setMonth(this.selectedDate.getMonth() + delta);
        this.monthSelect.value = this.selectedDate.getMonth();
        this.yearSelect.value  = this.selectedDate.getFullYear();
        this.renderCalendar();
        this.updateSelectedDatetime();
    }

    handleYearInputChange(event) {
        const year = parseInt(event.target.value, 10);
        if (!isNaN(year)) {
            this.selectedDate.setFullYear(year);
            this.monthSelect.value = this.selectedDate.getMonth();
            this.yearSelect.value  = this.selectedDate.getFullYear();
            this.renderCalendar();
            this.updateSelectedDatetime();
        }
    }

    togglePicker(event) {
        event.stopPropagation();

        if (this.settings.mode === 'inline') return;

        const isVisible = this.datetimePicker.style.display === 'block';
        if (!isVisible) {
            this.syncFromInputValue();
            this.positionPicker(event.target);
            this.datetimePicker.style.display = 'block';
            this.datetimePicker.parentElement.style.display = 'block';
            this.datetimePicker.setAttribute('aria-hidden', 'false');
        } else {
            this.datetimePicker.style.display = 'none';
            this.datetimePicker.parentElement.style.display = 'none';
            this.datetimePicker.setAttribute('aria-hidden', 'true');
        }
    }

    syncFromInputValue() {
        if (this.settings.mode !== 'input' || !(this.triggerElement instanceof HTMLInputElement)) {
            return;
        }

        const parsed = this.parseDateLike(this.triggerElement.value);
        if (!parsed) {
            return;
        }

        this.selectedDate = new Date(parsed);

        if (this.hoursSlider) this.hoursSlider.value = this.selectedDate.getHours();
        if (this.minutesSlider) this.minutesSlider.value = this.selectedDate.getMinutes();
        if (this.secondsSlider) this.secondsSlider.value = this.selectedDate.getSeconds();
        if (this.nanosecondsSlider) this.nanosecondsSlider.value = this.selectedDate.getMilliseconds() * 1e6;

        this.monthSelect.value = this.selectedDate.getMonth();
        this.yearSelect.value = this.selectedDate.getFullYear();
        this.renderCalendar();
        this.updateSelectedDatetime();
    }

    positionPicker(trigger) {
        const parent = trigger.offsetParent;
        if (!parent.style.position || parent.style.position === 'static') {
            parent.style.position = 'relative';
        }
    }

    populateDropdowns() {
        this.populateMonthDropdown();
        this.populateYearDropdown();
    }

    populateMonthDropdown() {
        const months = this.getMonthNames();
        this.monthSelect.innerHTML = months
            .map((month, index) => `<option value="${index}">${month}</option>`)
            .join('');
        this.monthSelect.value = this.selectedDate.getMonth();
    }

    getMonthNames() {
        return Array.from({ length: 12 }, (_, i) =>
            new Date(2023, i).toLocaleString(this.settings.language, { month: this.settings.monthLabelFormat })
        );
    }

    renderCalendar() {
        const year  = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth();
        const firstDay    = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        this.calendar.innerHTML = '';
        const fragment = document.createDocumentFragment();

        const emptyCells = (firstDay - this.settings.firstDayOfWeek + 7) % 7;
        for (let i = 0; i < emptyCells; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.setAttribute('role', 'presentation');
            fragment.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            fragment.appendChild(this.createDayCell(new Date(year, month, day), day));
        }

        this.calendar.appendChild(fragment);
    }

    createDayCell(date, day) {
        const cell = document.createElement('div');
        cell.classList.add('day-cell');
        cell.setAttribute('role', 'gridcell');

        if (this.settings.useBootstrap) {
            cell.classList.add('btn', 'btn-outline-secondary');
        }

        const isSelected = this.isSameDate(date, this.selectedDate);
        const isDisabled = this.isDateDisabled(date);
        const marker = this.markerMap.get(this.toDateKey(date));

        cell.textContent = this.doyToggle.checked ? this.getDayOfYear(date) : day;
        cell.dataset.date = this.toDateKey(date);

        if (isSelected) {
            cell.classList.add('selected');
            if (this.settings.useBootstrap) cell.classList.add('btn-primary');
            cell.setAttribute('aria-selected', 'true');
        } else {
            cell.setAttribute('aria-selected', 'false');
        }

        if (isDisabled) {
            cell.classList.add('disabled');
            cell.setAttribute('aria-disabled', 'true');
            cell.tabIndex = -1;
        } else {
            cell.setAttribute('aria-disabled', 'false');
            cell.tabIndex = 0;
        }

        if (marker) {
            cell.classList.add('has-marker');
            if (marker.className) {
                cell.classList.add(marker.className);
            }
            if (marker.tooltip) {
                cell.title = marker.tooltip;
            } else if (marker.label) {
                cell.title = marker.label;
            }

            const markerDot = document.createElement('span');
            markerDot.classList.add('day-marker-dot');
            markerDot.setAttribute('aria-hidden', 'true');
            if (marker.color) {
                markerDot.style.backgroundColor = marker.color;
            }
            cell.appendChild(markerDot);
        }

        return cell;
    }

    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 1);
        const diff  = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
        return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    }

    handleDateSelection(event) {
        const cell = event.target.closest('.day-cell');
        if (!cell) return;

        if (cell.classList.contains('disabled')) {
            if (this.settings.onInvalidSelect) {
                const [year, month, day] = cell.dataset.date.split('-').map(Number);
                const invalidDate = new Date(year, month - 1, day);
                this.settings.onInvalidSelect({
                    date: invalidDate,
                    reason: this.getDateDisabledReason(invalidDate),
                    cell,
                });
            }
            return;
        }

        const [year, month, day] = cell.dataset.date.split('-').map(Number);
        this.selectedDate = new Date(year, month - 1, day);
        this.renderCalendar();
        this.updateSelectedDatetime();

        if (this.settings.onSelect) this.settings.onSelect(new Date(this.selectedDate));
    }

    updateCalendarDate() {
        const year  = parseInt(this.yearSelect.value, 10);
        const month = parseInt(this.monthSelect.value, 10);
        this.selectedDate.setFullYear(year, month);
        this.renderCalendar();
        this.updateSelectedDatetime();
    }

    updateSelectedDatetime() {
        const date = new Date(this.selectedDate);

        if (this.hoursSlider)       date.setHours(this.hoursSlider.value);
        if (this.minutesSlider)     date.setMinutes(this.minutesSlider.value);
        if (this.secondsSlider)     date.setSeconds(this.secondsSlider.value);
        if (this.nanosecondsSlider) date.setMilliseconds(this.nanosecondsSlider.value / 1e6);

        const datetimeString = this.utcToggle.checked
            ? date.toISOString()
            : (this.settings.dateTimeFormat
                ? date.toLocaleString(this.settings.language, this.settings.dateTimeFormat)
                : date.toLocaleString(this.settings.language));

        if (this.settings.showSelectedDatetime) {
            this.selectedDatetime.value = datetimeString;
        }

        this.updateSliderValueDisplays();

        this.updateUtcToggleLabel();

        if (this.settings.mode === 'input') {
            this.triggerElement.value = datetimeString;
        }

        if (this.settings.onChange) this.settings.onChange(date);
    }

    updateUtcToggleLabel() {
        const label = this.container.querySelector('#utc-toggle-label');
        if (!label) return;
        const localLabel = this.getLocalizedLocalLabel();
        const utcLabel   = this.getLocalizedUTCLabel();
        label.textContent = this.utcToggle.checked
            ? `${utcLabel}/${localLabel}`
            : `${localLabel}/${utcLabel}`;
    }

    toggleFeatures() {
        if (!this.settings.showCalendar)    this.calendar.style.display = 'none';
        if (!this.settings.showDaysOfWeek)  this.dowDiv.style.display = 'none';
        if (!this.settings.showSliders)     this.container.querySelector('.slider-container').style.display = 'none';
        if (!this.settings.showUtcToggle)   this.utcToggle.parentElement.style.display = 'none';
        if (!this.settings.showDoyToggle)   this.doyToggle.parentElement.style.display = 'none';
    }

    isSameDate(date1, date2) {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth()    === date2.getMonth()    &&
            date1.getDate()     === date2.getDate()
        );
    }
}

class DateTimePicker {
    static defaultSettings = {
        // Locale & calendar
        language: 'en-US',
        firstDayOfWeek: 0,         // 0 = Sunday, 1 = Monday, etc.
        initialValue: null,        // Initial date value (Date object or parseable string)
        monthLabelFormat: 'long',  // Intl month format: 'long' | 'short' | 'narrow'
        weekdayLabelFormat: 'short', // Intl weekday format: 'long' | 'short' | 'narrow'
        dateTimeFormat: null,      // Optional Intl.DateTimeFormat options for local output
        inputTimeZone: 'local',    // How to interpret incoming strings without timezone: 'local' | 'utc'

        // Display mode: 'inline' | 'input' | 'button'
        mode: 'inline',
        dateOnly: false,

        // Visibility toggles
        showCalendar: true,
        showDaysOfWeek: true,
        showSliders: true,
        showUtcToggle: true,       // renamed from showUTC
        showDoyToggle: false,      // renamed from showDOYtoggle (was lowercase 't')
        showSelectedDatetime: true,
        showSliderValues: false,
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
        theme: null,

        // UTC default
        defaultToUTC: false,

        // Callbacks
        onSelect: null,            // renamed from onDateSelect; called with (Date) on day click
        onChange: null,            // renamed from onTimeChange; called with (Date) on any change
        onInvalidSelect: null,     // called with ({ date, reason, cell }) when a locked date is clicked
    };

    static normalizeOptions(options = {}) {
        const normalized = { ...options };

        if (Object.prototype.hasOwnProperty.call(normalized, 'showUTC') && !Object.prototype.hasOwnProperty.call(normalized, 'showUtcToggle')) {
            normalized.showUtcToggle = normalized.showUTC;
        }
        if (Object.prototype.hasOwnProperty.call(normalized, 'showDOYtoggle') && !Object.prototype.hasOwnProperty.call(normalized, 'showDoyToggle')) {
            normalized.showDoyToggle = normalized.showDOYtoggle;
        }
        if (Array.isArray(normalized.slidersToShow) && !Array.isArray(normalized.sliders)) {
            normalized.sliders = normalized.slidersToShow.map((name) => name === 'milliseconds' ? 'nanoseconds' : name);
        }
        if (Object.prototype.hasOwnProperty.call(normalized, 'setNowIncludesTime') && !Object.prototype.hasOwnProperty.call(normalized, 'nowSetsTime')) {
            normalized.nowSetsTime = normalized.setNowIncludesTime;
        }
        if (Object.prototype.hasOwnProperty.call(normalized, 'dayTimeLabel') && !Object.prototype.hasOwnProperty.call(normalized, 'datetimeLabel')) {
            normalized.datetimeLabel = normalized.dayTimeLabel;
        }
        if (typeof normalized.onDateSelect === 'function' && typeof normalized.onSelect !== 'function') {
            normalized.onSelect = normalized.onDateSelect;
        }
        if (typeof normalized.onTimeChange === 'function' && typeof normalized.onChange !== 'function') {
            normalized.onChange = normalized.onTimeChange;
        }

        return normalized;
    }

    static defaultTheme = {
        // Colors
        primaryColor: '#0d6efd',
        secondaryColor: '#6c757d',
        dangerColor: '#dc3545',
        successColor: '#198754',
        warningColor: '#ffc107',
        infoColor: '#0dcaf0',

        // Background Colors
        backgroundColor: 'white',
        hoverColor: '#e0e0ff',
        disabledColor: '#f1f1f1',
        dowBackgroundColor: 'transparent',
        sliderTrackColor: '#dddddd',
        sliderThumbColor: '#000000',

        // Text Colors
        textColor: '#000',
        textMuted: '#666',

        // Border
        borderColor: '#ccc',
        borderWidth: '1px',
        borderRadius: '0.25rem',
        buttonBorderRadius: '0.25rem',

        // Shadows
        shadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    };

    constructor(element, options) {
        options = DateTimePicker.normalizeOptions(options || {});
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

        if (!['local', 'utc'].includes(this.settings.inputTimeZone)) {
            this.settings.inputTimeZone = 'local';
        }

        this.settings.monthLabelFormat = this.normalizeWidthOption(this.settings.monthLabelFormat, 'long');
        this.settings.weekdayLabelFormat = this.normalizeWidthOption(this.settings.weekdayLabelFormat, 'short');
        this.settings.labels = this.getLocalizedLabels(this.settings.language, userLabels);

        // Validate mode
        if (!['inline', 'input', 'button'].includes(this.settings.mode)) {
            console.warn(`DateTimePicker: unknown mode "${this.settings.mode}", falling back to "inline".`);
            this.settings.mode = 'inline';
        }

        this.normalizeDateOnlySettings();

        // Initialize selected date. For input mode, respect an existing input value when initialValue is omitted.
        const initialDate = this.resolveInitialDate(element);
        this.selectedDate = isNaN(initialDate.getTime()) ? new Date() : initialDate;
        if (this.settings.dateOnly) {
            this.clearTime(this.selectedDate);
        }

        // Placeholder for the container, which will be initialized in `init`
        this.container = null;

        // Build normalized lookup structures used during rendering and selection.
        this.prepareConstraints();
        this.prepareMarkers();

        // Call the initialization method
        this.init(element);
    }

    normalizeDateOnlySettings() {
        if (!this.settings.dateOnly) return;
        this.settings.showSliders = false;
        this.settings.showUtcToggle = false;
        this.settings.sliders = [];
        this.settings.nowSetsTime = false;
    }

    clearTime(date) {
        if (!(date instanceof Date) || isNaN(date.getTime())) return;
        date.setHours(0, 0, 0, 0);
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

        if (value instanceof Date) {
            const parsedDate = new Date(value);
            return isNaN(parsedDate.getTime()) ? null : parsedDate;
        }

        if (typeof value === 'number') {
            const parsedNumber = new Date(value);
            return isNaN(parsedNumber.getTime()) ? null : parsedNumber;
        }

        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed) return null;

            if (this.hasExplicitTimeZone(trimmed)) {
                const explicit = new Date(trimmed);
                return isNaN(explicit.getTime()) ? null : explicit;
            }

            const naive = this.parseNaiveDateString(trimmed);
            if (naive) return naive;

            const fallback = new Date(trimmed);
            return isNaN(fallback.getTime()) ? null : fallback;
        }

        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    hasExplicitTimeZone(value) {
        // Only treat a trailing offset as timezone when a time component exists.
        const hasTime = /[T\s]\d{2}:\d{2}/.test(value);
        return hasTime && /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(value);
    }

    parseNaiveDateString(value) {
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?$/);
        if (!match) return null;

        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const hour = match[4] === undefined ? 0 : Number(match[4]);
        const minute = match[5] === undefined ? 0 : Number(match[5]);
        const second = match[6] === undefined ? 0 : Number(match[6]);
        const fraction = match[7] || '';
        const millisecond = Number(fraction.slice(0, 3).padEnd(3, '0'));

        if (month < 1 || month > 12 || day < 1 || day > 31) return null;
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) return null;

        if (this.settings.inputTimeZone === 'utc') {
            const asUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
            if (asUtc.getUTCFullYear() !== year || asUtc.getUTCMonth() !== month - 1 || asUtc.getUTCDate() !== day) {
                return null;
            }
            return asUtc;
        }

        const asLocal = new Date(year, month - 1, day, hour, minute, second, millisecond);
        if (asLocal.getFullYear() !== year || asLocal.getMonth() !== month - 1 || asLocal.getDate() !== day) {
            return null;
        }
        return asLocal;
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
            if (value === null || value === undefined || value === '') return null;
            return this.parseDateLike(value);
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
            const parsed = this.parseDateLike(marker.date);
            if (!parsed) continue;
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

        if (this.utcToggle) {
            this.utcToggle.checked = !!this.settings.defaultToUTC;
        }

        this.syncSlidersFromDate();

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
        this.updateAllSliderValues();
        this.updateSelectedDatetime();
        this.applyThemeVariables();
    }

    applyThemeVariables() {
        if (!this.datetimePicker) return;

        // Apply themeVariables (raw CSS custom property overrides scoped to the picker)
        if (this.settings.themeVariables && typeof this.settings.themeVariables === 'object') {
            for (const [key, value] of Object.entries(this.settings.themeVariables)) {
                if (typeof key === 'string' && key.startsWith('--')) {
                    this.datetimePicker.style.setProperty(key, String(value));
                }
            }
        }

        // Map theme object properties to the CSS custom properties used by the stylesheet
        if (this.settings.theme && typeof this.settings.theme === 'object') {
            const theme = this.settings.theme;
            const el = this.datetimePicker;
            const map = {
                primaryColor:           '--dtp-primary',
                primaryHoverColor:      '--dtp-primary-hover',
                primaryTextColor:       '--dtp-primary-text',
                backgroundColor:        '--dtp-bg',
                navBackgroundColor:     '--dtp-nav-bg',
                hoverColor:             '--dtp-hover-bg',
                dowBackgroundColor:     '--dtp-header-bg',
                dowTextColor:           '--dtp-header-text',
                headerBackgroundColor:  '--dtp-header-bg',
                headerTextColor:        '--dtp-header-text',
                textColor:              '--dtp-text',
                textMuted:              '--dtp-text-muted',
                borderColor:            '--dtp-border',
                borderLightColor:       '--dtp-border-light',
                todayBorderColor:       '--dtp-today-border',
                sliderTrackColor:       '--dtp-slider-track',
                sliderThumbColor:       '--dtp-slider-thumb',
                width:                  '--dtp-width',
                cellSize:               '--dtp-cell-size',
            };
            for (const [prop, cssVar] of Object.entries(map)) {
                if (theme[prop]) el.style.setProperty(cssVar, theme[prop]);
            }
        }
    }

    createPicker(element) {
        const container = document.createElement('div');
        // Keep legacy class and add the documented container class used by CSS.
        container.classList.add('datetime-container', 'datetime-picker-container');
        container.style.display = 'none';

        container.innerHTML = `
        <div class="datetime-picker border rounded shadow" role="dialog" aria-hidden="true">
            ${this.getControlsHTML()}
            <div class="dtp-calendar-section">
                ${this.getDOWHTML()}
                ${this.getCalendarHTML()}
            </div>
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

        const themeClasses = this.getThemeClasses();
        if (this.datetimePicker) {
            if (themeClasses.length > 0) {
                this.datetimePicker.classList.add(...themeClasses);
            }
        }
    }

    getThemeClasses() {
        const raw = this.settings.themeClass;
        if (!raw) {
            return this.settings.useBootstrap ? ['dtp-theme-bootstrap'] : [];
        }
        if (Array.isArray(raw)) {
            return raw
                .map((item) => String(item || '').trim())
                .filter((item) => item.length > 0);
        }

        return String(raw)
            .split(/\s+/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }

    getControlsHTML() {
        return `
    <div class="dtp-nav-section">
        <button type="button" class="dtp-nav-btn dtp-prev" id="prev-month" aria-label="${this.getLabel('prevMonth', 'Previous Month')}"></button>
        <div class="dtp-month-year">
            <select id="monthSelect" aria-label="${this.getLabel('selectMonth', 'Select Month')}"></select>
            <select id="yearSelect" aria-label="${this.getLabel('selectYear', 'Select Year')}"></select>
        </div>
        <button type="button" class="dtp-nav-btn dtp-next" id="next-month" aria-label="${this.getLabel('nextMonth', 'Next Month')}"></button>
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
            dowCell.classList.add('dow-cell', 'day-name');
            dowDiv.appendChild(dowCell);
        }

        return dowDiv.outerHTML;
    }

    populateYearDropdown() {
        const currentYear = this.selectedDate.getFullYear();
        if (typeof this._yearRangeStart !== 'number' || typeof this._yearRangeEnd !== 'number') {
            const range = 20;
            this._yearRangeStart = currentYear - Math.floor(range / 2);
            this._yearRangeEnd = currentYear + Math.floor(range / 2);
        }

        this.ensureYearInRange(currentYear);
        this.renderYearOptions(currentYear);

        if (!this._yearDropdownListenerAttached) {
            this.yearSelect.addEventListener('change', (e) => this.handleYearSelection(e));
            this._yearDropdownListenerAttached = true;
        }
    }

    ensureYearInRange(year) {
        if (!Number.isInteger(year)) return;

        const range = 20;
        while (year > this._yearRangeEnd) {
            this._yearRangeStart += range;
            this._yearRangeEnd += range;
        }
        while (year < this._yearRangeStart) {
            this._yearRangeStart -= range;
            this._yearRangeEnd -= range;
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
        return `<div id="calendar" class="calendar dtp-calendar mb-3" role="grid" aria-label="Calendar"></div>`;
    }

    getSelectedTimeHTML() {
        const label = this.getDatetimeLabel();
        return this.settings.showSelectedDatetime
            ? `<div class="d-flex flex-row justify-content-between mb-1 dtp-selected-row">
                ${label ? `<label for="selected-datetime">${label}:</label>` : '<span></span>'}
                <input id="selected-datetime" class="text-end dtp-selected-datetime" aria-live="polite" aria-readonly="true" readonly disabled aria-disabled="true">
            </div>`
            : '';
    }

    getDatetimeLabel() {
        // Use datetimeLabel if explicitly set (even empty string suppresses label)
        if (typeof this.settings.datetimeLabel === 'string') {
            return this.settings.datetimeLabel;
        }
        const lang = (this.settings.language || 'en-US').split('-')[0];
        if (lang === 'en') return this.settings.dateOnly ? 'Date' : 'Day Time';
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
        const sliderContainerClass = 'slider-container sliders-container';
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
        const valueMarkup = this.settings.showSliderValues
            ? `<span class="slider-value dtp-slider-value" id="${id}-value">0</span>`
            : '';
        return `
                <div class="d-flex align-items-center mb-1 dtp-slider-row${this.settings.showSliderValues ? '' : ' dtp-slider-row--no-value'}">
                        <label for="${id}">${label}:</label>
                        <input type="range" id="${id}" value="0" min="${min}" max="${max}" step="1" aria-label="${label}">
                        ${valueMarkup}
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
                <div class="toggle-container justify-content-between w-100 dtp-toggle-container">
                    <div class="${formCheckClass}">
                        <input type="checkbox" id="utc-toggle" class="${inputClass}" aria-label="${this.getLabel('toggleUtc', 'Toggle UTC Time')}">
                        <label for="utc-toggle" class="${labelClass}" id="utc-toggle-label">${localLabel}/${utcLabel}</label>
                    </div>
                    <div class="${formCheckClass}">
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
        <div class="dtp-footer">
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
        this.sliderValueElements = {
            hours: container.querySelector('#hours-value'),
            minutes: container.querySelector('#minutes-value'),
            seconds: container.querySelector('#seconds-value'),
            nanoseconds: container.querySelector('#nanoseconds-value'),
        };

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

        if (this.hoursSlider)       this.hoursSlider.addEventListener('input',       () => this.handleSliderInput('hours'));
        if (this.minutesSlider)     this.minutesSlider.addEventListener('input',     () => this.handleSliderInput('minutes'));
        if (this.secondsSlider)     this.secondsSlider.addEventListener('input',     () => this.handleSliderInput('seconds'));
        if (this.nanosecondsSlider) this.nanosecondsSlider.addEventListener('input', () => this.handleSliderInput('nanoseconds'));

        this.utcToggle.addEventListener('change', () => {
            this.syncSlidersFromDate();
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

    setToNow() {
        const now = new Date();

        this.selectedDate.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
        if (this.settings.dateOnly) {
            this.clearTime(this.selectedDate);
        }

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
        this.populateYearDropdown();
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
        this.syncSlidersFromDate();
        this.populateYearDropdown();

        this.monthSelect.value = this.selectedDate.getMonth();
        this.yearSelect.value = this.selectedDate.getFullYear();
        this.renderCalendar();
        this.updateSelectedDatetime();
        this.updateAllSliderValues();
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

    syncSlidersFromDate(date = this.selectedDate) {
        if (!(date instanceof Date) || isNaN(date.getTime())) return;
        if (this.settings.dateOnly) return;

        const useUTC = this.utcToggle ? this.utcToggle.checked : !!this.settings.defaultToUTC;
        if (this.hoursSlider) {
            this.hoursSlider.value = useUTC ? date.getUTCHours() : date.getHours();
        }
        if (this.minutesSlider) {
            this.minutesSlider.value = useUTC ? date.getUTCMinutes() : date.getMinutes();
        }
        if (this.secondsSlider) {
            this.secondsSlider.value = useUTC ? date.getUTCSeconds() : date.getSeconds();
        }
        if (this.nanosecondsSlider) {
            this.nanosecondsSlider.value = date.getMilliseconds() * 1e6;
        }
    }

    createDayCell(date, day) {
        const cell = document.createElement('div');
        cell.classList.add('day-cell');
        cell.setAttribute('role', 'gridcell');


        const isSelected = this.isSameDate(date, this.selectedDate);
        const isDisabled = this.isDateDisabled(date);
        const marker = this.markerMap.get(this.toDateKey(date));

        cell.textContent = this.doyToggle.checked ? this.getDayOfYear(date) : day;
        cell.dataset.date = this.toDateKey(date);

        if (isSelected) {
            cell.classList.add('selected');
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
        if (Number.isNaN(year) || Number.isNaN(month)) return;
        this.selectedDate.setFullYear(year, month);
        if (this.settings.dateOnly) {
            this.clearTime(this.selectedDate);
        }
        this.renderCalendar();
        this.updateSelectedDatetime();
    }

    updateSelectedDatetime() {
        const date = new Date(this.selectedDate);

        if (this.settings.dateOnly) {
            this.clearTime(date);
            const dateString = this.toDateKey(date);
            this.selectedDate = new Date(date);

            if (this.settings.showSelectedDatetime && this.selectedDatetime) {
                this.selectedDatetime.value = dateString;
            }

            if (this.settings.mode === 'input') {
                this.triggerElement.value = dateString;
            }

            if (this.settings.onChange) this.settings.onChange(new Date(date));
            this.updateAllSliderValues();
            return;
        }

        const useUTC = this.utcToggle ? this.utcToggle.checked : !!this.settings.defaultToUTC;
        if (useUTC) {
            if (this.hoursSlider)       date.setUTCHours(this.hoursSlider.value);
            if (this.minutesSlider)     date.setUTCMinutes(this.minutesSlider.value);
            if (this.secondsSlider)     date.setUTCSeconds(this.secondsSlider.value);
            if (this.nanosecondsSlider) date.setUTCMilliseconds(this.nanosecondsSlider.value / 1e6);
        } else {
            if (this.hoursSlider)       date.setHours(this.hoursSlider.value);
            if (this.minutesSlider)     date.setMinutes(this.minutesSlider.value);
            if (this.secondsSlider)     date.setSeconds(this.secondsSlider.value);
            if (this.nanosecondsSlider) date.setMilliseconds(this.nanosecondsSlider.value / 1e6);
        }

        const datetimeString = useUTC
            ? date.toISOString()
            : (this.settings.dateTimeFormat
                ? date.toLocaleString(this.settings.language, this.settings.dateTimeFormat)
                : date.toLocaleString(this.settings.language));

        this.selectedDate = new Date(date);

        if (this.settings.showSelectedDatetime && this.selectedDatetime) {
            this.selectedDatetime.value = datetimeString;
        }

        this.updateUtcToggleLabel();

        if (this.settings.mode === 'input') {
            this.triggerElement.value = datetimeString;
        }

        if (this.settings.onChange) this.settings.onChange(date);
        this.updateAllSliderValues();
    }

    updateUtcToggleLabel() {
        const label = this.container.querySelector('#utc-toggle-label');
        if (!label || !this.utcToggle) return;
        const localLabel = this.getLocalizedLocalLabel();
        const utcLabel   = this.getLocalizedUTCLabel();
        label.textContent = this.utcToggle.checked
            ? `${utcLabel}/${localLabel}`
            : `${localLabel}/${utcLabel}`;
    }

    toggleFeatures() {
        if (!this.settings.showCalendar)    this.calendar.style.display = 'none';
        if (!this.settings.showDaysOfWeek)  this.dowDiv.style.display = 'none';
        const sliderContainer = this.container.querySelector('.slider-container');
        if (!this.settings.showSliders && sliderContainer) sliderContainer.style.display = 'none';

        if (!this.settings.showUtcToggle && this.utcToggle && this.utcToggle.parentElement) {
            this.utcToggle.parentElement.style.display = 'none';
        }
        if (!this.settings.showDoyToggle && this.doyToggle && this.doyToggle.parentElement) {
            this.doyToggle.parentElement.style.display = 'none';
        }
        // Hide entire toggle container if both are off
        if (!this.settings.showUtcToggle && !this.settings.showDoyToggle) {
            const toggleContainer = this.container.querySelector('.toggle-container');
            if (toggleContainer) toggleContainer.style.display = 'none';
        }

        // Hide the selected-datetime row when showSelectedDatetime is false
        if (!this.settings.showSelectedDatetime) {
            const dtInput = this.container.querySelector('#selected-datetime');
            if (dtInput && dtInput.closest('.d-flex')) {
                dtInput.closest('.d-flex').style.display = 'none';
            }
        }
    }

    isSameDate(date1, date2) {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth()    === date2.getMonth()    &&
            date1.getDate()     === date2.getDate()
        );
    }

    handleSliderInput(type) {
        this.updateSliderValue(type);
        this.updateSelectedDatetime();
    }

    updateSliderValue(type) {
        const slider = this[`${type}Slider`];
        const valueEl = this.sliderValueElements && this.sliderValueElements[type];
        if (!slider || !valueEl) return;

        const value = Number(slider.value);
        valueEl.textContent = type === 'nanoseconds'
            ? String(value).padStart(9, '0')
            : String(value).padStart(2, '0');
    }

    updateAllSliderValues() {
        ['hours', 'minutes', 'seconds', 'nanoseconds'].forEach((type) => this.updateSliderValue(type));
    }

    getSelectedDate() {
        return new Date(this.selectedDate);
    }

    setDate(date) {
        const parsed = this.parseDateLike(date);
        if (!parsed) return false;

        this.selectedDate = new Date(parsed);
        if (this.settings.dateOnly) {
            this.clearTime(this.selectedDate);
        }
        this.syncSlidersFromDate();
        this.populateYearDropdown();

        this.monthSelect.value = this.selectedDate.getMonth();
        this.yearSelect.value = this.selectedDate.getFullYear();
        this.renderCalendar();
        this.updateSelectedDatetime();
        return true;
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        if (this.triggerElement && this.triggerElement.dataset) {
            this.triggerElement.dataset.datepickerInitialized = '';
        }
    }
}

(function registerDateTimePickerHelpers() {
    if (typeof window === 'undefined') return;

    window.DateTimePickers = window.DateTimePickers || {};

    window.initDateTimePickers = function initDateTimePickers(customOptions) {
        const options = DateTimePicker.normalizeOptions(customOptions || {});
        const elements = document.querySelectorAll('.datepick');

        elements.forEach((element) => {
            if (element.dataset.datepickerInitialized) return;

            const elementId = element.id;
            if (!elementId) {
                console.warn('DateTimePicker: Element with class "datepick" has no ID, skipping:', element);
                return;
            }

            const pickerOptions = { ...options };
            const initialValue = element.value || element.dataset.initialValue;
            if (initialValue) {
                pickerOptions.initialValue = initialValue;
            }

            const dispatchInput = () => {
                if (window.DateTimePickers[elementId]) {
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                }
            };
            if (typeof pickerOptions.onSelect !== 'function') pickerOptions.onSelect = dispatchInput;
            if (typeof pickerOptions.onChange !== 'function') pickerOptions.onChange = dispatchInput;

            window.DateTimePickers[elementId] = new DateTimePicker(element, pickerOptions);
            element.dataset.datepickerInitialized = 'true';
        });
    };

    window.getDateTimePicker = function getDateTimePicker(id) {
        return window.DateTimePickers[id] || null;
    };

    window.copyDateTime = function copyDateTime(fromId, toId, callback) {
        const fromPicker = window.getDateTimePicker(fromId);
        const toPicker = window.getDateTimePicker(toId);
        if (!fromPicker || !toPicker) {
            return false;
        }

        toPicker.setDate(fromPicker.getSelectedDate());
        const toElement = document.getElementById(toId);
        if (toElement) {
            toElement.dispatchEvent(new Event('input', { bubbles: true }));
        }

        if (typeof callback === 'function') callback();
        return true;
    };

    window.destroyDateTimePicker = function destroyDateTimePicker(id) {
        const picker = window.DateTimePickers[id];
        if (!picker) return;
        picker.destroy();
        delete window.DateTimePickers[id];
    };

    window.reinitDateTimePicker = function reinitDateTimePicker(id, options) {
        window.destroyDateTimePicker(id);
        const element = document.getElementById(id);
        if (!element) return;
        element.classList.add('datepick');
        window.initDateTimePickers(options || {});
    };

    // Explicit init only. Call window.initDateTimePickers(options) when you want
    // automatic wiring for .datepick elements in a specific context.
})();

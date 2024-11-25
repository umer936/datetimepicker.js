(function (global) {
    const defaultSettings = {
        language: 'en-US',
        showCalendar: true,
        showSliders: true,
        showUTC: true,
        showDOYtoggle: false,
        mode: 'inline', // Options: 'inline', 'input', 'button'
        useBootstrap: false, // Option to use Bootstrap 5 styling
        onDateSelect: null, // Callback for when a date is selected
        onTimeChange: null, // Callback for when time changes
    };

    class DateTimePicker {
        constructor(element, options) {
            this.settings = { ...defaultSettings, ...options };
            this.selectedDate = new Date();
            this.today = new Date();
            this.container = null;
            this.init(element);
        }

        init(element) {
            this.createPicker(element);
            this.populateDropdowns();
            this.renderCalendar();
            this.bindEvents(element);

            if (this.settings.mode !== 'inline') {
                this.datetimePicker.style.display = 'none';
            }

            this.toggleFeatures();
        }

        createPicker(element) {
            const container = document.createElement('div');
            container.classList.add('datetime-container', 'position-relative');

            container.innerHTML = `
                ${this.getTriggerHTML()}
                <div class="datetime-picker border rounded shadow p-3 bg-white" role="dialog" aria-hidden="true">
                    ${this.getControlsHTML()}
                    ${this.getCalendarHTML()}
                    ${this.getSlidersHTML()}
                    ${this.getTogglesHTML()}
                    ${this.getFooterHTML()}
                </div>
            `;

            element.appendChild(container);
            this.cacheElements(container);
        }

        getTriggerHTML() {
            if (this.settings.mode === 'input') {
                return `<input type="text" class="form-control datetime-input" readonly placeholder="Select Date and Time" aria-label="Date Time Input">`;
            }
            if (this.settings.mode === 'button') {
                return `<button class="btn btn-primary datetime-button" aria-label="Pick Date and Time">Pick Date and Time</button>`;
            }
            return '';
        }

        getControlsHTML() {
            return `
        <div class="calendar-controls mb-3 d-flex align-items-center justify-content-between">
            <div class="month-selector">
                <div class="input-group">
                    <button type="button" class="btn btn-primary m-0" id="prev-month" aria-label="Previous Month">
                        <span>&lt;</span>
                    </button>
                    <select id="monthSelect" class="form-select pe-4" aria-label="Select Month"></select>
                    <button type="button" class="btn btn-primary m-0" id="next-month" aria-label="Next Month">
                        <span>&gt;</span>
                    </button>
                </div>
            </div>
            <div class="year-selector">
                <input type="number" id="yearSelect" class="form-control" aria-label="Select Year" />
            </div>
        </div>
    `;
        }

        getCalendarHTML() {
            return `<div id="calendar" class="calendar mb-3" role="grid" aria-label="Calendar"></div>`;
        }

        getSlidersHTML() {
            return `
                <div class="slider-container mb-3">
                    ${this.getSliderHTML('hours', 'Hours', 0, 23)}
                    ${this.getSliderHTML('minutes', 'Minutes', 0, 59)}
                    ${this.getSliderHTML('seconds', 'Seconds', 0, 59)}
                    ${this.getSliderHTML('nanoseconds', 'Nanoseconds', 0, 999999999)}
                </div>
            `;
        }

        getSliderHTML(id, label, min, max) {
            return `
                <div class="d-flex flex-column mb-2">
                    <label for="${id}" class="form-label">${label}:</label>
                    <input type="range" id="${id}" min="${min}" max="${max}" step="1" class="form-range" aria-label="${label}">
                </div>
            `;
        }

        getTogglesHTML() {
            return `
                <div class="toggle-container">
                    <div class="form-check form-switch mb-3">
                        <input type="checkbox" id="utc-toggle" class="form-check-input" aria-label="Toggle UTC Time">
                        <label for="utc-toggle" class="form-check-label">Local/UTC</label>
                    </div>
                    <div class="form-check form-switch mb-3">
                        <input type="checkbox" id="doy-toggle" class="form-check-input" aria-label="Toggle Day of Year">
                        <label for="doy-toggle" class="form-check-label">Day of Month/Day of Year</label>
                    </div>
                </div>
            `;
        }

        getFooterHTML() {
            return `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <label>Selected Date and Time:</label>
                <div id="selected-datetime" aria-live="polite"></div>
            </div>
            <button type="button" class="btn btn-secondary" id="now-button" aria-label="Set to Now">Now</button>
        </div>
    `;
        }

        cacheElements(container) {
            this.container = container;
            this.datetimePicker = container.querySelector('.datetime-picker');
            this.inputDatetime = container.querySelector('.datetime-input');
            this.buttonDatetime = container.querySelector('.datetime-button');
            this.monthSelect = container.querySelector('#monthSelect');
            this.yearSelect = container.querySelector('#yearSelect');
            this.calendar = container.querySelector('#calendar');
            this.hoursSlider = container.querySelector('#hours');
            this.minutesSlider = container.querySelector('#minutes');
            this.secondsSlider = container.querySelector('#seconds');
            this.nanosecondsSlider = container.querySelector('#nanoseconds');
            this.utcToggle = container.querySelector('#utc-toggle');
            this.doyToggle = container.querySelector('#doy-toggle');
            this.selectedDatetime = container.querySelector('#selected-datetime');
        }

        bindEvents() {
            const trigger = this.inputDatetime || this.buttonDatetime;

            if (trigger) {
                trigger.addEventListener('click', (e) => this.togglePicker(e));
                document.addEventListener('click', (e) => this.closePicker(e));
            }

            this.monthSelect.addEventListener('change', () => this.updateCalendarDate());
            this.yearSelect.addEventListener('change', () => this.updateCalendarDate());
            this.yearSelect.addEventListener('input', (e) => this.handleYearInputChange(e)); // Handle year input changes

            // Month navigation
            const prevMonthButton = this.container.querySelector('#prev-month');
            const nextMonthButton = this.container.querySelector('#next-month');

            prevMonthButton.addEventListener('click', () => this.changeMonth(-1));
            nextMonthButton.addEventListener('click', () => this.changeMonth(1));

            [this.hoursSlider, this.minutesSlider, this.secondsSlider, this.nanosecondsSlider].forEach((slider) =>
                slider.addEventListener('input', () => this.updateSelectedDatetime())
            );

            this.utcToggle.addEventListener('change', () => this.updateSelectedDatetime());
            this.doyToggle.addEventListener('change', () => this.renderCalendar());

            this.calendar.addEventListener('click', (e) => this.handleDateSelection(e));
            this.doyToggle.addEventListener('change', () => this.renderCalendar());

            // Add event listener for "Now" button
            const nowButton = this.container.querySelector('#now-button');
            nowButton.addEventListener('click', () => this.setToNow());
        }

        setToNow() {
            this.selectedDate = new Date(); // Set to current date and time
            this.renderCalendar(); // Re-render the calendar with the new date
            this.updateSelectedDatetime(); // Update the selected date and time in the UI
        }

        changeMonth(delta) {
            const currentMonth = this.selectedDate.getMonth();
            this.selectedDate.setMonth(currentMonth + delta);
            this.renderCalendar();
            this.updateSelectedDatetime();
        }

        handleYearInputChange(event) {
            const year = parseInt(event.target.value, 10);
            if (!isNaN(year)) {
                this.selectedDate.setFullYear(year);
                this.renderCalendar();
                this.updateSelectedDatetime();
            }
        }

        togglePicker(event) {
            event.stopPropagation();
            const isVisible = this.datetimePicker.style.display === 'block';
            this.datetimePicker.style.display = isVisible ? 'none' : 'block';
        }

        closePicker(event) {
            if (!this.container.contains(event.target)) {
                this.datetimePicker.style.display = 'none';
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
            this.monthSelect.value = this.selectedDate.getMonth(); // Set the selected month
        }

        populateYearDropdown() {
            this.yearSelect.value = this.selectedDate.getFullYear(); // Set the selected year
        }

        getMonthNames() {
            return Array.from({ length: 12 }, (_, i) =>
                new Date(2023, i).toLocaleString(this.settings.language, { month: 'long' })
            );
        }

        renderCalendar() {
            const year = this.selectedDate.getFullYear();
            const month = this.selectedDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            this.calendar.innerHTML = '';

            // Fill empty cells for alignment
            for (let i = 0; i < firstDay; i++) {
                this.calendar.appendChild(document.createElement('div'));
            }

            // Fill day cells
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const cell = this.createDayCell(date, day);
                this.calendar.appendChild(cell);
            }
        }

        createDayCell(date, day) {
            const cell = document.createElement('div');
            cell.classList.add('day-cell');


             // Use regular day
            cell.textContent = this.doyToggle.checked
                ? this.getDayOfYear(date) // Use DOY
                : day;
            cell.dataset.date = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            if (this.isSameDate(date, this.selectedDate)) {
                cell.classList.add('selected');
            }

            return cell;
        }

        getDayOfYear(date) {
            const start = new Date(date.getFullYear(), 0, 1);
            const diff = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
            return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
        }

        handleDateSelection(event) {
            const cell = event.target.closest('.day-cell');
            if (!cell) return;

            const [year, month, day] = cell.dataset.date.split('-').map(Number);
            const date = new Date(year, month - 1, day); // month is zero-indexed

            this.selectedDate = date;
            this.renderCalendar();
            this.updateSelectedDatetime();

            if (this.settings.onDateSelect) {
                this.settings.onDateSelect(date);
            }
        }

        updateCalendarDate() {
            const year = parseInt(this.yearSelect.value, 10);
            const month = parseInt(this.monthSelect.value, 10);
            this.selectedDate.setFullYear(year, month);
            this.renderCalendar();
        }

        updateSelectedDatetime() {
            const date = new Date(this.selectedDate);
            date.setHours(this.hoursSlider.value);
            date.setMinutes(this.minutesSlider.value);
            date.setSeconds(this.secondsSlider.value);
            date.setMilliseconds(this.nanosecondsSlider.value / 1e6);

            const datetimeString = this.utcToggle.checked
                ? date.toISOString()
                : date.toLocaleString(this.settings.language);

            // Update the displayed selected datetime
            this.selectedDatetime.textContent = datetimeString;

            // Update the input box if mode is 'input'
            if (this.settings.mode === 'input' && this.inputDatetime) {
                this.inputDatetime.value = datetimeString;
            }

            if (this.settings.onTimeChange) {
                this.settings.onTimeChange(date);
            }
        }

        toggleFeatures() {
            if (!this.settings.showCalendar) this.calendar.style.display = 'none';
            if (!this.settings.showSliders) this.container.querySelector('.slider-container').style.display = 'none';
            if (!this.settings.showUTC) this.utcToggle.parentElement.style.display = 'none';
            if (!this.settings.showDOYtoggle) this.doyToggle.parentElement.style.display = 'none';
        }

        isSameDate(date1, date2) {
            return (
                date1.getFullYear() === date2.getFullYear() &&
                date1.getMonth() === date2.getMonth() &&
                date1.getDate() === date2.getDate()
            );
        }
    }

    global.DateTimePicker = {
        init: (element, options) => new DateTimePicker(element, options),
    };
})(window);

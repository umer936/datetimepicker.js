class DateTimePicker {
    static defaultSettings = {
        language: 'en-US',
        showCalendar: true,
        showDaysOfWeek: true,
        showSliders: true,
        showUTC: true,
        showDOYtoggle: false,
        mode: 'inline', // Options: 'inline', 'input', 'button'
        useBootstrap: false, // Option to use Bootstrap 5 styling
        onDateSelect: null, // Callback for when a date is selected
        onTimeChange: null, // Callback for when time changes
        setNowIncludesTime: false, // Whether "Now" updates the time
        slidersToShow: ['hours', 'minutes'], // Default: Show hours and minutes sliders
        showFooter: true, // Control visibility of footer
        showNowButton: true, // Show or hide the "Now" button
        showSelectedDatetime: true, // Show or hide the selected datetime
        showCloseButton: true, // Show or hide the "Close" button
    };

    constructor(element, options) {
        // Merge default settings with the provided options
        this.settings = {...DateTimePicker.defaultSettings, ...options};

        // Initialize the selectedDate, validate it, and handle invalid dates
        const initialDate = options?.initialValue ? new Date(options.initialValue) : new Date();
        this.selectedDate = isNaN(initialDate.getTime()) ? new Date() : initialDate;

        // Placeholder for the container, which will be initialized in `init`
        this.container = null;

        // Call the initialization method
        this.init(element);
    }

    init(element) {
        this.createPicker(element);
        this.populateDropdowns();
        this.renderCalendar();
        this.bindEvents(element);

        // Fix display for inline mode
        if (this.settings.mode === 'inline') {
            this.container.style.display = 'block';  // Make the container always visible
            this.datetimePicker.style.display = 'block'; // Picker should be shown
            this.datetimePicker.style.position = 'static'; // Embedded within the parent container
        } else {
            this.container.style.display = 'none'; // Hide container in non-inline modes
            this.datetimePicker.style.display = 'none'; // Hide datetime picker
            this.datetimePicker.parentElement.style.display = 'none'; // Hide the parent container
        }

        this.toggleFeatures(); // Apply feature visibility based on settings
    }

    createPicker(element) {
        const container = document.createElement('div');
        container.classList.add('datetime-container');
        container.style.display = 'none';

        container.innerHTML = `
        <div class="datetime-picker border rounded shadow p-3 bg-white" role="dialog" aria-hidden="true">
            ${this.getControlsHTML()}
            ${this.getDOWHTML()}
            ${this.getCalendarHTML()}
            ${this.getSelectedTimeHTML()}
            ${this.getSlidersHTML()}
            ${this.getTogglesHTML()}
            ${this.getFooterHTML()}
        </div>
    `;

        // Insert the container after the element
        if (element.parentNode) {
            element.parentNode.insertBefore(container, element.nextSibling);
        }

        // Cache the container's elements
        this.cacheElements(container);
    }

    getControlsHTML() {
        return `
    <div class="calendar-controls mb-3 d-flex align-items-center justify-content-between">
        <button type="button" class="btn btn-primary me-2" id="prev-month" aria-label="Previous Month">
            <span>&lt;</span>
        </button>
        <div class="input-group">
            <select id="monthSelect" class="form-select pe-4" aria-label="Select Month"></select>
            <select id="yearSelect" class="form-select" aria-label="Select Year"></select>
        </div>
        <button type="button" class="btn btn-primary ms-2" id="next-month" aria-label="Next Month">
            <span>&gt;</span>
        </button>
    </div>
    `;
    }

    getDOWHTML() {
        const dowDiv = document.createElement('div');
        dowDiv.id = 'days-of-week';

        // Get localized days of the week
        const formatter = new Intl.DateTimeFormat(this.settings.language, { weekday: 'short' });
        const daysOfWeek = Array.from({ length: 7 }, (_, i) =>
            formatter.format(new Date(2023, 0, i + 1)) // Fixed week for consistency
        );

        // Populate the div with the days of the week
        for (const day of daysOfWeek) {
            const dowCell = document.createElement('div');
            dowCell.textContent = day;
            dowCell.classList.add('dow-cell'); // Optional styling class
            dowDiv.appendChild(dowCell);
        }

        return dowDiv.outerHTML;
    }

// Update the populateYearDropdown method to implement lazy loading with a 20-year range
    populateYearDropdown() {
        const currentYear = this.selectedDate.getFullYear();
        const range = 20; // Show 20 years at a time

        // Set the range around the current year
        this.startYear = currentYear - Math.floor(range / 2);
        this.endYear = currentYear + Math.floor(range / 2);

        // Populate the dropdown with the initial range
        this.loadYearRange();

        // Add event listener for changes in the year selection
        this.yearSelect.addEventListener('change', (e) => this.handleYearSelection(e));
    }

// Function to load the year range into the select box
    loadYearRange() {
        const options = [];
        for (let year = this.startYear; year <= this.endYear; year++) {
            options.push(`<option value="${year}">${year}</option>`);
        }
        this.yearSelect.innerHTML = options.join('');
        this.yearSelect.value = this.selectedDate.getFullYear(); // Set the current year as selected
    }

// Handle the year selection event to load more years if needed
    handleYearSelection(event) {
        const selectedYear = parseInt(event.target.value);

        // Check if the selected year is the first or last in the current range
        if (selectedYear === this.startYear) {
            this.loadMoreYears('backward');
        } else if (selectedYear === this.endYear) {
            this.loadMoreYears('forward');
        }
    }

// Load more years dynamically based on the selected boundary
    loadMoreYears(direction) {
        const range = 20; // Range of 20 years
        if (direction === 'forward') {
            this.startYear = this.endYear;
            this.endYear = this.startYear + range;
        } else if (direction === 'backward') {
            this.endYear = this.startYear;
            this.startYear = this.endYear - range;
        }

        // Reload the year range with the new boundaries
        this.loadYearRange();
    }

    getCalendarHTML() {
        return `<div id="calendar" class="calendar mb-3" role="grid" aria-label="Calendar"></div>`;
    }

    getSelectedTimeHTML() {
        return  this.settings.showSelectedDatetime
            ? `<div class="d-flex flex-row justify-content-between mb-1">
                <label for="selected-datetime">Day and Time:</label>
                <input id="selected-datetime" class="text-end" aria-live="polite" aria-readonly="true" readonly disabled aria-disabled="true">
            </div>`
            : '';
    }

    getSlidersHTML() {
        const sliders = this.settings.slidersToShow.map(slider => {
            switch (slider) {
                case 'hours':
                    return this.getSliderHTML('hours', 'Hours', 0, 23);
                case 'minutes':
                    return this.getSliderHTML('minutes', 'Minutes', 0, 59);
                case 'seconds':
                    return this.getSliderHTML('seconds', 'Seconds', 0, 59);
                case 'nanoseconds':
                    return this.getSliderHTML('nanoseconds', 'Nanoseconds', 0, 999999999);
                default:
                    return '';
            }
        }).join('');

        return `<div class="slider-container mb-3">${sliders}</div>`;
    }

    getSliderHTML(id, label, min, max) {
        return `
                <div class="d-flex flex-row align-items-center">
                        <label for="${id}" class="form-label me-2">${label}:</label>
                        <input type="range" id="${id}" value="0" min="${min}" max="${max}" step="1" class="form-range w-50 ms-auto" aria-label="${label}">
                </div>
            `;
    }

    getTogglesHTML() {
        return `
                <div class="toggle-container justify-content-between w-100">
                    <div class="form-check form-switch">
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
        if (!this.settings.showFooter) {
            return ''; // Return nothing if footer is disabled
        }

        const nowButtonHTML = this.settings.showNowButton
            ? `<button type="button" class="btn btn-secondary" id="now-button" aria-label="Set to Now">Now</button>`
            : '';

        const closeButtonHTML = this.settings.showCloseButton
            ? `<button type="button" class="btn btn-primary" id="close-button" aria-label="Close">Close</button>`
            : '';

        return `
        <div class="d-flex justify-content-between align-items-center">
            ${nowButtonHTML}
            ${closeButtonHTML}
        </div>
    `;
    }

    cacheElements(container) {
        this.container = container;
        this.datetimePicker = container.querySelector('.datetime-picker');
        this.monthSelect = container.querySelector('#monthSelect');
        this.yearSelect = container.querySelector('#yearSelect');
        this.calendar = container.querySelector('#calendar');

        // Only cache the sliders if they exist
        this.hoursSlider = this.settings.slidersToShow.includes('hours') ? container.querySelector('#hours') : null;
        this.minutesSlider = this.settings.slidersToShow.includes('minutes') ? container.querySelector('#minutes') : null;
        this.secondsSlider = this.settings.slidersToShow.includes('seconds') ? container.querySelector('#seconds') : null;
        this.nanosecondsSlider = this.settings.slidersToShow.includes('nanoseconds') ? container.querySelector('#nanoseconds') : null;

        this.utcToggle = container.querySelector('#utc-toggle');
        this.dowDiv = container.querySelector('#days-of-week');
        this.doyToggle = container.querySelector('#doy-toggle');
        this.selectedDatetime = this.settings.showSelectedDatetime ? container.querySelector('#selected-datetime') : null;
        this.closeBtn = this.settings.showCloseButton ? container.querySelector('#close-button') : null;
    }

    bindEvents(element) {
        if (element) {
            element.addEventListener('click', (e) => this.togglePicker(e));
        }

        this.monthSelect.addEventListener('change', () => this.updateCalendarDate());
        this.yearSelect.addEventListener('change', () => this.updateCalendarDate());
        this.yearSelect.addEventListener('input', (e) => this.handleYearInputChange(e)); // Handle year input changes

        // Month navigation
        const prevMonthButton = this.container.querySelector('#prev-month');
        const nextMonthButton = this.container.querySelector('#next-month');

        prevMonthButton.addEventListener('click', () => this.changeMonth(-1));
        nextMonthButton.addEventListener('click', () => this.changeMonth(1));

        // Only add event listeners to sliders that exist
        if (this.hoursSlider) {
            this.hoursSlider.addEventListener('input', () => this.updateSelectedDatetime());
        }
        if (this.minutesSlider) {
            this.minutesSlider.addEventListener('input', () => this.updateSelectedDatetime());
        }
        if (this.secondsSlider) {
            this.secondsSlider.addEventListener('input', () => this.updateSelectedDatetime());
        }
        if (this.nanosecondsSlider) {
            this.nanosecondsSlider.addEventListener('input', () => this.updateSelectedDatetime());
        }

        this.utcToggle.addEventListener('change', () => this.updateSelectedDatetime());
        this.doyToggle.addEventListener('change', () => this.renderCalendar());

        this.calendar.addEventListener('click', (e) => this.handleDateSelection(e));
        this.calendar.addEventListener('keydown', (e) => {
            // Check if the pressed key is either spacebar or enter
            if (e.key === ' ' || e.key === 'Enter') {
                this.handleDateSelection(e);
            }
        });
        this.doyToggle.addEventListener('change', () => this.renderCalendar());

        // Add event listener for "Now" button
        if (this.settings.showNowButton) {
            const nowButton = this.container.querySelector('#now-button');
            nowButton.addEventListener('click', () => this.setToNow());
        }

        // Add event listener for "Close" button
        if (this.settings.showCloseButton) {
            this.closeBtn.addEventListener('click', (e) => this.togglePicker(e));
        }
    }

    setToNow() {
        const now = new Date(); // Get the current date and time

        // Update the date
        this.selectedDate.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

        // Conditionally update the time sliders based on the global setting
        if (this.settings.setNowIncludesTime) {
            this.selectedDate.setHours(now.getHours());
            this.selectedDate.setMinutes(now.getMinutes());
            this.selectedDate.setSeconds(now.getSeconds());
            this.selectedDate.setMilliseconds(now.getMilliseconds());

            // Update the sliders to match the time
            this.hoursSlider.value = now.getHours();
            this.minutesSlider.value = now.getMinutes();
            this.secondsSlider.value = now.getSeconds();
            this.nanosecondsSlider.value = now.getMilliseconds() * 1e6; // Convert ms to nanoseconds
        }

        // Update dropdowns for month and year
        this.monthSelect.value = now.getMonth();
        this.yearSelect.value = now.getFullYear();

        this.renderCalendar(); // Re-render the calendar with the new date
        this.populateYearDropdown(); // Re-populate the year dropdown
        this.updateSelectedDatetime(); // Update the displayed date and time
    }

    changeMonth(delta) {
        const currentMonth = this.selectedDate.getMonth();
        this.selectedDate.setMonth(currentMonth + delta);

        // Sync dropdowns with the updated selectedDate
        this.monthSelect.value = this.selectedDate.getMonth();
        this.yearSelect.value = this.selectedDate.getFullYear();

        this.renderCalendar(); // Re-render the calendar
        this.updateSelectedDatetime(); // Update the datetime display
    }

    handleYearInputChange(event) {
        const year = parseInt(event.target.value, 10);
        if (!isNaN(year)) {
            this.selectedDate.setFullYear(year);

            // Sync dropdowns with the updated selectedDate
            this.monthSelect.value = this.selectedDate.getMonth();
            this.yearSelect.value = this.selectedDate.getFullYear();

            this.renderCalendar(); // Re-render the calendar
            this.updateSelectedDatetime(); // Update the datetime display
        }
    }

    togglePicker(event) {
        event.stopPropagation();

    // this is for "hide on click-out of box" || this.container.contains(event.target)
        if (this.settings.mode === 'inline') {
            return; // Inline mode does not toggle visibility
        }

        const isVisible = this.datetimePicker.style.display === 'block';
        if (!isVisible) {
            this.positionPicker(event.target); // Dynamically position the picker
            this.datetimePicker.style.display = 'block';
            this.datetimePicker.parentElement.style.display = 'block';
            this.datetimePicker.setAttribute('aria-hidden', 'false'); // For accessibility
        } else {
            this.datetimePicker.style.display = 'none';
            this.datetimePicker.parentElement.style.display = 'none';
            this.datetimePicker.setAttribute('aria-hidden', 'true');
        }
    }

    positionPicker(trigger) {
        // Ensure the trigger's parent container is positioned relatively
        const parent = trigger.offsetParent;
        if (!parent.style.position || parent.style.position === 'static') {
            parent.style.position = 'relative';
        }

        // Apply the calculated position
        this.datetimePicker.style.position = 'absolute';
        this.datetimePicker.style.zIndex = '1000'; // Ensure it appears above other elements
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

    getMonthNames() {
        return Array.from({length: 12}, (_, i) =>
            new Date(2023, i).toLocaleString(this.settings.language, {month: 'long'})
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
        cell.tabIndex = 0;

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

        if (this.hoursSlider) {
            date.setHours(this.hoursSlider.value);
        }
        if (this.minutesSlider) {
            date.setMinutes(this.minutesSlider.value);
        }
        if (this.secondsSlider) {
            date.setSeconds(this.secondsSlider.value);
        }
        if (this.nanosecondsSlider) {
            date.setMilliseconds(this.nanosecondsSlider.value / 1e6); // Convert nanoseconds to milliseconds
        }

        const datetimeString = this.utcToggle.checked
            ? date.toISOString()
            : date.toLocaleString(this.settings.language);

        // Update the displayed selected datetime
        if (this.settings.showSelectedDatetime) {
            this.selectedDatetime.value = datetimeString;
        }

        // Update the input box if mode is 'input'
        if (this.settings.mode === 'input') {
            this.container.value = datetimeString;
        }

        if (this.settings.onTimeChange) {
            this.settings.onTimeChange(date);
        }
    }

    toggleFeatures() {
        if (!this.settings.showCalendar) this.calendar.style.display = 'none';
        if (!this.settings.showDaysOfWeek) this.dowDiv.style.display = 'none';
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

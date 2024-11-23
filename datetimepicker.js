(function (global) {
    const defaultSettings = {
        language: 'en-US',
        showCalendar: true,
        showSliders: true,
        showUTC: true,
        showDOYtoggle: false,
        mode: 'inline', // Options: 'inline', 'input', 'button'
        useBootstrap: false, // Option to use Bootstrap 5 styling
    };

    function DateTimePicker(element, options) {
        this.settings = { ...defaultSettings, ...options };
        this.selectedDate = new Date();
        this.today = new Date();
        this.container = null;
        this.init(element);
    }

    DateTimePicker.prototype.init = function (element) {
        this.createPicker(element);
        this.populateMonthYearDropdowns();
        this.generateCalendar(this.selectedDate);
        this.bindEvents(element);

        if (this.settings.mode !== 'inline') {
            this.datetimePicker.style.display = 'none';
        }

        if (!this.settings.showCalendar) this.calendar.style.display = 'none';
        if (!this.settings.showSliders) this.sliderContainer.style.display = 'none';
        if (!this.settings.showUTC) this.utcToggle.parentElement.style.display = 'none';
        if (!this.settings.showDOYtoggle) this.doyToggleContainer.style.display = 'none';
    };

    DateTimePicker.prototype.createPicker = function (element) {
        const container = document.createElement('div');
        container.classList.add('datetime-container', 'position-relative');

        let triggerHTML = '';
        if (this.settings.mode === 'input') {
            triggerHTML = `
        <input type="text" class="form-control datetime-input" readonly placeholder="Select Date and Time">
      `;
        } else if (this.settings.mode === 'button') {
            triggerHTML = `
        <button class="btn btn-primary datetime-button">Pick Date and Time</button>
      `;
        }

        container.innerHTML = `
      ${triggerHTML || ''}
      <div class="datetime-picker border rounded shadow p-3 bg-white">
        <div class="calendar-controls mb-3">
          <select id="monthSelect" class="form-select d-inline w-auto"></select>
          <select id="yearSelect" class="form-select d-inline w-auto ms-2"></select>
        </div>
        <div id="calendar" class="calendar mb-3"></div>

        <div id="time-display" class="time-display mb-3">Time: 00:00:00.000000000</div>

        <div class="slider-container mb-3">
          <div class="d-flex flex-column">
            <label>Hours:</label>
            <input type="range" id="hours" min="0" max="23" step="1" class="form-range">
            <label>Minutes:</label>
            <input type="range" id="minutes" min="0" max="59" step="1" class="form-range">
            <label>Seconds:</label>
            <input type="range" id="seconds" min="0" max="59" step="1" class="form-range">
            <label>Nanoseconds:</label>
            <input type="range" id="nanoseconds" min="0" max="999999999" step="1" class="form-range">
          </div>
        </div>

        <div class="utc-toggle mb-3">
          <input type="checkbox" id="utc-toggle" class="form-check-input">
          <label for="utc-toggle" class="form-check-label">UTC</label>
        </div>

        <div class="doy-toggle mb-3">
          <input type="checkbox" id="doy-toggle" class="form-check-input">
          <label for="doy-toggle" class="form-check-label">Show Day of Year</label>
        </div>

        <div>
          <label>Selected Date and Time:</label>
          <div id="selected-datetime"></div>
        </div>
      </div>
    `;

        element.appendChild(container);
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
        this.timeDisplay = container.querySelector('#time-display');
        this.sliderContainer = container.querySelector('.slider-container');
        this.selectedDatetime = container.querySelector('#selected-datetime');
        this.doyToggleContainer = container.querySelector('.doy-toggle');
    };

    DateTimePicker.prototype.bindEvents = function (element) {
        if (this.settings.mode !== 'inline') {
            const triggerElement = this.inputDatetime || this.buttonDatetime;

            triggerElement.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = this.datetimePicker.style.display === 'block';
                this.datetimePicker.style.display = isVisible ? 'none' : 'block';
            });

            document.addEventListener('click', (e) => {
                if (!this.container.contains(e.target)) {
                    this.datetimePicker.style.display = 'none';
                }
            });
        }

        this.hoursSlider.addEventListener('input', () => this.updateSelectedDatetime());
        this.minutesSlider.addEventListener('input', () => this.updateSelectedDatetime());
        this.secondsSlider.addEventListener('input', () => this.updateSelectedDatetime());
        this.nanosecondsSlider.addEventListener('input', () => this.updateSelectedDatetime());

        this.utcToggle.addEventListener('change', () => this.updateSelectedDatetime());

        this.doyToggleContainer.querySelector('#doy-toggle').addEventListener('change', () => {
            this.generateCalendar(this.selectedDate);
        });

        this.monthSelect.addEventListener('change', () => this.changeCalendarDate());
        this.yearSelect.addEventListener('change', () => this.changeCalendarDate());
    };

    DateTimePicker.prototype.populateMonthYearDropdowns = function () {
        const monthNames = this.getMonthNames();

        this.monthSelect.innerHTML = '';
        monthNames.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = month;
            this.monthSelect.appendChild(option);
        });
        this.monthSelect.value = this.today.getMonth();

        this.yearSelect.innerHTML = '';
        for (let year = this.today.getFullYear() - 50; year <= this.today.getFullYear() + 50; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            this.yearSelect.appendChild(option);
        }
        this.yearSelect.value = this.today.getFullYear();
    };

    DateTimePicker.prototype.getMonthNames = function () {
        const months = [];
        for (let i = 0; i < 12; i++) {
            const date = new Date(2023, i, 1);
            months.push(date.toLocaleString(this.settings.language, { month: 'long' }));
        }
        return months;
    };

    DateTimePicker.prototype.generateCalendar = function (date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        this.calendar.innerHTML = '';

        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            this.calendar.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            const currentDate = new Date(year, month, day);
            dayCell.textContent = this.settings.showDOYtoggle
                ? this.getDayOfYear(currentDate)
                : day;
            dayCell.dataset.date = currentDate.toISOString().slice(0, 10);
            dayCell.addEventListener('click', () => this.selectDate(currentDate));

            if (
                day === this.selectedDate.getDate() &&
                month === this.selectedDate.getMonth() &&
                year === this.selectedDate.getFullYear()
            ) {
                dayCell.classList.add('selected');
            }

            this.calendar.appendChild(dayCell);
        }
    };

    DateTimePicker.prototype.getDayOfYear = function (date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    };

    DateTimePicker.prototype.selectDate = function (date) {
        this.selectedDate = date;
        this.generateCalendar(date);
        this.updateSelectedDatetime();
    };

    DateTimePicker.prototype.changeCalendarDate = function () {
        const month = parseInt(this.monthSelect.value, 10);
        const year = parseInt(this.yearSelect.value, 10);
        this.selectedDate.setMonth(month);
        this.selectedDate.setFullYear(year);
        this.generateCalendar(this.selectedDate);
        this.updateSelectedDatetime();
    };

    DateTimePicker.prototype.updateSelectedDatetime = function () {
        const date = new Date(this.selectedDate);
        date.setHours(this.hoursSlider.value);
        date.setMinutes(this.minutesSlider.value);
        date.setSeconds(this.secondsSlider.value);
        date.setMilliseconds(this.nanosecondsSlider.value / 1e6);

        if (this.utcToggle.checked) {
            this.timeDisplay.textContent = `Time (UTC): ${date.toISOString()}`;
        } else {
            const localeString = date.toLocaleString(this.settings.language, {
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });
            this.timeDisplay.textContent = `Time: ${localeString}`;
        }

        this.selectedDatetime.textContent = date.toISOString();
    };

    global.DateTimePicker = {
        init: (element, options) => new DateTimePicker(element, options),
    };
})(window);

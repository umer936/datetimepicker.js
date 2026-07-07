# DateTimePicker

A flexible and customizable JavaScript DateTime picker that supports inline, input, and button-based modes. The picker includes options for displaying a calendar, time sliders, UTC/local time toggling, and Day of Year (DOY) support.

(I ChatGPT-ed my way through making this library, so improvements are welcome - umer936)

**TRY ME: https://umer936.github.io/datetimepicker.js/**

## Quick Start

Copy/paste this and you are done:

```html
<!-- 1) Optional Bootstrap -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/css/bootstrap.min.css">

<!-- 2) DateTimePicker CSS/JS (latest published npm release) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/datetimepicker.js@latest/dist/datetimepicker.min.css">
<script src="https://cdn.jsdelivr.net/npm/datetimepicker.js@latest/dist/datetimepicker.min.js"></script>

<!-- 3) Target element -->
<input id="demo-picker" class="form-control" placeholder="Pick a date/time">

<!-- 4) Initialize -->
<script>
  new DateTimePicker(document.getElementById('demo-picker'), {
    mode: 'input',
    useBootstrap: true,
    showUtcToggle: true
  });
</script>
```

For production stability, replace `@latest` with a pinned version (example: `@1.2.0`).

### Quick Start (npm / Bundler)

Use this if your app is built with Vite, Webpack, Parcel, etc.:

```powershell
npm install datetimepicker.js
```

```javascript
import 'datetimepicker.js/dist/datetimepicker.min.css';
import DateTimePicker from 'datetimepicker.js/dist/datetimepicker.min.js';

const el = document.getElementById('demo-picker');
new DateTimePicker(el, {
  mode: 'input',
  useBootstrap: true,
  showUtcToggle: true
});
```

If your bundler does not support default import from the minified file, include via a script tag (CDN quick start above) or load the file as a side-effect and use the global `DateTimePicker`.

## Features

- **Inline, input, or button-based modes** to suit your needs.
- **Day of Year (DOY)** toggle for showing the day of the year instead of the date.
- **Time Sliders** for setting hours, minutes, seconds, and nanoseconds.
- **Optional slider value labels** when you want the numeric value shown next to each slider.
- **UTC/local time** toggle to switch between UTC and local time formats.
- **Bootstrap 5 styling** support for easy integration with Bootstrap-based UIs.
- **Multi-language support** based on JavaScript's `Intl` object.
## Inspiration

This DateTimePicker library is inspired by many JS libraries that have come before, including:

- **[Trent Richardson's Timepicker](https://trentrichardson.com/examples/timepicker/)**: jQuery UI timepicker with sliders
- **[Flatpickr](https://flatpickr.js.org/)**
- **[Ant Design (Antd)](https://ant.design/components/time-picker)**

## Installation

Use one of these:

- CDN: use the **Quick Start** snippet above.
- Bundler: use **Quick Start (npm / Bundler)** above.
- Local files: include `datetimepicker.js` and `datetimepicker.css` directly in your project.

### CDN Release Flow (Maintainer)

If you are publishing new versions of this library, use this flow:

> This repo's build workflow now auto-creates a GitHub tag/release as `v<package.json version>` on pushes to `main` (if that tag does not already exist).
>
> npm auto-publish is currently disabled in CI. If re-enabled later, configure repository secret `NPM_TOKEN` (npm automation token).

1. Build and tag a release:

```powershell
npm install
npm run build
git add dist datetimepicker.js datetimepicker.css README.md package.json
git commit -m "Release vX.Y.Z"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

2. (Recommended) publish to npm:

```powershell
npm login
npm publish --access public
```

3. CDN endpoints:
   - jsDelivr (GitHub tag):
     - `https://cdn.jsdelivr.net/gh/umer936/datetimepicker.js@vX.Y.Z/dist/datetimepicker.min.js`
     - `https://cdn.jsdelivr.net/gh/umer936/datetimepicker.js@vX.Y.Z/dist/datetimepicker.min.css`
   - jsDelivr (npm):
     - `https://cdn.jsdelivr.net/npm/datetimepicker.js@X.Y.Z/dist/datetimepicker.min.js`
     - `https://cdn.jsdelivr.net/npm/datetimepicker.js@X.Y.Z/dist/datetimepicker.min.css`
   - cdnjs: submit package metadata to `cdnjs/packages` once; future npm releases can auto-sync.

## Usage

### Initialize Inline Picker
This mode shows the picker inline on the page.

```html
<div id="inline-picker"></div>

<script>
  new DateTimePicker(document.getElementById('inline-picker'), {
    mode: 'inline',
    useBootstrap: true,  // Use Bootstrap 5 styles
    showCalendar: true,  // Show calendar
    showSliders: true,   // Show time sliders
    showUtcToggle: true, // Show UTC toggle
    language: 'en-US'    // Language setting
  });
</script>
```

### Initialize Input Picker
This mode shows the picker when you click on the input field.

```html
<input type="text" id="input-picker" class="form-control" readonly>

<script>
  new DateTimePicker(document.getElementById('input-picker'), {
    mode: 'input',
    useBootstrap: true,
    sliders: ['hours', 'minutes', 'seconds'],
    showSliderValues: false
  });
</script>
```

### Parse incoming values as UTC (without requiring `Z`)

If your API sends values like `2026-07-07T12:30:00` and you want those treated as UTC by default, set `inputTimeZone: 'utc'`.

```javascript
new DateTimePicker(document.getElementById('input-picker'), {
  mode: 'input',
  inputTimeZone: 'utc',
  initialValue: '2026-07-07T12:30:00'
});
```

Strings that already include a timezone (for example `Z` or `+02:00`) still use that explicit timezone.

### Initialize all `.datepick` inputs explicitly

If you want the helper to wire up every `.datepick` element on the page, call it explicitly where you need it:

```html
<input id="startTime" class="datepick">
<input id="stopTime" class="datepick">

<script>
  window.initDateTimePickers({
    mode: 'input',
    sliders: ['hours', 'minutes', 'seconds'],
    showUtcToggle: false,
    showSelectedDatetime: false,
    showSliderValues: false
  });
</script>
```

### Style via initializer (`themeVariables`)

You can override CSS custom properties per picker instance without forking the stylesheet:

```javascript
new DateTimePicker(document.getElementById('demo-picker'), {
  mode: 'input',
  themeVariables: {
    '--dtp-width': '285px',
    '--dtp-dow-bg-color': '#000000',
    '--dtp-dow-text-color': '#ffffff',
    '--dtp-nav-btn-radius': '999px',
    '--dtp-nav-btn-min-width': '28px',
    '--dtp-nav-btn-min-height': '28px'
  }
});
```

The `theme` object also supports slider-specific fields such as `sliderTrackColor` and `sliderThumbColor`.

### Theme Resolution Order (important)

The picker now resolves styling in this order (lowest to highest priority):

1. Base CSS variables from `datetimepicker.css`
2. Preset class from `themeClass` (if provided)
3. If no `themeClass` is provided and `useBootstrap: true`, automatic `dtp-theme-bootstrap` preset is used
4. `theme` object keys (mapped to picker CSS variables)
5. `themeVariables` raw CSS custom properties (`--dtp-*`) as final overrides

This means `themeVariables` always wins when keys overlap.

### Bootstrap Dark Mode

For Bootstrap users, dark mode works when:

- Bootstrap CSS is loaded,
- `useBootstrap: true` is set,
- and your page (or ancestor) sets `data-bs-theme="dark"`.

Example:

```html
<html data-bs-theme="dark">
  <!-- ... -->
</html>
```

```javascript
new DateTimePicker(document.getElementById('demo-picker'), {
  mode: 'input',
  useBootstrap: true
});
```

If you also pass a `theme` object, only the keys you provide override Bootstrap variables.

### Initialize Button Picker
This mode shows the picker when you click a button.

```html
<button id="button-picker" class="btn btn-primary">Pick Date and Time</button>

<script>
  new DateTimePicker(document.getElementById('button-picker'), {
    mode: 'button',
    useBootstrap: true
  });
</script>
```

## Options

| Option                 | Type                     | Default               | Description                                                                       |
|------------------------|--------------------------|-----------------------|-----------------------------------------------------------------------------------|
| `language`             | `string`                 | `'en-US'`             | Locale used by `Intl` formatting.                                                 |
| `firstDayOfWeek`       | `number`                 | `0`                   | Week start day (`0` Sunday ... `6` Saturday).                                     |
| `monthLabelFormat`     | `string`                 | `'long'`              | Month labels: `'long'`, `'short'`, `'narrow'`.                                    |
| `weekdayLabelFormat`   | `string`                 | `'short'`             | Weekday labels: `'long'`, `'short'`, `'narrow'`.                                  |
| `dateTimeFormat`       | `object \| null`         | `null`                | Optional `Intl.DateTimeFormat` options for local datetime output.                 |
| `inputTimeZone`        | `'local' \| 'utc'`       | `'local'`             | How naive incoming strings are parsed (`'local'` or `'utc'`).                     |
| `showCalendar`         | `boolean`                | `true`                | Show/hide the calendar grid.                                                      |
| `showDaysOfWeek`       | `boolean`                | `true`                | Show/hide weekday headers.                                                        |
| `showSliders`          | `boolean`                | `true`                | Show/hide time sliders.                                                           |
| `showSliderValues`     | `boolean`                | `false`               | Show/hide the numeric value next to each slider.                                  |
| `showUtcToggle`        | `boolean`                | `true`                | Show/hide UTC toggle.                                                             |
| `showDoyToggle`        | `boolean`                | `false`               | Show/hide day-of-year toggle.                                                     |
| `showSelectedDatetime` | `boolean`                | `true`                | Show/hide readonly datetime display input.                                        |
| `showNowButton`        | `boolean`                | `true`                | Show/hide the "Now" button.                                                       |
| `showCloseButton`      | `boolean`                | `true`                | Show/hide the "Close" button.                                                     |
| `sliders`              | `string[]`               | `['hours','minutes']` | Slider list from: `hours`, `minutes`, `seconds`, `nanoseconds`.                   |
| `nowSetsTime`          | `boolean`                | `false`               | If true, "Now" sets date + time; otherwise date only.                             |
| `datetimeLabel`        | `string \| undefined`    | `undefined`           | Label beside the selected datetime field.                                         |
| `minDate`              | `Date \| string \| null` | `null`                | Minimum selectable date (inclusive).                                              |
| `maxDate`              | `Date \| string \| null` | `null`                | Maximum selectable date (inclusive).                                              |
| `disabledWeekdays`     | `number[]`               | `[]`                  | Weekday indexes to lock (`0..6`).                                                 |
| `disabledDates`        | `Array<Date\|string>`    | `[]`                  | Specific locked dates.                                                            |
| `markers`              | `Array<object>`          | `[]`                  | Per-day marker objects (`date`, `label`, `tooltip`, `color`, `className`).        |
| `showMarkerLegend`     | `boolean`                | `false`               | Show a marker legend in the footer when labeled markers exist.                    |
| `markerLegendMaxItems` | `number`                 | `6`                   | Maximum marker legend items before showing `+N`.                                  |
| `labels`               | `object`                 | Locale-aware defaults | Override button/ARIA/toggle labels for localization.                              |
| `mode`                 | `string`                 | `'inline'`            | Picker mode: `'inline'`, `'input'`, `'button'`.                                   |
| `useBootstrap`         | `boolean`                | `false`               | Enable Bootstrap style classes.                                                   |
| `themeClass`           | `string \| string[]`     | `''`                  | Optional CSS preset class(es), e.g. `dtp-theme-bootstrap`, `dtp-theme-dark`.      |
| `theme`                | `object \| null`         | `null`                | Mapped theme overrides (friendly keys like `primaryColor`, `dowBackgroundColor`). |
| `themeVariables`       | `object \| null`         | `null`                | Raw CSS variable overrides (`--dtp-*`), applied last and highest priority.        |
| `onSelect`             | `function \| null`       | `null`                | Called with selected `Date` when a day is picked.                                 |
| `onChange`             | `function \| null`       | `null`                | Called with current `Date` when date/time changes.                                |
| `onInvalidSelect`      | `function \| null`       | `null`                | Called with `{ date, reason, cell }` when a locked date is clicked.               |

## Example

```html
<div id="my-datetime-picker"></div>

<script>
  new DateTimePicker(document.getElementById('my-datetime-picker'), {
    mode: 'inline',
    showUtcToggle: true,
    showDoyToggle: true,
    language: 'en-US',
    monthLabelFormat: 'short',
    weekdayLabelFormat: 'narrow',
    disabledWeekdays: [0, 6],
    disabledDates: ['2026-12-24', '2026-12-25'],
    markers: [
      { date: '2026-12-25', label: 'Holiday', color: '#d32f2f', tooltip: 'Christmas Day' },
      { date: '2026-12-31', label: 'Release', color: '#0d6efd' }
    ],
    showMarkerLegend: true,
    markerLegendMaxItems: 4,
    labels: {
      now: 'Now',
      close: 'Close',
      dayOfMonthDayOfYear: 'Day / Year Day'
    },
    dateTimeFormat: { dateStyle: 'short', timeStyle: 'short' },
    onInvalidSelect: ({ date, reason }) => {
      console.warn('Blocked date', date, reason);
    },
    useBootstrap: true,
  });
</script>
```

### Available Methods

- Instantiate directly: **`new DateTimePicker(element, options)`**.

### Styles and Layout

By default, the DateTimePicker is styled using basic CSS. However, if you want it to match the Bootstrap 5 design language, simply pass the `useBootstrap: true` option when initializing the picker.

If you prefer to style the picker yourself, you can override the CSS styles in your own stylesheets.

## Customization

You can customize the appearance and behavior of the DateTimePicker by modifying the following elements:

- **Calendar**: Displays a month view where you can select a day.
- **Time Sliders**: Allow users to pick hours, minutes, seconds, and nanoseconds.
- **UTC Toggle**: Switch between UTC and local time.
- **Day of Year (DOY)**: Optionally display the day of the year.
- **Week start day**: Set start day of the week (Sunday, Monday, etc.).
- **Lockout rules**: Use `minDate`, `maxDate`, `disabledWeekdays`, and `disabledDates`.
- **Date markers**: Annotate specific days using `markers`.
- **Localized labels**: Override built-in UI strings through `labels`.

## Contribution

We welcome contributions to improve this library! Please feel free to fork the repository and submit pull requests.

## Potential Improvements

- Theming options outside of none and Bootstrap (e.g. Tailwind?)
- Improve error handling
- TypeScript support
- Range-picker: Either
  - 2 pickers where picking one sets the lockout for the other
  - or 1 picker where you can select a date range
    - callbacks for onRangeStart/onRangeEnd
- Improve usage in just DatePicker cases 
- Improve keyboard navigation
  - Have Calendar movable by arrow keys rather than tab
- Validation and/or error feedback
- Mobile friendliness
- Animations
- Slider improvements 
  - Should they go above the sliders?
  - Can they be inlined to save space?
- Add to CDN
  - cdnjs, jsDelivr, etc.
- Unit tests or any kind of testing

### Bugs and Issues

- Nanoseconds doesn't change using arrow-keys... Maybe because too high resolution?

If you encounter any issues, please report them via GitHub Issues.

## License

This library is open-source and licensed under the [MIT License](LICENSE).

---

# DateTimePicker

A flexible and customizable JavaScript DateTime picker that supports inline, input, and button-based modes. The picker includes options for displaying a calendar, time sliders, UTC/local time toggling, and Day of Year (DOY) support.

(I ChatGPT-ed my way through making this library, so improvements are welcome - umer936)

## Features

- **Inline, input, or button-based modes** to suit your needs.
- **Day of Year (DOY)** toggle for showing the day of the year instead of the date.
- **Time Sliders** for setting hours, minutes, seconds, and nanoseconds.
- **UTC/local time** toggle to switch between UTC and local time formats.
- **Bootstrap 5 styling** support for easy integration with Bootstrap-based UIs.
- **Multi-language support** based on JavaScript's `Intl` object.
## Inspiration

This DateTimePicker library is inspired by many JS libraries that have come before, including:

- **[Trent Richardson's Timepicker](https://trentrichardson.com/examples/timepicker/)**: jQuery UI timepicker with sliders
- **[Flatpickr](https://flatpickr.js.org/)**
- **[Ant Design (Antd)](https://ant.design/components/time-picker)**

## Installation

To use this library, you can either include it via a `<script>` tag or bundle it with your JavaScript project. 

1. **Include via CDN (for quick use)**:

   Add the following to your HTML `<head>`:

   ```html
   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/css/bootstrap.min.css" integrity="sha512-jnSuA4Ss2PkkikSOLtYs8BlYIeeIK1h99ty4YfvRPAlzr377vr3CXDb7sb7eEEBYjDtcYj+AjBH3FLv5uSJuXg==" crossorigin="anonymous" referrerpolicy="no-referrer" /><!-- Optional-->
   <link rel="stylesheet" href="path/to/datetimepicker.css"> <!-- Replace with path -->
   <script src="path/to/datetimepicker.js"></script> <!-- Replace with path -->
   ```

2. **Local Installation**:

    - Download the JavaScript and CSS files (`datetimepicker.js` and `datetimepicker.css`) and include them in your project.
    - Alternatively, use a build system to bundle them.

## Usage

### Initialize Inline Picker
This mode shows the picker inline on the page.

```html
<div id="inline-picker"></div>

<script>
  DateTimePicker.init(document.getElementById('inline-picker'), {
    mode: 'inline',
    useBootstrap: true,  // Use Bootstrap 5 styles
    showCalendar: true,  // Show calendar
    showSliders: true,   // Show time sliders
    showUTC: true,       // Show UTC toggle
    language: 'en-US'    // Language setting
  });
</script>
```

### Initialize Input Picker
This mode shows the picker when you click on the input field.

```html
<input type="text" id="input-picker" class="form-control" readonly>

<script>
  DateTimePicker.init(document.getElementById('input-picker'), {
    mode: 'input',
    useBootstrap: true
  });
</script>
```

### Initialize Button Picker
This mode shows the picker when you click a button.

```html
<button id="button-picker" class="btn btn-primary">Pick Date and Time</button>

<script>
  DateTimePicker.init(document.getElementById('button-picker'), {
    mode: 'button',
    useBootstrap: true
  });
</script>
```

## Options

| Option          | Type      | Default Value | Description                                                  |
|-----------------|-----------|---------------|--------------------------------------------------------------|
| `language`      | `string`  | `'en-US'`     | The language/locale to use for displaying the date.          |
| `showCalendar`  | `boolean` | `true`        | Whether to show the calendar interface.                      |
| `showSliders`   | `boolean` | `true`        | Whether to show sliders for time selection.                  |
| `showUTC`       | `boolean` | `true`        | Whether to show the UTC toggle.                              |
| `showDOYtoggle` | `boolean` | `false`       | Whether to show the Day of Year toggle.                      |
| `mode`          | `string`  | `'inline'`    | The picker mode. Options: `'inline'`, `'input'`, `'button'`. |
| `useBootstrap`  | `boolean` | `false`       | Whether to use Bootstrap 5 styles for UI elements.           |

## Example

```html
<div id="my-datetime-picker"></div>

<script>
  DateTimePicker.init(document.getElementById('my-datetime-picker'), {
    mode: 'inline',
    showCalendar: true,
    showSliders: true,
    showUTC: true,
    showDOYtoggle: true,
    language: 'en-US',
    useBootstrap: true
  });
</script>
```

### Available Methods

- **`init(element, options)`**: Initializes the DateTimePicker on a given element with the specified options.

### Styles and Layout

By default, the DateTimePicker is styled using basic CSS. However, if you want it to match the Bootstrap 5 design language, simply pass the `useBootstrap: true` option when initializing the picker.

If you prefer to style the picker yourself, you can override the CSS styles in your own stylesheets.

## Customization

You can customize the appearance and behavior of the DateTimePicker by modifying the following elements:

- **Calendar**: Displays a month view where you can select a day.
- **Time Sliders**: Allow users to pick hours, minutes, seconds, and nanoseconds.
- **UTC Toggle**: Switch between UTC and local time.
- **Day of Year (DOY)**: Optionally display the day of the year.

## Contribution

We welcome contributions to improve this library! Please feel free to fork the repository and submit pull requests.

### Bugs and Issues

If you encounter any issues, please report them via GitHub Issues.

## License

This library is open-source and licensed under the [MIT License](LICENSE).

---

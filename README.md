# Nuclei Scan Analytics - Timeline Visualization

A React-based web application that visualizes the lifespan of Nuclei scan events using interactive bar timeline charts.

## Overview

This application processes Nuclei scan event data from nuclei with `-tags=stats` and displays:

- **Bar Timeline Chart**: Shows the duration of each scan event
- **Top N Filtering**: View top 10, 25, 50, 100, or all scan events
- **Interactive Tooltips**: Hover over bars to see detailed scan information
- **Statistics Summary**: View total scans, average duration, longest and shortest scans

## How to build Nuclei w/ stats enabled

1. Clone nuclei
2. `make verify`
3. `make build-stats`

nuclei-stats is avaiable at `./bin/nuclei-stats`

## Data Format

The application expects event data in JSONL format with the following structure:

```json
{
  "target": "http://example.com",
  "template_type": "http",
  "template_id": "template-name",
  "template_path": "/path/to/template.yaml",
  "max_requests": 1,
  "time": "2025-08-14T06:44:19.45388724Z",
  "event_type": "scan_start"
}
```

Each scan should have matching `scan_start` and `scan_end` events with the same `template_id` and `target`.

## Features

### Timeline Visualization
- Horizontal bar chart showing scan durations
- Color-coded bars for easy identification
- Responsive design that works on all screen sizes

### Interactive Controls
- Dropdown to select number of scans to display (10, 25, 50, 100, or all)
- Hover tooltips showing detailed scan information
- Automatic sorting by duration (longest first)

### Statistics Dashboard
- Total number of completed scans
- Average scan duration
- Longest and shortest scan durations

## Technology Stack

- **React 19** with Vite for fast development and building
- **Recharts** for data visualization
- **Tailwind CSS** for styling and responsive design
- **PostCSS** for CSS processing

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- pnpm package manager

### Installation
1. Install dependencies:
   ```bash
   pnpm install
   ```

### Development
To start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

### Building for Production
```bash
pnpm build
```

The built files will be in the `dist` directory.

### Preview Production Build
```bash
pnpm preview
```

## Project Structure

```
flamegraph/
├── public/
│   ├── events.jsonl          # Scan event data
│   └── vite.svg
├── src/
│   ├── App.jsx              # Main application component
│   ├── App.css              # Global styles with Tailwind directives
│   ├── ScanTimelineChart.jsx # Timeline chart component
│   ├── main.jsx             # Application entry point
│   └── index.css            # Base styles
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── vite.config.js           # Vite configuration
└── package.json
```

## Customization

### Adding New Chart Types
The `ScanTimelineChart` component can be extended to support additional visualization types. Recharts provides various chart components that can be integrated.

### Styling
The application uses Tailwind CSS for styling. You can customize the theme by modifying `tailwind.config.js`.

### Data Processing
The data processing logic in `ScanTimelineChart.jsx` can be modified to handle different event formats or add additional metrics.

## License

This project is open source and available under the MIT License.

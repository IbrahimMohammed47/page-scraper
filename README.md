
# Page Scraper API

A lightweight Express API that scrapes basic page information (title, meta description, H1) from a given URL using Puppeteer in headless mode.

## Setup Instructions

### Prerequisites

- Node.js v18+ and npm installed on your machine.
- npm
- Internet connection (required for Puppeteer to navigate pages)

### Installation

1. **Clone the repository:**
   ```bash
   git clone git@github.com:IbrahimMohammed47/page-scraper.git
   ```
2. **Navigate to the project directory:**
   ```bash
   cd page-scraper
   ```
3. **Install dependencies and run server in dev mode:**
   ```bash
   npm i && npm run dev
   ```

## API Endpoints

### `GET /api/scrape?url=...`

- **Description:** Scrapes the given URL for page title, meta description, and the first <h1> element.
- **Query Parameters:**
  - `url` (string, required): The full URL of the page to scrape.
- **Example Usage:**
  ```
  curl "http://localhost:3001/api/scrape?url=https://example.com"
  ```

## Assumptions

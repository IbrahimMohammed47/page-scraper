import { Request, Response } from "express";
import puppeteer, { HTTPResponse, TimeoutError } from "puppeteer";
import { setTimeout } from "timers/promises";

const TIMEOUT_MS = 20000;
const RETRY_COUNT = 3;
type FoundPage = {
  title: string;
  metaDescription: string;
  h1: string;
};

type ScrapeResult =
  | {
      page: FoundPage;
      error: null;
    }
  | {
      page: null;
      error: "timeout" | "invalid-url" | "unknown";
    };

const isValidURL = (input: string): boolean => {
  try {
    if (typeof input !== "string") return false;
    new URL(input);
    return true;
  } catch {
    return false;
  }
};

const scrapePage = async (url: string): Promise<ScrapeResult> => {
  const isValidURLFormat = isValidURL(url);
  if (!isValidURLFormat) {
    return { page: null, error: "invalid-url" };
  }
  const trimmedUrl = url.trim();
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      platform: "Win32",
    });

    let response: HTTPResponse | null = null;
    for (let i = 0; i < RETRY_COUNT; i++) {
      try {
        response = await page.goto(trimmedUrl, {
          waitUntil: ["domcontentloaded", "networkidle2"],
          timeout: TIMEOUT_MS / RETRY_COUNT,
        });
        if (!response || !response?.ok()) {
          throw response?.statusText ?? "Navigation failed";
        }
        break;
      } catch (error) {
        if (i === RETRY_COUNT - 1) throw error;
        console.log(`Attempt ${i + 1} failed, retrying...`);
      }
    }

    if (!response) {
      return { page: null, error: "unknown" };
    }

    const data = await page.evaluate(() => {
      const title = document.title;
      const metaDescription =
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content") ?? "";
      const h1 = document.querySelector("h1")?.textContent ?? "";
      return { title, metaDescription, h1 };
    });

    return {
      page: data,
      error: null,
    };
  } catch (error) {
    if (error instanceof TimeoutError) {
      return { page: null, error: "timeout" };
    }
    return { page: null, error: "unknown" };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export const scrapeController = async (req: Request, res: Response) => {
  const url = req.query?.url as string;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const result = await Promise.race([
    scrapePage(url),
    setTimeout(TIMEOUT_MS).then(
      () => ({ page: null, error: "timeout" } as ScrapeResult)
    ),
  ]);

  if (result.error) {
    switch (result.error) {
      case "invalid-url":
        return res.status(400).json({ error: "Invalid URL" });
      case "timeout":
        return res.status(504).json({ error: "Timeout" });
      case "unknown":
      default:
        return res.status(500).json({ error: "An unknown error occurred" });
    }
  }

  res.status(200).json(result.page);
};

export default scrapeController;

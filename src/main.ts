import express from "express";
import scrapeController from "./scrape";

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get("/api/scrape", scrapeController);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

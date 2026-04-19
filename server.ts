import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // API Route to extract Reels data
  // Proxy route for direct downloads
  app.get("/api/proxy-download", async (req, res) => {
    try {
      const { url, filename } = req.query;
      if (!url || typeof url !== 'string') return res.status(400).send("URL is required");
      
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
        }
      });

      res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${filename || 'instagram_reel.mp4'}"`);
      response.data.pipe(res);
    } catch (error: any) {
      console.error("Proxy error:", error.message);
      res.status(500).send("Error downloading file: " + error.message);
    }
  });

  app.post("/api/extract", async (req, res) => {
    try {
      let { url } = req.body;
      if (!url || !url.includes("instagram.com")) {
        return res.status(400).json({ error: "URL do Instagram inválida" });
      }

      // Pre-normalize URL: transform /reel/ into /reels/ as suggested by user
      if (url.includes("/reel/")) {
        url = url.replace("/reel/", "/reels/");
      }

      // Emulate the headers provided by the user
      const headers = {
        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
      };

      // Function to extract from HTML text
      const extractFromHtml = (htmlContent: string) => {
        const foundResults: any[] = [];
        
        // Unescape common sequences
        const cleanHtml = htmlContent
          .replace(/\\u0026/g, "&")
          .replace(/\\u0025/g, "%")
          .replace(/\\\//g, "/")
          .replace(/&amp;/g, "&");

        // 1. Unified JSON Deep Scan (Finds many more URLs)
        const allUrlsRegex = /"video_versions":\s*\[(.*?)\]|"dash_manifest":\s*"([^"]+)"|"video_url":\s*"([^"]+)"|"audio_url":\s*"([^"]+)"/gs;
        let match;
        while ((match = allUrlsRegex.exec(cleanHtml)) !== null) {
          if (match[1]) { // video_versions array
            const urls = match[1].match(/"url":\s*"([^"]+)"/g);
            if (urls) {
              urls.forEach((u, i) => {
                const url = u.replace(/"url":\s*"/, "").replace(/"$/, "").replace(/\\/g, "");
                foundResults.push({ 
                  quality: i === 0 ? 'Full HD (API)' : 'SD (API)', 
                  url, 
                  type: 'video', 
                  priority: 80 - i 
                });
              });
            }
          }
          if (match[3]) { // single video_url
            const url = match[3].replace(/\\/g, '');
            foundResults.push({ quality: 'Direct Stream (HD)', url, type: 'video', priority: 85 });
          }
           if (match[4]) { // single audio_url
            const url = match[4].replace(/\\/g, '');
            foundResults.push({ quality: 'Pure Audio (HQ)', url, type: 'audio', priority: 50 });
          }
        }

        // 2. OpenGraph - Usually the best merged link
        const ogVideoRegex = /<meta[^>]*property="og:video"[^>]*content="([^"]+)"/gi;
        while ((match = ogVideoRegex.exec(cleanHtml)) !== null) {
          foundResults.push({ quality: '1080p FULL HD (Merged)', url: match[1].trim(), type: 'video', priority: 100 });
        }

        // 3. DASH Manifest Parsing (Individual Tracks)
        const dashRegex = /FBQualityLabel="([^"]+)"[^>]*><BaseURL>([^<]+)<\/BaseURL>/g;
        while ((match = dashRegex.exec(cleanHtml)) !== null) {
          const res = match[1].replace(/[^0-9]/g, '');
          foundResults.push({ 
            quality: `Stream ${match[1]} (Separate)`, 
            url: match[2].trim(), 
            type: 'video', 
            priority: parseInt(res) / 10 
          });
        }

        // 4. Broad CDN scan fallback
        const cdnRegex = /https:\/\/[^"'\s]+\.fna\.fbcdn\.net\/[^"'\s]+(?:\.mp4|\.m4a)[^"'\s]*/g;
        const cdnMatches = cleanHtml.match(cdnRegex);
        if (cdnMatches) {
          cdnMatches.forEach((u: string) => {
            if (!foundResults.find(r => r.url === u)) {
              foundResults.push({
                quality: u.includes('.mp4') ? 'CDN MP4' : 'CDN Track',
                url: u,
                type: u.includes('.mp4') ? 'video' : 'audio',
                priority: 5
              });
            }
          });
        }

        return foundResults;
      };

      console.log(`Fetching Pass 1: ${url}`);
      let firstResponse = await axios.get(url, { headers, timeout: 10000, validateStatus: () => true });
      let firstHtml = firstResponse.data;
      
      if (typeof firstHtml !== 'string') {
        firstHtml = JSON.stringify(firstHtml);
      }

      let results = extractFromHtml(firstHtml);

      // Pass 2: Try with __a=1 if Pass 1 fails
      if (results.length === 0) {
        const cleanUrl = url.split('?')[0];
        const apiVersionUrl = `${cleanUrl.endsWith('/') ? cleanUrl : cleanUrl + '/'}?__a=1&__d=dis`;
        console.log(`Fetching Pass 2: ${apiVersionUrl}`);
        try {
          const apiResponse = await axios.get(apiVersionUrl, { headers, timeout: 10000, validateStatus: () => true });
          const apiData = typeof apiResponse.data === 'string' ? apiResponse.data : JSON.stringify(apiResponse.data);
          results = extractFromHtml(apiData);
        } catch (e) {
          console.log("Pass 2 failed");
        }
      }

      // Unique and Sort by Priority
      const uniqueResults = results
        .filter((v, i, a) => v.url.includes('http') && v.url.length > 50 && a.findIndex(t => t.url === v.url) === i)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));

      // Print results to terminal as requested
      console.log(`Extraction successful for ${url}. Found ${uniqueResults.length} links.`);
      uniqueResults.forEach(r => console.log(`[${r.type}] ${r.quality} (PR:${r.priority}): ${r.url.split('?')[0]}...`));

      return res.json({ 
        url,
        results: uniqueResults
      });

    } catch (error: any) {
      console.error("Extraction error:", error.message);
      return res.status(500).json({ error: "Falha ao extrair dados do Reels. " + error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

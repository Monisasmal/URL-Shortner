const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILES = path.join(__dirname, "urls.json");

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Ensure the JSON file exists
if (!fs.existsSync(DATA_FILES)) {
    fs.writeFileSync(DATA_FILES, JSON.stringify({}, null, 2));
}

// Load URLs from JSON
const loadURL = () => {
    if (!fs.existsSync(DATA_FILES)) return {};
    const data = fs.readFileSync(DATA_FILES, "utf8").trim();
    return data ? JSON.parse(data) : {};
};

// Save URLs to JSON
const saveURL = (data) => {
    fs.writeFileSync(DATA_FILES, JSON.stringify(data, null, 2));
};

// Serve HTML form
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Shorten URL
app.post("/shorten", async (req, res) => {
    const { originalURL } = req.body;

    if (!originalURL) {
        return res.status(400).send("URL required");
    }

    const { nanoid } = await import("nanoid");
    const urlDatabase = loadURL();
    const shortID = nanoid(7);
    urlDatabase[shortID] = originalURL;
    saveURL(urlDatabase);

    const shortURL = `${req.protocol}://${req.get("host")}/${shortID}`;

    
    res.send(`
        
        <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Shortened URL</title>
        <style>
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
            }
            body {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
               background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                text-align: center;
                padding: 20px;
            }
            .container {
                max-width: 450px;
               background: rgba(255, 255, 255, 0.2);
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            }
            h1 {
                font-size: 26px;
                margin-bottom: 15px;
            }
            .shortened-url {
                font-size: 18px;
                padding: 12px;
                background: white;
               
                display: inline-block;
                border-radius: 5px;
                margin-top: 10px;
                word-break: break-all;
            }
            a {
                display: inline-block;
                color: black;
                font-size: 16px;
                margin-top: 15px;
                padding: 10px 15px;
               
                border-radius: 5px;
                text-decoration: none;
                transition: 0.3s;
            }
            
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎉 Your Shortened URL</h1>
            <p class="shortened-url">
                <a href="${shortURL}" target="_blank">${shortURL}</a>
            </p>
            <a href="/">🔄 Shorten Another URL</a>
        </div>
    </body>
    </html>

    `);
});

// Redirect short URL to original URL
app.get("/:shortID", (req, res) => {
    const urlDatabase = loadURL();
    const { shortID } = req.params;

    if (!urlDatabase[shortID]) {
        return res.status(404).send("<h2>Short URL not found.</h2><a href='/'>Create a new one</a>");
    }

    res.redirect(urlDatabase[shortID]);
});

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

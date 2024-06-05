const express = require('express');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

app.get('/api/scrape', async (req, res) => {
    const keyword = req.query.keyword;
    if (!keyword) {
        console.error('Keyword is required');
        return res.status(400).json({ error: 'Keyword is required' });
    }

    try {
        const url = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;
        console.log(`Fetching URL: ${url}`);
        
        // Add custom headers to mimic a real browser
        const { data: html, status, headers } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        }).catch(error => {
            console.error('Error fetching URL:', error);
            throw new Error('Failed to fetch Amazon page');
        });

        console.log(`Fetched data from Amazon with status: ${status}`);
        console.log('Response headers:', headers);

        const dom = new JSDOM(html);
        const document = dom.window.document;
        const products = [];

        // Add detailed logging for parsing logic
        const items = document.querySelectorAll('.s-main-slot .s-result-item');
        console.log(`Found ${items.length} items`);

        items.forEach(item => {
            try {
                const title = item.querySelector('h2 a span')?.textContent || 'No title';
                const rating = item.querySelector('.a-icon-alt')?.textContent || 'No rating';
                const reviewCount = item.querySelector('.s-link-style .s-link-slim .a-size-base')?.textContent || 'No reviews';
                const image = item.querySelector('.s-image')?.src || 'No image';

                products.push({ title, rating, reviewCount, image });
            } catch (parseError) {
                console.error('Error parsing item:', parseError);
            }
        });

        console.log('Products:', products);  // Log products to debug
        res.json(products);
    } catch (error) {
        console.error('Error during scraping process:', error); // Log detailed error
        res.status(500).json({ error: 'Failed to fetch data from Amazon' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

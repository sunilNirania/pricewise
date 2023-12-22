import axios from "axios";
import * as cheerio from "cheerio";
import { extractCurrency, extractPrice,extractDescription } from "../utils";

export async function scrapeAmazonProduct(url: string){
    if(!url) return;

    //BrightData proxy configuration
    const username = String(process.env.BRIGHT_DATA_USERNAME);
    const password = String(process.env.BRIGHT_DATA_PASSWORD);
    const port = 22225;
    const session_id = (1000000 * Math.random()) | 0;

    const options = {
        auth: {
            username: `${username}-session-${session_id}`,
            password: password
        },
        host: 'brd.superproxy.io',
        port,
        rejectUnauthorized: false,
    }

    try {
        const response = await axios.get(url, options);
        const $ = cheerio.load(response.data);
        
        const title = $("#productTitle").text().trim();
        const currentPrice = extractPrice(
            $('.priceToPay span.a-price-whole'),
            $('a.size.base.a-color-price'),
            $('.a-button-selected .a-color-base')
        );
        
        const originalPrice = extractPrice(
            $('#priceblock_ourprice'),
            $('.a-size-small.a-color-secondary.aok-align-center.basisPrice span.a-price.a-text-price span.a-offscreen'),
            $('#listPrice'),
            $('#priceblock_dealprice'),
            $('.a-size-base.a-color-price')
        )

        const outOfStock = $('#availability span').text().toLowerCase() === 'Currently unavailable.';
        const images = $('#imgBlkFront').attr('data-a-dynamic-image') || $('#landingImage').attr('data-a-dynamic-image') || '{}';
        const imageUrl = Object.keys(JSON.parse(images));
        const currency = extractCurrency($('.a-price-symbol'))
        const discountRate =$('.savingsPercentage').text().replace(/[-%]/g,'');
        const description = extractDescription($);

        const data = {
            url,
            currency: currency || '₹',
            image: imageUrl[0],
            title,
            currrentPrice: Number(currentPrice),
            originalPrice: Number(originalPrice),
            priceHistory: [],
            discountRate: Number(discountRate),
            category: 'category',
            reviewCount: 100,
            starts: 4.5,
            isOutOfStock: outOfStock,
            description,
            lowestPrice: Number(currentPrice) || Number(originalPrice),
            highestPrice: Number(originalPrice) || Number(currentPrice),
            averagePrice: Number(currentPrice) || Number(originalPrice),
        }

        return data;
    } catch (error: any) {
        throw new Error(`Failed to scrape product: ${error.message}`);
    }
}

function extractDescreption($: cheerio.CheerioAPI) {
    throw new Error("Function not implemented.");
}

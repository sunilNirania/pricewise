import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongoose"
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { getHighestPrice, getLowestPrice, getAveragePrice, getEmailNotifType} from "@/lib/utils";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        connectToDB();

        const products = await Product.find({});

        if(!products) throw new Error("No products found");

        const updatedProduct = await Promise.all(
            products.map(async (currentProduct) => {
                const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);

                if(!scrapedProduct) return Error("NO PRODUCT FOUND");

                const updatedPriceHistory = [
                    ...currentProduct.priceHistory,
                    { price: scrapedProduct.currentPrice }
                ]
      
                 const product = {
                    ...scrapedProduct,
                    priceHistory: updatedPriceHistory,
                    lowestPrice: getLowestPrice(updatedPriceHistory),
                    highestPrice: getHighestPrice(updatedPriceHistory),
                    averagePrice: getAveragePrice(updatedPriceHistory),
                  }
                
      
                const updatedProduct = await Product.findOneAndUpdate(
                    {url: scrapedProduct.url},
                    product,
                );

                const emailNotifType = getEmailNotifType(scrapedProduct,product);
                if(emailNotifType && updatedProduct.users.length>0){
                    const productInfo = {
                        title: updatedProduct.title,
                        url: updatedProduct.url
                    }

                    const emailContent = await generateEmailBody(productInfo,emailNotifType);
                    const userEmails = updatedProduct.users.map((user: any) => user.email);

                    await sendEmail(emailContent,userEmails);
                }

                return updatedProduct;
            })
        )
        return NextResponse.json({
            message: 'OK',
            data: updatedProduct
        })
    } catch (error) {
        throw new Error(`Erorr in GET: ${error}`)
    }
}
"use client"
import { scrapeAndStoreProduct } from "@/lib/actions"
import { FormEvent, useState } from "react"


export const Searchbar = () => {
  const [searchPrompt, setSearchPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isValidAmazonProductLink = (link: string) => {
    try {
      const parsedURL = new URL(link);
      const hostname = parsedURL.hostname;

      //check if hostname is amazon.com
      if(
        hostname.includes('amazon.com') || 
        hostname.includes('amazon.') ||
        hostname.endsWith('amazon')
        ) {
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    const isValidLink = isValidAmazonProductLink(searchPrompt)

    if(!isValidLink) return alert('Please enter a valid Amazon product link')

    try {
      setIsLoading(true)
      
       await scrapeAndStoreProduct(searchPrompt)
     
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <form
      className="flex flex-wrap gap-4 mt-12"
      onSubmit={handleSubmit}
    >
    <input 
      type="text" 
      value={searchPrompt}
      onChange={(e) => setSearchPrompt(e.target.value)}
      placeholder="Enter product link"
      className="searchbar-input"
    />

    <button 
      type="submit" 
      className="searchbar-btn"
      disabled={searchPrompt === ''}
    >
      {isLoading? 'Searching...' : 'Search'}
    </button>
    </form>
  )
}


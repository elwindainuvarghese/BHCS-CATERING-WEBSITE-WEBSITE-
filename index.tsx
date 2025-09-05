/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality } from "@google/genai";

// --- Data for our food portal ---
// In a full-stack app, this would come from a database.
const foodItems = [
    {
        id: 1,
        name: 'Hyderabadi Chicken Biryani',
    },
    {
        id: 2,
        name: 'Vegetable Dum Biryani',
    },
    {
        id: 3,
        name: 'Chapathi with Paneer Butter Masala',
    },
    {
        id: 4,
        name: 'Chapathi with Chicken Chettinad',
    },
    {
        id: 5,
        name: 'Gourmet Mini Sliders',
    },
    {
        id: 6,
        name: 'Artisan Cheese Board',
    },
];

// --- Gemini API Initialization ---
let ai;
try {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} catch (error) {
  console.error("Failed to initialize GoogleGenAI:", error);
  // Display an error message to the user on the page
  const portal = document.getElementById('menu-portal');
  if (portal) {
    portal.innerHTML = `<p class="error-message">Could not connect to the AI service. Please check your API key.</p>`;
  }
}

/**
 * Generates an image for a food item using the Gemini API.
 * This function uses the 'gemini-2.5-flash-image-preview' model via the generateContent method
 * as a workaround for errors encountered with the 'generateImages' method.
 * @param foodName The name of the food.
 * @param imageElement The HTML image element to update.
 */
async function generateImage(foodName, imageElement) {
    if (!ai) return;

    try {
        const prompt = `Generate a professional, appetizing photo of ${foodName}, beautifully plated for a high-end catering event. Centered, on a clean, minimalist background.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        let imageFound = false;
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes = part.inlineData.data;
                imageElement.src = `data:image/png;base64,${base64ImageBytes}`;
                imageElement.classList.remove('loading-img');
                imageFound = true;
                break; 
            }
        }

        if (!imageFound) {
             throw new Error("No image data was returned from the API.");
        }

    } catch (error) {
        console.error(`Error generating image for ${foodName}:`, error);
        imageElement.classList.remove('loading-img'); // Stop loading animation on error
        imageElement.alt = `Error loading image for ${foodName}`;
    }
}


/**
 * Generates a description for a food item using the Gemini API.
 * @param foodName The name of the food.
 * @param descriptionElement The HTML element to update with the description.
 */
async function generateDescription(foodName, descriptionElement) {
    if (!ai) {
        descriptionElement.textContent = 'AI service is not available.';
        return;
    }
    try {
        const prompt = `Create a short, elegant, and appetizing description for a dish named "${foodName}" for a high-end catering website. Keep it under 25 words.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        descriptionElement.textContent = response.text;
        descriptionElement.classList.remove('loading');
    } catch (error) {
        console.error(`Error generating description for ${foodName}:`, error);
        descriptionElement.textContent = 'A delightful choice for any occasion.';
        descriptionElement.classList.remove('loading');
    }
}

/**
 * Renders the food items onto the page.
 */
function renderMenu() {
    const menuPortal = document.getElementById('menu-portal');
    if (!menuPortal) return;

    // Clear any existing content
    menuPortal.innerHTML = '';

    // Create and append a card for each food item
    for (const item of foodItems) {
        // Create card container
        const card = document.createElement('div');
        card.className = 'food-card';
        card.setAttribute('aria-label', `Menu item: ${item.name}`);

        // Create image element with loading state
        const img = document.createElement('img');
        img.alt = item.name;
        img.className = 'food-card-img loading-img';

        // Create card body
        const cardBody = document.createElement('div');
        cardBody.className = 'food-card-body';
        
        // Create title
        const title = document.createElement('h3');
        title.className = 'food-card-title';
        title.textContent = item.name;

        // Create description paragraph with loading state
        const description = document.createElement('p');
        description.className = 'food-card-description loading';
        description.textContent = 'Generating description...';

        // Assemble the card
        cardBody.appendChild(title);
        cardBody.appendChild(description);
        card.appendChild(img);
        card.appendChild(cardBody);
        
        // Add card to the grid
        menuPortal.appendChild(card);

        // Fetch description and image from Gemini API
        generateDescription(item.name, description);
        generateImage(item.name, img);
    }
}

// --- App Entry Point ---
// When the DOM is fully loaded, render the menu.
document.addEventListener('DOMContentLoaded', renderMenu);
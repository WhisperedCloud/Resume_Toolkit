// This service uses the PDF.js library, which is assumed to be loaded from a CDN.
declare const pdfjsLib: any;

export const extractTextFromPdf = async (file: File): Promise<string> => {
    // It's good practice to set the worker source.
    if (pdfjsLib && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

    const allPagesText: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        if (!textContent.items || textContent.items.length === 0) {
            allPagesText.push(''); // Add empty string for blank pages to preserve page breaks
            continue;
        }

        // Sort items primarily by Y (top to bottom), then X (left to right)
        // pdf.js Y-coordinate is from the bottom, so higher Y is higher on page.
        const sortedItems = textContent.items.slice().sort((a: any, b: any) => {
            const y1 = a.transform[5];
            const y2 = b.transform[5];
            const x1 = a.transform[4];
            const x2 = b.transform[4];

            // A small tolerance for items that are visually on the same line
            if (Math.abs(y1 - y2) > 4) {
                return y2 - y1;
            }
            return x1 - x2;
        });

        let lines: string[] = [];
        if (sortedItems.length > 0) {
            let currentLine = sortedItems[0].str;
            let lastY = sortedItems[0].transform[5];
            let lastX_end = sortedItems[0].transform[4] + sortedItems[0].width;

            for (let j = 1; j < sortedItems.length; j++) {
                const item = sortedItems[j];
                const currentY = item.transform[5];
                const currentX = item.transform[4];
                
                // Using height of item as a dynamic tolerance for new lines.
                // If vertical distance is more than half the item's height, consider it a new line.
                const yTolerance = item.height * 0.7;

                if (Math.abs(currentY - lastY) > yTolerance) {
                    lines.push(currentLine);
                    currentLine = item.str;
                } else {
                    // It's on the same line. Check for horizontal spacing.
                    // If the gap is larger than a fraction of a character's width, add a space.
                    const charWidth = item.str.length > 0 ? (item.width / item.str.length) : item.width;
                    const xGap = currentX - lastX_end;
                    if (xGap > charWidth * 0.25) {
                         currentLine += ' ' + item.str;
                    } else {
                        currentLine += item.str;
                    }
                }
                lastY = currentY;
                lastX_end = currentX + item.width;
            }
            lines.push(currentLine); // Add the last line
        }
        
        // Post-process to clean up any weird spacing issues from the PDF itself
        const cleanedPageText = lines.map(line => line.replace(/\s+/g, ' ').trim()).join('\n');
        allPagesText.push(cleanedPageText);
    }

    return allPagesText.join('\n\n').trim();
};

'use server';

import * as cheerio from 'cheerio';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export type SIARegisterResult = {
  found: boolean;
  firstName?: string;
  surname?: string;
  licenceNumber?: string;
  role?: string;
  licenceSector?: string;
  expiryDate?: string;
  status?: string;
  statusExplanation?: string;
  error?: string;
};

const SIA_REGISTER_URL = 'https://services.sia.homeoffice.gov.uk/rolh';

export async function searchSIARegister(siaNumber: string): Promise<SIARegisterResult> {
  try {
    // Validate input format first
    const cleanSiaNumber = siaNumber.replace(/\s/g, '');
    if (!/^\d{16}$/.test(cleanSiaNumber)) {
      return {
        found: false,
        error: 'Invalid SIA number format. Must be 16 digits.',
      };
    }

    console.log(`Searching SIA register for number: ${cleanSiaNumber}`);

    // Step 1: Get the initial page to establish session and get hidden fields
    const initialResponse = await fetch(SIA_REGISTER_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.5',
      },
      cache: 'no-store',
    });

    if (!initialResponse.ok) {
      throw new Error(`Failed to load search page: ${initialResponse.status}`);
    }

    const initialHtml = await initialResponse.text();
    const $ = cheerio.load(initialHtml);
    
    // Based on debugging, the input name is 'LicenseNo'
    let licenceInputName = 'LicenseNo';
    
    // Find the input element to locate the correct form
    let licenceInput = $(`input[name="${licenceInputName}"]`);
    
    // Verify if it exists, otherwise fall back to dynamic search
    if (licenceInput.length === 0) {
        licenceInputName = ''; // Reset if not found
        
        // Try to find the input by label text
        const licenceLabel = $('label:contains("Licence number")').first();
        if (licenceLabel.length > 0) {
          const forAttr = licenceLabel.attr('for');
          if (forAttr) {
            // Check if there is an input with this ID and get its name
            const inputById = $(`#${forAttr}`);
            if (inputById.length > 0 && inputById.attr('name')) {
              licenceInputName = inputById.attr('name') as string;
              licenceInput = inputById;
            }
          }
        }
    }

    // Fallback search for inputs if the specific label logic fails
    if (!licenceInputName) {
       // Look for input with type text that isn't search/hidden
       // This is risky. Let's look for known likely names if we can't find it
       // Or print debugging info if it fails.
       
       // Based on the screenshot provided in the prompt, there is a "Search" button
       // and a "Licence number" field.
       
       // Common names in these forms might be related to "SearchCriteria", "LicenceNumber", etc.
       // Let's iterate inputs to find one that looks like a licence number field
       $('input[type="text"]').each((_, el) => {
         const name = $(el).attr('name');
         if (name && (name.toLowerCase().includes('licence') || name.toLowerCase().includes('number'))) {
           licenceInputName = name;
           licenceInput = $(el);
         }
       });
    }

    if (!licenceInputName) {
      // If we still can't find it, we might be blocked or the page structure is different
      // For now, let's try a common guess or fail
      console.warn('Could not determine licence number input name. Dumping input names:');
      $('input').each((_, el) => console.log($(el).attr('name')));
      
      // Let's try to proceed with a best guess if we found nothing specific? 
      // Actually, if we can't find the input name, we can't submit the form.
      // But let's assume we found it or proceed. 
      
      // Let's check for "LicenceNumber" which is common
      // Or try to look for the input near the text "16 digit number"
      const hintText = $('*:contains("16 digit number")').first();
      const nearbyInput = hintText.closest('div').find('input[type="text"]').first();
      if (nearbyInput.length && nearbyInput.attr('name')) {
        licenceInputName = nearbyInput.attr('name') as string;
        licenceInput = nearbyInput;
      }
    }
    
    if (!licenceInputName) {
        return {
            found: false,
            error: 'Could not identify search form fields on SIA website.'
        };
    }
    
    // Now that we have the input, find its parent form
    const form = licenceInput.closest('form');
    if (form.length === 0) {
        console.warn('Licence input found but has no parent form!');
    }

    // Add hidden inputs specifically from the target form
    // If the hidden inputs are inside the form, we should prefer those.
    // If they are at the root (ASP.NET WebForms style), they apply to the whole page.
    // But since we saw two forms with different actions, this looks like MVC.
    
    // Clear previous form data logic for hidden fields to be safer?
    // Let's re-build formData based on the specific form we found
    const formData = new URLSearchParams();
    
    if (form.length > 0) {
        form.find('input[type="hidden"]').each((_, element) => {
             const name = $(element).attr('name');
             const value = $(element).val();
             if (name && value !== undefined) {
                 formData.append(name, value as string);
             }
        });
    } else {
        // Fallback to all hidden inputs if we couldn't find the parent form
         $('input[type="hidden"]').each((_, element) => {
          const name = $(element).attr('name');
          const value = $(element).val();
          if (name && value !== undefined) {
            formData.append(name, value as string);
          }
        });
    }
    
    // Add our search value
    formData.set(licenceInputName, cleanSiaNumber);
    
    // We also need to simulate the "Search" button click usually
    // Find the submit button and add its name/value if present
    // There are likely two search buttons. We want the one in the same container as LicenseNo
    
    // Find the container of the licence input (form or inner container)
    const container = licenceInput.closest('form, div.row, fieldset, div.search-panel'); 
    
    // Find button in that container or nearby
    let searchButton = container.find('input[type="submit"], button[type="submit"]').first();
    
    if (searchButton.length === 0) {
        // Fallback: finding button by value "Search" that is physically after the input in the DOM
        const allButtons = $('input[type="submit"][value="Search"], button:contains("Search")');
        // This is tricky without a real DOM, but in Cheerio source order is preserved
        // We want the first button that appears AFTER our input
        
        let found = false;
        allButtons.each((_, btn) => {
            if (found) return; // already found
            // Let's just pick the last one if there are multiple? Or the one named "Search" if unique?
            // Actually, for multiple forms, we should look inside the form we found
            if (form.length > 0) {
                const btnElement = $(btn);
                const btnForm = btnElement.closest('form');
                // Check if the button's form matches our form
                if (btnForm.length > 0 && btnForm[0] === form[0]) {
                    searchButton = btnElement;
                    found = true;
                }
            }
        });
        
        if (searchButton.length === 0) {
             searchButton = allButtons.last(); // Usually "Find by licence number" is the second option (right side)
        }
    }
    
    if (searchButton.length > 0 && searchButton.attr('name')) {
        const btnName = searchButton.attr('name') as string;
        const btnVal = (searchButton.val() as string) || searchButton.text() || 'Search';
        console.log(`Clicking button: ${btnName}=${btnVal}`);
        formData.append(btnName, btnVal);
    } else {
        // console.warn('Could not find a specific submit button to click.');
    }

    // Cookies from initial response
    const cookies = initialResponse.headers.get('set-cookie');
    
    console.log(`Submitting form to ${SIA_REGISTER_URL}`);
    console.log(`Licence Input Name: ${licenceInputName}`);
    // console.log(`Form Data:`, Object.fromEntries(formData)); // Careful with secrets if any

    let actionUrl = form.attr('action');
    
    if (actionUrl) {
        // Handle relative URLs
        if (!actionUrl.startsWith('http')) {
             const baseUrl = new URL(SIA_REGISTER_URL).origin;
             actionUrl = baseUrl + actionUrl;
        }
        console.log(`Form Action URL: ${actionUrl}`);
    } else {
        // Fallback or explicit known URL based on debugging
        console.log('Could not find form action, using default fallback');
        // Based on debug logs: /PublicRegister/SearchPublicRegisterByLicence
        actionUrl = 'https://services.sia.homeoffice.gov.uk/PublicRegister/SearchPublicRegisterByLicence';
    }

    // Step 2: Submit the search form
    const searchResponse = await fetch(actionUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies || '',
        'Origin': 'https://services.sia.homeoffice.gov.uk',
        'Referer': SIA_REGISTER_URL,
      },
      body: formData,
      cache: 'no-store',
    });

    if (!searchResponse.ok) {
      throw new Error(`Search request failed: ${searchResponse.status}`);
    }

    const searchHtml = await searchResponse.text();
    const $result = cheerio.load(searchHtml);
    
    // Debug: Check if we are still on the same page or redirected
    const pageTitle = $result('title').text();
    console.log(`Response Page Title: ${pageTitle}`);

    // Step 3: Parse results
    // Look for "Search Results - 1 licence found" or similar
    const resultHeader = $result('h2:contains("Search Results"), h3:contains("Search Results")');
    
    if (resultHeader.length === 0 && !$result('*:contains("1 licence found")').length) {
       // Check for "No results found" or similar messages
       if ($result('*:contains("No results found")').length > 0 || $result('*:contains("0 licence found")').length > 0) {
         return { found: false };
       }
       
       // If neither found nor not found, something might be wrong (e.g. validation error)
       // Let's check for validation errors
       const validationSummary = $result('.validation-summary-errors, .field-validation-error');
       if (validationSummary.length > 0) {
           console.log(`Validation Error: ${validationSummary.text().trim()}`);
           return {
               found: false,
               error: `SIA Website Validation Error: ${validationSummary.text().trim()}`
           };
       }
       
       // Check if we just got the search page back without results
       if ($result('form').length > 0 && !$result('.result-container').length) {
           console.log('Got search page back, possibly invalid form submission');
           // Log inputs to see if we missed something
           // console.log(searchHtml.substring(0, 2000)); // Log first 2k chars for debugging
           
           // Check if there is a captcha
           if ($result('*:contains("captcha")').length > 0 || $result('*:contains("recaptcha")').length > 0) {
                return { found: false, error: 'SIA Website requires CAPTCHA' };
           }
       }
       
       // Fallback
       console.log('Unexpected response structure.');
       return { found: false, error: 'Unexpected response from SIA website' };
    }

    // Extract details
    // The structure seems to be a definition list or a series of divs based on the description
    // "First name DAVID Surname CAPENER ..."
    
    // Helper to find value by label
    const getValueByLabel = (label: string): string | undefined => {
        // Try multiple strategies
        
        // Strategy 1: Label followed by div/span/p with value
        // The user description suggests: "First name\nDAVID"
        
        // Find element with exact text
        const labelEl = $result(`*:contains("${label}")`).filter((_, el) => $result(el).text().trim() === label).last();
        
        if (labelEl.length) {
            // Try next sibling
            let next = labelEl.next();
            if (next.length && next.text().trim()) return next.text().trim();
            
            // Try parent's next sibling (if label is wrapped)
            next = labelEl.parent().next();
            if (next.length && next.text().trim()) return next.text().trim();
            
            // Try looking inside a common container structure (e.g. dt/dd)
            if (labelEl.is('dt')) {
                return labelEl.next('dd').text().trim();
            }
        }
        
        return undefined;
    };
    
    // Specific scraping logic for SIA results
    // Based on user query:
    // First name DAVID
    // Surname CAPENER
    // Licence number 1017048777046490
    // Role Front Line
    // Licence sector Door Supervision
    // Expiry date 26 February 2026
    // Status Active (as on 21 February 2023)
    // Status explanation Active -
    
    // Let's refine the extraction based on typical layouts (e.g. definition lists or grid)
    // It looks like they might use a DL or simple divs. 
    
    // Let's dump the text content around "First name" to be safe if specific selectors fail
    // But we'll try specific selectors first.
    
    const cleanValue = (val: string | undefined) => {
        if (!val) return undefined;
        return val.replace(/\s+/g, ' ').trim();
    };

    const result: SIARegisterResult = {
        found: true,
        firstName: cleanValue(getValueByLabel('First name')),
        surname: cleanValue(getValueByLabel('Surname')),
        licenceNumber: cleanValue(getValueByLabel('Licence number')),
        role: cleanValue(getValueByLabel('Role')),
        licenceSector: cleanValue(getValueByLabel('Licence sector')),
        expiryDate: cleanValue(getValueByLabel('Expiry date')),
        status: cleanValue(getValueByLabel('Status')),
        statusExplanation: cleanValue(getValueByLabel('Status explanation'))
    };
    
    // Clean up status
    if (result.status && result.status.includes('Active')) {
        // Just extract "Active" if we want, or keep the full text "Active (as on ...)"
        // The user seems to want the status shown.
        // If it's "Active (as on...)", maybe just "Active" is better for the badge?
        // But the detailed text is useful too.
        // Let's split if it contains (as on
        if (result.status.includes('(as on')) {
            const parts = result.status.split('(as on');
            result.status = parts[0].trim();
        }
    }

    return result;

  } catch (error: any) {
    console.error('SIA Register Search Error:', error);
    return {
      found: false,
      error: error.message || 'Internal server error during SIA search',
    };
  }
}

export async function requestSIAUpdate(
  staffDetailId: string,
  staffName: string,
  siaNumber: string,
  assignmentId: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    
    // Get the assignment to find the provider
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('provider_id, providers(user_id, company_name)')
      .eq('id', assignmentId)
      .single();
    
    if (assignmentError || !assignment) {
      return { success: false, error: 'Assignment not found' };
    }
    
    const provider = assignment.providers as any;
    if (!provider || !provider.user_id) {
      return { success: false, error: 'Provider not found' };
    }
    
    // Create the message content
    const messageContent = `Hi ${provider.company_name || 'Provider'},

We need to verify the SIA badge number for ${staffName}.

The SIA number ${siaNumber} was not found on the official SIA register. Please could you provide an updated SIA badge number for this staff member?

Thank you.`;
    
    // Send the message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: adminUserId,
        receiver_id: provider.user_id,
        content: messageContent,
        read: false,
      });
    
    if (messageError) {
      console.error('Error sending message:', messageError);
      return { success: false, error: 'Failed to send message' };
    }
    
    revalidatePath('/admin/messages');
    revalidatePath('/provider/messages');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error requesting SIA update:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

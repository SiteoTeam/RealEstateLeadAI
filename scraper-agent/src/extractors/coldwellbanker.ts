/**
 * Coldwell Banker Agent Extractor
 * 
 * Specialized extractor for Coldwell Banker agent profiles.
 * CB profiles expose contact info, headshots, and logos directly on the frontend.
 */

import { scrapePage } from '../utils/firecrawl';
import * as cheerio from 'cheerio';

export interface CBAgentProfile {
    full_name: string;
    email: string | null;
    mobile_phone: string | null;
    office_phone: string | null;
    all_phones: string[];
    headshot_url: string | null;
    logo_url: string | null;            // Team/Personal logo
    brokerage_logo_url: string;         // Standard CB Realty logo
    bio: string | null;
    office_name: string | null;
    office_address: string | null;
    license_number: string | null;
    social_links: {
        linkedin: string | null;
        facebook: string | null;
        instagram: string | null;
        twitter: string | null;
        youtube: string | null;
    };
    profile_url: string;
    extraction_success: boolean;
    extraction_errors: string[];
}

// Email regex
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Phone regex (US format)
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

// Social media patterns
const SOCIAL_PATTERNS = {
    linkedin: /https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/gi,
    facebook: /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+\/?/gi,
    instagram: /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?/gi,
    twitter: /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_]+\/?/gi,
    youtube: /https?:\/\/(?:www\.)?youtube\.com\/(?:channel\/|user\/|c\/|@)?[a-zA-Z0-9_-]+/gi,
};

// Image URL patterns for headshots
const HEADSHOT_PATTERNS = [
    /https?:\/\/[^\s"']+(?:agent|profile|photo|headshot|portrait)[^\s"']*\.(?:jpg|jpeg|png|webp)/gi,
    /https?:\/\/[^\s"']+\/agents?\/[^\s"']+\.(?:jpg|jpeg|png|webp)/gi,
    /https?:\/\/[^\s"']+cloudinary[^\s"']+\.(?:jpg|jpeg|png|webp)/gi,
    /https?:\/\/[^\s"']+\.(?:jpg|jpeg|png|webp)/gi,
];

// CB Logo patterns (Generic logos we want to AVOID as team logos)
const GENERIC_CB_LOGOS = [
    /coldwell.*banker.*logo/i,
    /logo.*coldwell.*banker/i,
    /cb.*logo/i,
    /realogy.*logo/i,
    /logo.*blue/i, // Heuristic for common filename
];

// EXCLUSION PATTERNS - these are NOT agent headshots
const OFFICE_PHOTO_PATTERNS = [
    /office/i,
    /building/i,
    /exterior/i,
    /storefront/i,
    /location/i,
    /branch/i,
    /property/i,
    /listing/i,
    /home/i,
    /house/i,
];

function isOfficePhoto(url: string): boolean {
    const lower = url.toLowerCase();
    return OFFICE_PHOTO_PATTERNS.some(p => p.test(lower)) ||
        lower.includes('/offices/') ||
        lower.includes('/properties/') ||
        lower.includes('/listings/');
}

/**
 * Extract agent name from markdown
 */
function extractName(markdown: string): string | null {
    const lines = markdown.split('\n').filter(l => l.trim());

    // Look for H1 headings - usually the agent name
    for (const line of lines) {
        if (line.startsWith('# ')) {
            const text = line.replace(/^#\s+/, '').trim();
            // Clean up common suffixes
            const cleaned = text
                .replace(/\s*\|.*$/, '')
                .replace(/\s*-\s*Coldwell Banker.*$/i, '')
                .replace(/\s*,\s*(?:Realtor|Agent|Broker).*$/i, '')
                .trim();

            // Validate it looks like a name (2-5 words, mostly letters)
            const words = cleaned.split(/\s+/);
            if (words.length >= 2 && words.length <= 5) {
                const isNameLike = words.every(w => /^[A-Za-z.'-]+$/.test(w));
                if (isNameLike) {
                    return cleaned;
                }
            }
        }
    }

    // Fallback: Look for name patterns
    const namePatterns = [
        /(?:Agent|Realtor|Meet)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)/i,
        /([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)\s+(?:is a|specializes|serves)/i,
    ];

    for (const pattern of namePatterns) {
        const match = markdown.match(pattern);
        if (match) return match[1].trim();
    }

    return null;
}

/**
 * Extract email addresses
 */
function extractEmails(markdown: string): string[] {
    const matches = markdown.match(EMAIL_REGEX) || [];
    const emails = new Set<string>();

    for (const email of matches) {
        const normalized = email.toLowerCase();
        // Skip generic emails
        if (!normalized.includes('noreply') &&
            !normalized.includes('info@') &&
            !normalized.includes('support@') &&
            !normalized.includes('example.com')) {
            emails.add(normalized);
        }
    }

    return Array.from(emails);
}

/**
 * Extract phone numbers
 */
function extractPhones(markdown: string): string[] {
    const matches = markdown.match(PHONE_REGEX) || [];
    const phones = new Set<string>();

    for (const phone of matches) {
        const digits = phone.replace(/\D/g, '');

        // Filter out dummy numbers often found in placeholders
        if (digits === '2000000000' || digits.startsWith('000') || /^(\d)\1+$/.test(digits)) {
            continue;
        }

        if (digits.length >= 10 && digits.length <= 11) {
            // Format: (XXX) XXX-XXXX
            const normalized = digits.length === 11
                ? `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
                : `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
            phones.add(normalized);
        }
    }

    return Array.from(phones);
}

/**
 * Extract image URLs that look like headshots
 * Strategy: DOM first (reliable), then markdown fallback
 */
function extractHeadshotUrl(markdown: string, html?: string): string | null {
    // Use the module-level isOfficePhoto function

    function isValidHeadshot(url: string, altText: string = ''): boolean {
        const lowerUrl = url.toLowerCase();
        const lowerAlt = altText.toLowerCase();

        // Must be an image
        if (!/\.(jpg|jpeg|png|webp)/i.test(url)) return false;

        // Skip icons, logos, tiny images, or known generic assets
        if (/icon|logo|favicon|1x1|placeholder|sprite|brand|company/i.test(lowerUrl)) return false;
        if (/logo|icon|brand/i.test(lowerAlt)) return false;

        // Skip office photos
        if (isOfficePhoto(url)) return false;

        return true;
    }

    // STRATEGY 1: DOM-Based (Most Reliable)
    if (html) {
        const $ = cheerio.load(html);

        // Common CB agent headshot selectors - prioritized
        const headshotSelectors = [
            'img.agent-photo',
            'img.agent-headshot',
            'img.profile-photo',
            'img[alt*="Agent Photo" i]',
            'div.agent-photo img',
            'div.agent-headshot img',
            // Specific CB selectors observed
            '.AgentProfile_agentPhoto img',
            '[data-testid="agent-photo"]',
            // Fallbacks
            'img[alt*="headshot" i]',
            'img[class*="agent" i][src*="photo"]',
        ];

        for (const selector of headshotSelectors) {
            const img = $(selector).first();
            if (img.length) {
                const src = img.attr('src') || img.attr('data-src');
                const alt = img.attr('alt') || '';

                if (src && isValidHeadshot(src, alt)) {
                    return src;
                }
            }
        }

        // Fallback: Find first large image in main content area that looks like a person
        // and explicitly verify it's NOT a logo using the new strict check
        const mainImages = $('main img, [role="main"] img, .content img, article img').toArray();
        for (const el of mainImages) {
            const src = $(el).attr('src') || $(el).attr('data-src');
            const alt = $(el).attr('alt') || '';

            if (src && isValidHeadshot(src, alt)) {
                // Prefer images with person-related alt text
                if (/photo|headshot|agent|portrait/i.test(alt) || (alt.length > 3 && alt.length < 50)) {
                    return src;
                }
            }
        }
    }

    // STRATEGY 2: Markdown patterns (Fallback)
    for (const pattern of HEADSHOT_PATTERNS) {
        const matches = markdown.match(pattern);
        if (matches && matches.length > 0) {
            for (const url of matches) {
                if (isValidHeadshot(url)) {
                    return url;
                }
            }
        }
    }

    return null;
}

/**
 * Helper to check if a logo URL is just the generic brokerage logo
 */
function isGenericLogo(url: string): boolean {
    const lowerUrl = url.toLowerCase();

    // Check against patterns
    if (GENERIC_CB_LOGOS.some(pattern => pattern.test(lowerUrl))) return true;

    // Check for specific common generic filenames seen in CB
    if (lowerUrl.includes('cbrealty_logo') ||
        lowerUrl.includes('coldwellbanker_logo') ||
        lowerUrl.includes('coldwell-banker-logo') ||
        lowerUrl.includes('global-luxury-logo')) {
        return true;
    }

    return false;
}

/**
 * Extract Team/Brokerage logo URL (not building photos)
 */
function extractLogoUrl(markdown: string, html?: string): string | null {
    let candidateUrl: string | null = null;
    const fs = require('fs');
    const debugLog: string[] = [];

    const log = (msg: string) => {
        console.log(msg);
        debugLog.push(msg);
    };

    log('[Logo Debug] Starting logo extraction...');

    // Strategy 0: Find images in "Team" sections (HIGHEST PRIORITY)
    // Look for sections with headers containing "Team" (e.g., "Karyn Wynne's Team")
    if (html) {
        const $ = cheerio.load(html);

        // Debug: Check if "team" appears anywhere in HTML
        const teamInHtml = html.toLowerCase().includes('team');
        log(`[Logo Debug] HTML contains 'team': ${teamInHtml}`);

        // Find headers containing "Team" and get images from their parent section
        $('h1, h2, h3, h4, h5, h6, [class*="heading"], [class*="title"]').each((i, headerEl) => {
            const headerText = $(headerEl).text().trim();
            console.log(`[Logo Debug] Header ${i}: "${headerText.substring(0, 50)}"`);

            if (candidateUrl) return; // Already found

            if (headerText.toLowerCase().includes('team') && !headerText.toLowerCase().includes('contact')) {
                console.log(`[Logo Debug] FOUND Team header: "${headerText}"`);

                // Get the parent container or next sibling that might contain the logo
                const parent = $(headerEl).parent();
                const section = parent.length ? parent : $(headerEl).next();

                console.log(`[Logo Debug] Searching for images in section with ${section.find('img').length} img tags`);

                // Find first image in this section that's not an office photo or CB logo
                section.find('img').each((imgIdx, imgEl) => {
                    if (candidateUrl) return;

                    const src = $(imgEl).attr('src') || $(imgEl).attr('data-src');
                    const alt = $(imgEl).attr('alt') || '';

                    console.log(`[Logo Debug] Image ${imgIdx}: src="${src?.substring(0, 80) || 'null'}", alt="${alt}"`);

                    if (src && /\.(png|jpg|jpeg|svg|webp)/i.test(src)) {
                        const isGeneric = isGenericLogo(src);
                        const isOffice = isOfficePhoto(src);
                        const isHeadshot = /headshot|portrait/i.test(alt);
                        console.log(`[Logo Debug] Checks - isGeneric: ${isGeneric}, isOffice: ${isOffice}, isHeadshot: ${isHeadshot}`);

                        if (!isGeneric && !isOffice && !isHeadshot) {
                            candidateUrl = src;
                            console.log(`[Logo Debug] ✓ Selected as team logo: ${src}`);
                        }
                    }
                });
            }
        });
    }

    // Strategy 1: DOM-Based (Look for images with logo-related classes)
    if (!candidateUrl && html) {
        const $ = cheerio.load(html);
        const logoSelectors = [
            'img.team-logo',
            'img.office-logo',
            'img.partner-logo',
            '.AgentProfile_teamLogo img',
            '[data-testid="team-logo"]',
            // Generic but often used for secondary logos
            'img[alt*="logo" i]',
            'img[src*="logo" i]'
        ];

        for (const selector of logoSelectors) {
            $(selector).each((_, el) => {
                if (candidateUrl) return; // Stop if found

                const src = $(el).attr('src') || $(el).attr('data-src');
                const alt = $(el).attr('alt') || '';

                if (src) {
                    // It must NOT be a headshot, and NOT be the generic CB logo
                    if (!isGenericLogo(src) && !isOfficePhoto(src) && !/headshot|photo|agent|portrait/i.test(alt)) {
                        // Check file extension/type if possible
                        if (/\.(png|jpg|jpeg|svg|webp)/i.test(src)) {
                            candidateUrl = src;
                        }
                    }
                }
            });
        }
    }

    // Strategy 2: Markdown patterns (Fallback)
    if (!candidateUrl) {
        // Look for images in "Team" section specifically
        const teamSectionMatch = markdown.match(
            /(?:Team|My\s+Team|Partner|Group)[\s\S]{0,500}?!\[[^\]]*\]\(([^)]+)\)/i
        );
        if (teamSectionMatch && teamSectionMatch[1]) {
            const url = teamSectionMatch[1].replace(/[)\]]+$/, '');
            if (!isGenericLogo(url)) candidateUrl = url;
        }
    }

    // Strategy 3: Look for explicit "logo" in URL path in markdown
    if (!candidateUrl) {
        const logoPathMatch = markdown.match(
            /https?:\/\/[^\s"')\]]+\/logos\/[^\s"')\]]+/i
        );
        if (logoPathMatch) {
            const url = logoPathMatch[0].replace(/[)\]]+$/, '');
            if (!isGenericLogo(url)) candidateUrl = url;
        }
    }

    // Strategy 4: Realogy CDN
    if (!candidateUrl) {
        const cdnMatch = markdown.match(/https?:\/\/images\.cloud\.realogyprod\.com\/[^\s"')\]]+/gi);
        if (cdnMatch && cdnMatch.length > 0) {
            const found = cdnMatch.find(url =>
                url.includes('/logos/') &&
                !url.includes('/photos/') &&
                !url.includes('/offices/') &&
                !isGenericLogo(url)
            );
            if (found) candidateUrl = found.replace(/[)\]]+$/, '');
        }
    }

    // Final Validation
    if (candidateUrl) {
        if (isGenericLogo(candidateUrl)) {
            console.log(`[Logo Debug] Final candidate is generic logo, returning null`);
            return null;
        }
        console.log(`[Logo Debug] ✓ Final logo URL: ${candidateUrl}`);
        return candidateUrl;
    }

    console.log(`[Logo Debug] No logo found`);
    return null;
}

/**
 * Extract bio/about text (skip markdown links)
 */
function extractBio(markdown: string): string | null {
    // Remove markdown links and images first
    const cleanText = markdown
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // Remove images
        .replace(/\[[^\]]*\]\([^)]+\)/g, '')   // Remove links
        .replace(/\*\*([^*]+)\*\*/g, '$1')     // Remove bold
        .replace(/\*([^*]+)\*/g, '$1');        // Remove italic

    // Look for about/bio section
    const bioPatterns = [
        /(?:About\s+(?:Me|[A-Z][a-z]+)|Biography|Bio)[:\s]*\n+([^#\n][^\n]{50,})/i,
        /(?:^|\n)([A-Z][a-z]+ (?:is|has been|specializes|brings|serves)[^.]+\.[^.]+\.)/m, // Sentences about the agent
    ];

    for (const pattern of bioPatterns) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
            const bio = match[1].trim();
            // Must be real text, not just whitespace/short
            if (bio.length > 50 && !bio.includes('http')) {
                return bio.substring(0, 500);
            }
        }
    }

    // Fallback: Find paragraphs that look like bio content
    const paragraphs = cleanText.split(/\n\n+/).filter(p => {
        const trimmed = p.trim();
        return (
            trimmed.length > 100 &&
            !trimmed.startsWith('#') &&
            !trimmed.startsWith('|') &&      // Not a table
            !trimmed.includes('http') &&     // Not a link
            !trimmed.match(/^\d+/) &&        // Not starting with number
            trimmed.match(/[a-z]/)           // Has lowercase (real text)
        );
    });

    if (paragraphs.length > 0) {
        return paragraphs[0].trim().substring(0, 500);
    }

    return null;
}

/**
 * Extract social media links
 */
function extractSocialLinks(markdown: string): CBAgentProfile['social_links'] {
    const social: CBAgentProfile['social_links'] = {
        linkedin: null,
        facebook: null,
        instagram: null,
        twitter: null,
        youtube: null,
    };

    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
        const matches = markdown.match(pattern);
        if (matches && matches.length > 0) {
            // Filter out generic/company pages for personal profiles
            const filtered = matches.filter(url => {
                const lower = url.toLowerCase();
                return !lower.includes('/coldwellbanker') &&
                    !lower.includes('/cbglobal') &&
                    !lower.includes('/company/');
            });
            if (filtered.length > 0) {
                social[platform as keyof typeof social] = filtered[0];
            } else if (matches.length > 0) {
                // Fallback to any match
                social[platform as keyof typeof social] = matches[0];
            }
        }
    }

    return social;
}

/**
 * Extract office information
 */
function extractOfficeInfo(markdown: string, html?: string): { name: string | null; address: string | null } {
    // Office name patterns - look for "Coldwell Banker" brokerages
    let officeName: string | null = null;

    // First try: Look for explicit "Coldwell Banker <Brokerage> - Location"
    const cbBrokerageMatch = markdown.match(/Coldwell\s+Banker\s+([A-Za-z]+(?:\s+[A-Za-z]+)?(?:,\s*Realtors?)?)\s*[-–]?\s*([A-Za-z\s]{3,30})?/i);
    if (cbBrokerageMatch) {
        const brokerage = cbBrokerageMatch[1]?.trim();
        const location = cbBrokerageMatch[2]?.trim();
        if (brokerage && !['License', 'Agent', 'About', 'Contact'].includes(brokerage)) {
            officeName = `Coldwell Banker ${brokerage}`;
            if (location && !['License', 'Agent', 'About', 'Contact'].includes(location)) {
                officeName += ` - ${location}`;
            }
        }
    }

    // Fallback: Just use "Coldwell Banker Realty" if found
    if (!officeName && markdown.match(/Coldwell\s+Banker\s+Realty/i)) {
        officeName = 'Coldwell Banker Realty';
    }

    // Common street suffixes for address matching
    const STREET_SUFFIXES_SHORT = 'Blvd|St|Ave|Rd|Dr|Ln|Way|Ct|Pkwy|Pl|Cir|Trl|Ter|Loop|Run|Path';
    const STREET_SUFFIXES_LONG = 'Boulevard|Blvd|Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Way|Court|Ct|Parkway|Pkwy|Place|Pl|Circle|Cir|Trail|Trl|Terrace|Ter|Loop|Run|Path|Commons|Crossing|Plaza';

    // ADDRESS EXTRACTION - Multiple strategies
    let address: string | null = null;

    // Strategy 0: DOM-Based - Look for address links/text in the office section (Most Reliable)
    if (!address && html) {
        try {
            const $ = cheerio.load(html);

            // Look for links that contain a zip code (common for map links to office address)
            $('a[href*="map"], a[href*="google"], a[href*="direction"]').each((_, el) => {
                if (address) return;
                const text = $(el).text().trim();
                if (/\d{5}/.test(text) && text.length > 10 && text.length < 120) {
                    address = text.replace(/\s+/g, ' ').trim();
                }
            });

            // Fallback: Look for any element near "Office" heading that has an address-like text with zip code
            if (!address) {
                $('h1, h2, h3, h4, h5, h6').each((_, headerEl) => {
                    if (address) return;
                    const headerText = $(headerEl).text().trim().toLowerCase();
                    if (headerText.includes('office') || headerText.includes('location')) {
                        // Search the parent section for address-like text
                        const section = $(headerEl).parent();
                        section.find('a, p, span, div, address').each((_, childEl) => {
                            if (address) return;
                            const text = $(childEl).text().trim();
                            if (/\d{5}/.test(text) && text.length > 10 && text.length < 120) {
                                address = text.replace(/\s+/g, ' ').trim();
                            }
                        });
                    }
                });
            }
        } catch (e) {
            console.log('[Address] DOM extraction error:', e);
        }
    }

    // Strategy 1: Look for address in map links [Address Text](map_url)
    if (!address) {
        const mapLinkMatch = markdown.match(/\[([^\]]*\d{5}[^\]]*)\]\([^)]*(?:map|google|maps)[^)]*\)/i);
        if (mapLinkMatch && mapLinkMatch[1]) {
            address = mapLinkMatch[1].trim();
        }
    }

    // Strategy 2: Look for address near "Office" section with flexible format
    if (!address) {
        // Match: Street Number + Street Name + (optional Suite) + City + State + Zip
        const officeAddressMatch = markdown.match(
            new RegExp(`(?:Office|Location|Address)[:\\s\\S]{0,100}?(\\d+\\s+[A-Za-z0-9\\s]+(?:${STREET_SUFFIXES_SHORT})[,.\\s]+(?:Ste\\.?|Suite)?\\s*\\d*[,.\\s]+[A-Za-z\\s]+,?\\s*[A-Z]{2}\\s*\\d{5})`, 'i')
        );
        if (officeAddressMatch && officeAddressMatch[1]) {
            address = officeAddressMatch[1].replace(/\s+/g, ' ').trim();
        }
    }

    // Strategy 3: Broad search for any US address pattern
    if (!address) {
        const broadMatch = markdown.match(
            new RegExp(`(\\d+\\s+[A-Za-z0-9\\s]+(?:${STREET_SUFFIXES_LONG})[,.\\s]+(?:Ste\\.?|Suite\\.?)?\\s*\\d*[,.\\s]*[A-Za-z\\s]+,\\s*[A-Z]{2}\\s*\\d{5})`, 'i')
        );
        if (broadMatch && broadMatch[1]) {
            address = broadMatch[1].replace(/\s+/g, ' ').trim();
        }
    }

    return { name: officeName, address };
}

/**
 * Extract bio from Meta tags (Fallback)
 */
function extractBioFromMeta(html?: string): string | null {
    if (!html) return null;

    // Check various meta descriptions
    const patterns = [
        /<meta\s+property="og:description"\s+content="([^"]*)"/i,
        /<meta\s+name="description"\s+content="([^"]*)"/i,
        /<meta\s+name="twitter:description"\s+content="([^"]*)"/i
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
            // content might be HTML encoded
            let text = match[1];
            // Simple decode
            text = text.replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'");
            return text;
        }
    }
    return null;
}

/**
 * Extract bio from JSON-LD Schema (Preferred method for full text)
 */
function extractBioFromJsonLd(html?: string): string | null {
    if (!html) {
        console.log('[JSON-LD] No HTML content provided');
        return null;
    }

    try {
        // Relaxed regex to capture script content - handle attributes and spacing
        const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

        if (!jsonLdMatches) {
            console.log(`[JSON-LD] No LD+JSON script tags found in ${html.length} bytes of HTML`);
            return null;
        }

        console.log(`[JSON-LD] Found ${jsonLdMatches.length} script tags`);

        for (const match of jsonLdMatches) {
            // Strip tags to get raw JSON
            const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
            try {
                const data = JSON.parse(jsonContent);

                // data could be an object or array of objects
                const entities = Array.isArray(data) ? data : [data];

                for (const entity of entities) {
                    const type = entity['@type'];
                    // console.log(`[JSON-LD] Inspecting entity: ${type}`);

                    if (['Person', 'RealEstateAgent', 'ProfilePage'].includes(type)) {
                        if (entity.description) {
                            console.log(`[JSON-LD] Found bio in ${type}`);
                            return entity.description;
                        }
                        // Check nested 'about'
                        if (entity.about && entity.about.description) {
                            console.log(`[JSON-LD] Found bio in ${type}.about`);
                            return entity.about.description;
                        }
                        // Check 'mainEntity'
                        if (entity.mainEntity && entity.mainEntity.description) {
                            console.log(`[JSON-LD] Found bio in ${type}.mainEntity`);
                            return entity.mainEntity.description;
                        }
                    }
                }
            } catch (e) {
                // Ignore parse errors for individual blocks
                continue;
            }
        }
    } catch (e) {
        console.error('Error parsing JSON-LD:', e);
    }

    return null;
}

/**
 * Main extraction function for Coldwell Banker profiles
 */
/**
 * Extract bio from HTML using Cheerio (Best for hidden/truncated DOM elements)
 */
function extractBioFromHtml(html?: string): string | null {
    if (!html) return null;

    try {
        const $ = cheerio.load(html);

        // Strategy 1: Specific class identified by user (Truncated text container)
        // Matches class containing "AgentProfile_clipText" or "clipText"
        const specificClass = $('[class*="AgentProfile_clipText"], [class*="clipText"]');
        if (specificClass.length > 0) {
            return specificClass.text().trim();
        }

        // Strategy 2: "About <Name>" section logic
        // Look for headers that contain "About" and take the next paragraph
        let targetP: string | null = null;
        $('h1, h2, h3, h4, h5').each((_, el) => {
            const text = $(el).text().trim();
            if (text.includes('About')) {
                // Return the text of the next p sibling or the next div's text
                const nextP = $(el).next('p');
                if (nextP.length) {
                    targetP = nextP.text().trim();
                    return false; // break
                }
                const nextDiv = $(el).next('div');
                if (nextDiv.length) {
                    targetP = nextDiv.text().trim();
                    return false;
                }
            }
        });

        if (targetP) {
            return targetP;
        }

    } catch (e) {
        console.error('Error parsing HTML bio:', e);
    }

    return null;
}

function extractLicense(markdown: string): string | null {
    // Look for common license patterns: "Lic # 123", "DRE # 123", "TREC # 123"
    const regex = /(?:Lic(?:ense)?|DRE|TREC|CalDRE|BRE)[.\s#]*(?:Number|No\.?|[#:])?[\s]*([0-9A-Z-]{4,})/i;
    const match = markdown.match(regex);
    return match ? match[1].trim() : null;
}

/**
 * Main extraction function for Coldwell Banker profiles
 */
export async function extractCBProfile(profileUrl: string): Promise<CBAgentProfile> {
    console.log(`[CB Extractor] Extracting from: ${profileUrl}`);

    const errors: string[] = [];

    // Scrape the page
    const scrapeResult = await scrapePage(profileUrl);

    if (!scrapeResult.success || !scrapeResult.data?.markdown) {
        console.error('[CB Extractor] Failed to scrape page');
        return {
            full_name: '',
            email: null,
            mobile_phone: null,
            office_phone: null,
            all_phones: [],
            headshot_url: null,
            logo_url: null,
            brokerage_logo_url: '/assets/cb-realty-logo.jpg',
            bio: null,
            office_name: null,
            office_address: null,
            license_number: null,
            social_links: { linkedin: null, facebook: null, instagram: null, twitter: null, youtube: null },
            profile_url: profileUrl,
            extraction_success: false,
            extraction_errors: ['Failed to scrape page: ' + (scrapeResult.error || 'Unknown error')]
        };
    }

    const markdown = scrapeResult.data.markdown;
    const html = scrapeResult.data.html; // New field
    console.log(`[CB Extractor] Scraped ${markdown.length} markdown chars`);
    if (html) {
        console.log(`[CB Extractor] Scraped ${html.length} HTML chars`);
        // Debug: Save HTML to file for analysis
        const fs = require('fs');
        try {
            fs.writeFileSync('debug_html.html', html, 'utf8');
            console.log('[CB Extractor] Saved HTML to debug_html.html');
        } catch (e) {
            console.log('[CB Extractor] Could not save debug HTML');
        }
    }

    // Extract all fields
    const name = extractName(markdown);
    if (!name) errors.push('Could not extract name');

    const emails = extractEmails(markdown);
    const phones = extractPhones(markdown);
    const headshotUrl = extractHeadshotUrl(markdown, html);
    const logoUrl = extractLogoUrl(markdown, html);
    const socialLinks = extractSocialLinks(markdown);
    const officeInfo = extractOfficeInfo(markdown, html);
    const licenseNumber = extractLicense(markdown);

    // BIO STRATEGY: JSON-LD > DOM (Cheerio) > Meta Tags > Markdown
    // We prioritize DOM/JSON-LD as they are likely the full text sources
    const jsonLdBio = extractBioFromJsonLd(html);
    const htmlBio = extractBioFromHtml(html);
    const metaBio = extractBioFromMeta(html);
    const markdownBio = extractBio(markdown);

    let bioSource = 'None';
    let bio: string | null = null;

    if (jsonLdBio && jsonLdBio.length > 50) {
        bio = jsonLdBio;
        bioSource = 'JSON-LD';
    } else if (htmlBio && htmlBio.length > 50) {
        bio = htmlBio;
        bioSource = 'HTML (DOM)';
    } else if (metaBio && metaBio.length > (markdownBio?.length || 0)) {
        bio = metaBio;
        bioSource = 'Meta Tag';
    } else {
        bio = markdownBio;
        bioSource = 'Markdown (Scraped)';
    }

    if (emails.length === 0) errors.push('No email found');
    if (phones.length === 0) errors.push('No phone found');
    if (!headshotUrl) errors.push('No headshot found');

    // Assign phones: first is mobile, second is office (if available)
    const mobilePhone = phones.length > 0 ? phones[0] : null;
    const officePhone = phones.length > 1 ? phones[1] : null;

    const profile: CBAgentProfile = {
        full_name: name || '',
        email: emails[0] || null,
        mobile_phone: mobilePhone,
        office_phone: officePhone,
        all_phones: phones,
        headshot_url: headshotUrl,
        logo_url: logoUrl,
        brokerage_logo_url: '/assets/cb-realty-logo.jpg',
        bio,
        office_name: officeInfo.name,
        office_address: officeInfo.address,
        license_number: licenseNumber,
        social_links: socialLinks,
        profile_url: profileUrl,
        extraction_success: !!name && (emails.length > 0 || phones.length > 0),
        extraction_errors: errors
    };

    console.log('[CB Extractor] Extraction result:');
    console.log(`  Name: ${profile.full_name || '(not found)'}`);
    console.log(`  Email: ${profile.email || '(not found)'}`);
    console.log(`  Mobile: ${profile.mobile_phone || '(not found)'}`);
    console.log(`  Office: ${profile.office_phone || '(not found)'}`);
    console.log(`  All Phones: ${profile.all_phones.length > 0 ? profile.all_phones.join(', ') : '(none)'}`);
    console.log(`  Headshot: ${profile.headshot_url ? 'Found' : 'Not found'}`);
    console.log(`  Logo: ${profile.logo_url ? 'Found' : 'Not found'}`);
    console.log(`  Social: ${Object.values(profile.social_links).filter(Boolean).length} found`);
    console.log(`  Bio: ${bio ? 'Found (' + bio.length + ' chars)' : 'Not found'}, Source: ${bioSource}`);
    console.log(`  Success: ${profile.extraction_success}`);

    return profile;
}

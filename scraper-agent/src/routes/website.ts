
import { Router } from 'express';
import { getLeadBySlug } from '../services/db';

const router = Router();

// Get Website by Slug (Public) - LEFT PUBLIC
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const slugValue = Array.isArray(slug) ? slug[0] : slug;

        console.log(`[API] Fetching website: ${slugValue}`);

        const result = await getLeadBySlug(slugValue);

        if (!result.success || !result.data) {
            return res.status(404).json({ error: 'Website not found' });
        }

        res.json(result.data);
    } catch (error: any) {
        console.error('[API] Error fetching website:', error);
        res.status(500).json({ error: 'Failed to fetch website' });
    }
});

export const websiteRoutes = router;


import { Router } from 'express';
import { verifySupabaseUser, AuthenticatedRequest } from '../middleware/supabaseAuth';
import { extractCBProfile } from '../extractors/coldwellbanker';
import { saveProfile, getLeads, deleteLead, updateLeadConfig, updateLead } from '../services/db';

const router = Router();

// CB Profile Extraction - PROTECTED
router.post('/extract', verifySupabaseUser, async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // Validate it's a CB URL
    if (!url.includes('coldwellbanker.com')) {
        return res.status(400).json({ error: 'URL must be from coldwellbanker.com' });
    }

    try {
        console.log(`[API] Extracting profile from: ${url}`);
        const profile = await extractCBProfile(url);

        if (!profile.extraction_success) {
            // If provided extracted data but marked as failed, return it with 422
            return res.status(422).json(profile);
        }

        // Block agents without an email — nothing useful can be done with them
        if (!profile.email) {
            return res.status(422).json({
                ...profile,
                extraction_success: false,
                extraction_errors: ['No email address found for this agent. Profile not saved.']
            });
        }

        // Auto-Save to Database
        console.log('[API] Auto-saving profile to Lead Management System...');
        const saveResult = await saveProfile(profile);

        // Return profile with save status
        res.json({
            ...profile,
            saved_to_db: saveResult.success,
            db_id: saveResult.id,
            db_error: saveResult.error
        });

    } catch (error: any) {
        console.error('[API] Extraction error:', error);
        res.status(500).json({ error: error.message || 'Extraction failed' });
    }
});

// Get All Leads - PROTECTED
router.get('/leads', verifySupabaseUser, async (req, res) => {
    try {
        console.log('[API] Fetching leads...');
        const result = await getLeads();

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json(result.data);
    } catch (error: any) {
        console.error('[API] Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// Delete Lead - PROTECTED
router.delete('/leads/:id', verifySupabaseUser, async (req, res) => {
    try {
        const { id } = req.params;
        const leadId = Array.isArray(id) ? id[0] : id; // Handle potential array from params

        console.log(`[API] Deleting lead: ${leadId}`);

        const result = await deleteLead(leadId);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error deleting lead:', error);
        res.status(500).json({ error: 'Failed to delete lead' });
    }
});

// Update Lead Website Config (slug, published)
router.patch('/leads/:id/config', verifySupabaseUser, async (req, res) => {
    try {
        const { id } = req.params;
        const leadId = Array.isArray(id) ? id[0] : id;

        const { website_slug, website_published } = req.body;
        console.log(`[API] Updating lead config: ${leadId}`, { website_slug, website_published });

        const result = await updateLeadConfig(leadId, { website_slug, website_published });

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error updating lead config:', error);
        res.status(500).json({ error: 'Failed to update lead config' });
    }
});

// Update Lead Profile Data - PROTECTED
router.patch('/leads/:id', verifySupabaseUser, async (req, res) => {
    try {
        const { id } = req.params;
        const leadId = Array.isArray(id) ? id[0] : id;

        // Whitelist allowed fields to prevent privilege escalation
        // Excludes: is_paid, password_hash, stripe_*, trial_started_at, website_slug, website_published
        const allowedFields = [
            'full_name', 'bio', 'primary_email', 'primary_phone',
            'office_name', 'office_address', 'office_phone',
            'headshot_url', 'logo_url', 'brokerage_logo_url',
            'facebook_url', 'linkedin_url', 'instagram_url',
            'twitter_url', 'youtube_url', 'license_number', 'brokerage',
            'cold_call_status', 'cold_call_notes', 'cold_call_date'
        ];
        const updateData: Record<string, any> = {};
        for (const key of allowedFields) {
            if (key in req.body) updateData[key] = req.body[key];
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        console.log(`[API] Updating lead profile: ${leadId} (fields: ${Object.keys(updateData).join(', ')})`);

        const result = await updateLead(leadId, updateData);

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error updating lead:', error);
        res.status(500).json({ error: 'Failed to update lead' });
    }
});

export const leadsRoutes = router;

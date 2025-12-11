import { Router, Response } from 'express';
import { generateQuestions } from '../services/questionService';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { MatchService } from '../services/matchService';

const router = Router();

// Route de test : créer une partie solo
// Usage: GET /api/test/solo (nécessite authentification)
router.get('/solo', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    // Générer les questions
    const questions = generateQuestions(`test-${userId}-${Date.now()}`, 20);
    
    // Créer un match fictif pour avoir un matchId
    const fakeMatch = MatchService.create(userId, userId, questions);
    
    res.json({
      matchId: fakeMatch.id,
      isSolo: true,
      opponent: { id: userId, username: 'Bot' },
      questions,
    });
  } catch (error: any) {
    console.error('Solo test error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du test solo' });
  }
});

export default router;

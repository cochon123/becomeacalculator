import { Router, Response } from 'express';
import { UserService } from '../services/userService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Leaderboard
router.get('/', (req, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const leaderboard = UserService.getLeaderboard(limit);

    res.json({
      leaderboard: leaderboard.map(user => ({
        id: user.id,
        username: user.username,
        elo: user.elo,
        games_played: user.games_played,
        games_won: user.games_won,
        win_rate: user.games_played > 0 ? ((user.games_won / user.games_played) * 100).toFixed(1) : '0.0',
      })),
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Stats utilisateur
router.get('/user/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const user = UserService.findById(userId);

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      elo: user.elo,
      games_played: user.games_played,
      games_won: user.games_won,
      win_rate: user.games_played > 0 ? ((user.games_won / user.games_played) * 100).toFixed(1) : '0.0',
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

import { Question } from '../types';

/**
 * Générateur déterministe de questions de calcul mental
 * Basé sur un seed pour garantir que deux joueurs reçoivent les mêmes questions
 */

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Linear Congruential Generator (LCG)
  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export function generateQuestions(
  matchId: string,
  count: number = 20,
  startDifficulty: number = 1
): Question[] {
  // Seed basé sur matchId pour garantir reproductibilité
  const seed = hashString(matchId);
  const rng = new SeededRandom(seed);
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    // Progression de difficulté : plus de mul/div avec l'avancement
    const progress = i / count;
    const difficulty = startDifficulty + progress * 3;

    // Probabilités selon difficulté
    let op: '+' | '-' | '*' | '/';
    const roll = rng.next();

    if (difficulty < 1.5) {
      // Facile : surtout addition/soustraction
      op = roll < 0.6 ? '+' : roll < 0.9 ? '-' : roll < 0.95 ? '*' : '/';
    } else if (difficulty < 2.5) {
      // Moyen : équilibre
      op = roll < 0.3 ? '+' : roll < 0.5 ? '-' : roll < 0.8 ? '*' : '/';
    } else {
      // Difficile : plus de mul/div
      op = roll < 0.15 ? '+' : roll < 0.25 ? '-' : roll < 0.7 ? '*' : '/';
    }

    questions.push(generateQuestion(rng, op, difficulty));
  }

  return questions;
}

function generateQuestion(
  rng: SeededRandom,
  op: '+' | '-' | '*' | '/',
  difficulty: number
): Question {
  let a: number, b: number, answer: number;

  // Plages selon difficulté
  const maxNum = Math.min(10 + Math.floor(difficulty * 10), 100);

  switch (op) {
    case '+':
      a = rng.range(1, maxNum);
      b = rng.range(1, maxNum);
      answer = a + b;
      break;

    case '-':
      // S'assurer que a > b pour éviter négatifs
      a = rng.range(10, maxNum);
      b = rng.range(1, a);
      answer = a - b;
      break;

    case '*':
      // Simplifier les multiplications : x <= 10, y <= 100
      a = rng.range(2, 10);
      b = rng.range(2, 100);
      answer = a * b;
      break;

    case '/':
      // Division avec résultat entier garanti
      b = rng.range(2, Math.min(maxNum, 15));
      const quotient = rng.range(2, Math.min(maxNum, 20));
      a = b * quotient;
      answer = quotient;
      break;
  }

  return { op, a, b, answer };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function validateAnswer(question: Question, userAnswer: number): boolean {
  return question.answer === userAnswer;
}

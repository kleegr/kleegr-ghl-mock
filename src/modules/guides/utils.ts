import type { TutorialDef } from './tutorialDefs';

/** Sum the estimated minutes across a list of tutorials. */
export function totalEstMinutes(tutorials: TutorialDef[]): number {
  return tutorials.reduce((sum, t) => sum + t.estMinutes, 0);
}

/** Group tutorials by their area label. */
export function groupByArea(tutorials: TutorialDef[]): Record<string, TutorialDef[]> {
  return tutorials.reduce<Record<string, TutorialDef[]>>((acc, t) => {
    if (!acc[t.area]) acc[t.area] = [];
    acc[t.area].push(t);
    return acc;
  }, {});
}

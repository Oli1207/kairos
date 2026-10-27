import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play } from 'lucide-react';
import { GUIDE } from '../data/guide';
import { Button } from '../components/ui';
import Tour from '../components/Tour';
import GuideSection from '../components/GuideSection';
import { PageHeader } from '../components/Layout';

/** Le didacticiel complet : toutes les fonctions, pas a pas. */
export default function Guide() {
  const [params] = useSearchParams();
  const [open, setOpen] = useState(params.get('section') || 'demarrer');
  const [tour, setTour] = useState(false);
  return (
    <div>
      <PageHeader kicker="Didacticiel" title="Le guide de Kairos" sub="Tout ce que l'app sait faire, et comment t'en servir." />
      <Button variant="secondary" icon={Play} className="mb-5 w-full sm:w-auto" onClick={() => setTour(true)}>Revoir la visite d'accueil</Button>
      <div className="divide-y divide-line border-y border-line">
        {GUIDE.map((s, n) => (
          <GuideSection key={s.key} section={s} index={n} open={open === s.key} onToggle={() => setOpen(open === s.key ? null : s.key)} />
        ))}
      </div>
      {tour && <Tour onClose={() => setTour(false)} />}
    </div>
  );
}

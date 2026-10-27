import { useSearchParams } from 'react-router-dom';
import { useHabits } from '../hooks/useData';
import { Tabs } from '../components/ui';
import Deck from '../components/Deck';
import { PageHeader } from '../components/Layout';
import Hub from './etudes/Hub';
import Courses from './etudes/Courses';
import Assignments from './etudes/Assignments';
import Reading from './etudes/Reading';
import Speaking from './etudes/Speaking';
import Argument from './etudes/Argument';
import English from './etudes/English';
import Finance from './etudes/Finance';
import Content from './etudes/Content';

const TABS = [
  ['plan', 'Tableau de bord'], ['matieres', 'Matières'], ['devoirs', 'Devoirs'], ['mots', 'Mots'], ['lecture', 'Lecture'], ['oral', 'Oral'], ['argument', 'Argumenter'],
  ['anglais', 'Anglais'], ['finance', 'Finance'], ['contenu', 'Contenu'],
];

export default function Etudes() {
  const [params, setParams] = useSearchParams();
  // « cours » : ancien nom de l'onglet, garde pour les liens deja enregistres.
  const raw = params.get('onglet') || 'plan';
  const tab = raw === 'cours' ? 'plan' : raw;
  const go = (v) => setParams({ onglet: v }, { replace: true });
  const { data: habits = [] } = useHabits();
  return (
    <div>
      <PageHeader kicker="Études et passion" title="Études" help="etudes" sub="Avancer un peu chaque jour pour ne jamais être submergée." />
      <Tabs tabs={TABS} value={tab} onChange={go} />
      <div className="mt-5">
        {tab === 'plan' && <Hub habits={habits} onTab={go} />}
        {tab === 'matieres' && <Courses />}
        {tab === 'devoirs' && <Assignments habits={habits} />}
        {tab === 'mots' && (
          <>
            <p className="mb-4 text-sm text-muted">Ton vocabulaire pour l'art oratoire. Chaque jour, un de ces mots t'est proposé « à placer » dans une vraie conversation.</p>
            <Deck deck="mots" habits={habits} />
          </>
        )}
        {tab === 'lecture' && <Reading habits={habits} />}
        {tab === 'oral' && <Speaking habits={habits} />}
        {tab === 'argument' && <Argument habits={habits} />}
        {tab === 'anglais' && <English habits={habits} />}
        {tab === 'finance' && <Finance habits={habits} />}
        {tab === 'contenu' && <Content habits={habits} openIdea={params.get('idee') === '1'} />}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { BookOpen, Plus, Quote, Star } from 'lucide-react';
import { useRows, useSave } from '../../hooks/useData';
import { useAutoCheck } from '../../hooks/useCheck';
import { longDate, shortDate, today } from '../../lib/dates';
import { readingPace } from '../../lib/engine';
import { Button, Card, Chips, Empty, Field, Input, SectionTitle, Sheet, Textarea } from '../../components/ui';
import Soleil from '../../components/Soleil';

export default function Reading({ habits }) {
  const { data: books = [] } = useRows('books', { build: (q) => q.order('created_at', { ascending: false }) });
  const { data: logs = [] } = useRows('reading_logs', { build: (q) => q.order('day', { ascending: false }).limit(200) });
  const { data: quotes = [] } = useRows('quotes', { build: (q) => q.order('created_at', { ascending: false }).limit(50) });
  const saveBook = useSave('books');
  const saveLog = useSave('reading_logs');
  const saveQuote = useSave('quotes');
  const autoCheck = useAutoCheck(habits);
  const [adding, setAdding] = useState(false);
  const [logging, setLogging] = useState(null);
  const [finishing, setFinishing] = useState(null);
  const [quoting, setQuoting] = useState(null);

  const reading = books.filter((b) => b.status === 'en_cours');
  const queue = books.filter((b) => b.status === 'a_lire');
  const done = books.filter((b) => b.status === 'fini');
  const todayPages = logs.filter((l) => l.day === today()).reduce((s, l) => s + l.pages, 0);

  const logPages = (book, page) => {
    const pages = Math.max(0, page - (book.current_page || 0));
    if (!pages) { setLogging(null); return; }
    saveLog.mutate({ book_id: book.id, pages });
    const finished = book.total_pages && page >= book.total_pages;
    saveBook.mutate({ id: book.id, current_page: page }, {
      onSuccess: () => { setLogging(null); if (finished) setFinishing(book); },
    });
    // ~15 pages valent une vraie seance de lecture ; en dessous, c'est la version legere.
    autoCheck('lecture', pages >= 15 ? null : 0);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{todayPages ? `${todayPages} pages lues aujourd'hui.` : 'Pas encore lu aujourd\'hui.'}</p>
        <Button size="sm" icon={Plus} onClick={() => setAdding(true)}>Livre</Button>
      </div>

      {!reading.length && <Empty title="Aucune lecture en cours">Un roman pour la langue, un document pour la pensée. Ajoute ce que tu lis.</Empty>}
      {reading.map((b) => {
        const pace = readingPace(b, logs);
        return (
          <Card key={b.id} domain="etudes" className="p-4">
            <div className="flex gap-4">
              <Soleil value={b.total_pages ? b.current_page / b.total_pages : 0} size={78} petals={20} tones={['orange', 'jaune']}>
                <span className="text-[0.7rem] font-bold num">{b.total_pages ? Math.round((b.current_page / b.total_pages) * 100) : 0} %</span>
              </Soleil>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-orange">{b.kind === 'roman' ? 'Roman' : 'Document'}</p>
                <p className="font-display text-lg font-bold leading-tight">{b.title}</p>
                {b.author && <p className="text-sm text-muted">{b.author}</p>}
                <p className="mt-1 text-sm num">p. {b.current_page}{b.total_pages ? ` / ${b.total_pages}` : ''}</p>
                {pace.perDay > 0 && <p className="text-xs text-muted">{pace.perDay.toFixed(1).replace('.', ',')} p./jour{pace.eta ? ` · fini vers le ${longDate(pace.eta)}` : ''}</p>}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" icon={BookOpen} onClick={() => setLogging(b)}>J'ai lu</Button>
              <Button size="sm" variant="secondary" icon={Quote} onClick={() => setQuoting(b)}>Citation</Button>
              <Button size="sm" variant="ghost" onClick={() => setFinishing(b)}>Terminé</Button>
            </div>
          </Card>
        );
      })}

      {queue.length > 0 && (
        <div>
          <SectionTitle>À lire ensuite</SectionTitle>
          <ul className="divide-y divide-line border-y border-line">
            {queue.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2 py-2">
                <span><b>{b.title}</b>{b.author && <span className="text-muted"> · {b.author}</span>}</span>
                <Button size="sm" variant="secondary" onClick={() => saveBook.mutate({ id: b.id, status: 'en_cours', started_on: today() })}>Commencer</Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {quotes.length > 0 && (
        <div>
          <SectionTitle>Mes citations</SectionTitle>
          <div className="space-y-2">
            {quotes.slice(0, 8).map((q) => (
              <blockquote key={q.id} className="border-l-4 border-orange bg-paper p-3 text-sm">
                <p className="italic">« {q.text} »</p>
                <p className="mt-1 text-xs text-muted">{books.find((b) => b.id === q.book_id)?.title}{q.page ? `, p. ${q.page}` : ''}</p>
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <SectionTitle>Lus cette saison <span className="font-normal text-muted">({done.length})</span></SectionTitle>
          <ul className="divide-y divide-line border-y border-line text-sm">
            {done.map((b) => (
              <li key={b.id} className="py-2">
                <div className="flex justify-between gap-2">
                  <b>{b.title}</b>
                  <span className="flex text-jaune">{Array.from({ length: b.rating || 0 }, (_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</span>
                </div>
                {b.review && <p className="text-muted">{b.review}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <AddBook open={adding} onClose={() => setAdding(false)} onSave={(row) => saveBook.mutate(row, { onSuccess: () => setAdding(false) })} />
      {logging && <LogSheet book={logging} onClose={() => setLogging(null)} onSave={(page) => logPages(logging, page)} />}
      {finishing && <FinishSheet book={finishing} onClose={() => setFinishing(null)} onSave={(f) => saveBook.mutate({ id: finishing.id, status: 'fini', finished_on: today(), ...f }, { onSuccess: () => setFinishing(null) })} />}
      {quoting && <QuoteSheet book={quoting} onClose={() => setQuoting(null)} onSave={(f) => saveQuote.mutate({ book_id: quoting.id, ...f }, { onSuccess: () => setQuoting(null) })} />}
    </div>
  );
}

function AddBook({ open, onClose, onSave }) {
  const [f, setF] = useState({ title: '', author: '', kind: 'roman', total_pages: '', status: 'en_cours' });
  return (
    <Sheet open={open} onClose={onClose} title="Nouveau livre">
      <div className="space-y-3">
        <Chips options={[['roman', 'Roman'], ['document', 'Document']]} value={f.kind} onChange={(v) => setF({ ...f, kind: v || 'roman' })} />
        <Field label="Titre"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Auteur"><Input value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} /></Field>
        <Field label="Nombre de pages"><Input type="number" min={1} value={f.total_pages} onChange={(e) => setF({ ...f, total_pages: e.target.value })} /></Field>
        <Chips options={[['en_cours', 'Je le lis'], ['a_lire', 'À lire plus tard']]} value={f.status} onChange={(v) => setF({ ...f, status: v || 'en_cours' })} />
        <Button className="w-full" disabled={!f.title.trim()} onClick={() => {
          onSave({ ...f, title: f.title.trim(), total_pages: Number(f.total_pages) || 0, started_on: f.status === 'en_cours' ? today() : null });
          setF({ title: '', author: '', kind: 'roman', total_pages: '', status: 'en_cours' });
        }}>Ajouter</Button>
      </div>
    </Sheet>
  );
}

function LogSheet({ book, onClose, onSave }) {
  const [page, setPage] = useState(String(book.current_page || ''));
  return (
    <Sheet open onClose={onClose} title={book.title}>
      <div className="space-y-3">
        <Field label="Je suis arrivée à la page" hint={`Tu étais page ${book.current_page}.`}>
          <Input type="number" inputMode="numeric" value={page} onChange={(e) => setPage(e.target.value)} autoFocus />
        </Field>
        <Button className="w-full" disabled={!(Number(page) > book.current_page)} onClick={() => onSave(Number(page))}>Enregistrer</Button>
      </div>
    </Sheet>
  );
}

function FinishSheet({ book, onClose, onSave }) {
  const [rating, setRating] = useState(null);
  const [review, setReview] = useState('');
  return (
    <Sheet open onClose={onClose} title="Fiche de lecture">
      <p className="mb-3 font-display text-xl font-bold">{book.title}</p>
      <div className="space-y-3">
        <Field label="Ma note">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} étoiles`}>
                <Star className={`h-8 w-8 ${rating >= n ? 'fill-[var(--jaune)] text-jaune' : 'text-line'}`} />
              </button>
            ))}
          </div>
        </Field>
        <Field label="Ce que j'en retiens" hint="L'idée principale, un personnage, ce que ça a changé pour toi.">
          <Textarea value={review} onChange={(e) => setReview(e.target.value)} rows={4} />
        </Field>
        <Button className="w-full" onClick={() => onSave({ rating, review })}>Ranger dans mes lectures</Button>
      </div>
    </Sheet>
  );
}

function QuoteSheet({ book, onClose, onSave }) {
  const [text, setText] = useState('');
  const [page, setPage] = useState(String(book.current_page || ''));
  return (
    <Sheet open onClose={onClose} title="Garder une citation">
      <div className="space-y-3">
        <Field label="Citation"><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} autoFocus /></Field>
        <Field label="Page"><Input type="number" value={page} onChange={(e) => setPage(e.target.value)} /></Field>
        <p className="text-xs text-muted">{shortDate(today())} · {book.title}</p>
        <Button className="w-full" disabled={!text.trim()} onClick={() => onSave({ text: text.trim(), page: Number(page) || null })}>Garder</Button>
      </div>
    </Sheet>
  );
}

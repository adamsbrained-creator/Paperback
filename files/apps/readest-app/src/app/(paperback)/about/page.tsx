'use client';

import Shell from '@/components/paperback/Shell';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <details className='pb-card pb-details'>
    <summary className='pb-title'>{title}</summary>
    <div className='pb-note' style={{ margin: '10px 0 0' }}>
      {children}
    </div>
  </details>
);

export default function AboutPage() {
  return (
    <Shell title='About'>
      <div className='pb-stack'>
        <div className='pb-fan' style={{ width: 130, height: 110, margin: '0 auto' }}>
          {['g3', 'g0', 'g2'].map((cv) => (
            <div key={cv} className='pb-thumb'>
              <div className={`pb-art ${cv}`} />
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className='pb-h1'>Paperback</div>
          <div className='pb-label'>Version 1.0.0 · personal build</div>
        </div>

        <Section title='Credits'>
          Paperback is built on Readest, an open-source ebook reader, and its contributors. Books are
          rendered with foliate-js. Design by you.
        </Section>
        <Section title='Open-source licenses'>
          Readest is released under the GNU Affero General Public License v3 (AGPL-3.0), and so is
          Paperback. The license text is the <b>LICENSE</b> file in the app&apos;s source repository,
          together with <b>NOTICE.md</b>. If you ever share this app with anyone else, you must also
          share its source code under the same license.
        </Section>
        <Section title='Your data'>
          Your library, notes, highlights and reading stats live on this device. Sync and account
          features inherited from Readest only run if you sign in from the Library menu.
        </Section>
      </div>
    </Shell>
  );
}
